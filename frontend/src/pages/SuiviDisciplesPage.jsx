import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser, getVisitors } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Users, Phone, Calendar, Heart, TrendingUp, Info, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

// Configuration des KPIs pour l'affichage de la méthode
const KPI_CONFIG = {
  presence_dimanche: { label: "Présence Culte Dimanche", poids: 3 },
  presence_fi: { label: "Présence FI", poids: 3 },
  presence_reunion_disciples: { label: "Présence Réunion Disciples", poids: 2 },
  service_eglise: { label: "Service à l'Église", poids: 2 },
  consommation_pain_jour: { label: "Consommation Pain du Jour", poids: 1 },
  bapteme: { label: "Baptême", poids: 1 }
};

// Niveaux de discipolat pour l'affichage
const DISCIPOLAT_LEVELS = {
  "Non classé": { color: "bg-gray-100 text-gray-600", emoji: "⚪", min: 0, max: 14 },
  "Débutant": { color: "bg-blue-100 text-blue-700", emoji: "🔵", min: 15, max: 30 },
  "Intermédiaire": { color: "bg-yellow-100 text-yellow-700", emoji: "🟡", min: 31, max: 51 },
  "Confirmé": { color: "bg-green-100 text-green-700", emoji: "🟢", min: 52, max: 100 }
};

const SuiviDisciplesPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [visitors, setVisitors] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disciples, setDisciples] = useState({});
  const [kpiStatuses, setKpiStatuses] = useState({});
  const [showMethodHelp, setShowMethodHelp] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Charger les visiteurs assignés
      const visitorsData = await getVisitors();
      setVisitors(visitorsData);
      
      // Créer le map des disciples
      const disciplesMap = {};
      visitorsData.forEach(v => {
        disciplesMap[v.id] = v.est_disciple || 'Non';
      });
      setDisciples(disciplesMap);
      
      // Charger les statuts KPI de tous les visiteurs
      const kpiResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/visitors/kpi/all-statuses`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (kpiResponse.ok) {
        const kpiData = await kpiResponse.json();
        setKpiStatuses(kpiData);
      }
      
      // Charger les contacts (personnes contactées)
      if (user.assigned_month) {
        const monthStr = String(user.assigned_month);
        const monthNum = monthStr.split('-')[1] || monthStr;
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/contacts/${user.city}/${monthNum}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        if (response.ok) {
          const contactsData = await response.json();
          setContacts(contactsData);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDisciple = async (visitorId, newStatus) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/visitors/${visitorId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            est_disciple: newStatus,
            date_devenu_disciple: newStatus === 'Oui' ? new Date().toISOString().split('T')[0] : null
          })
        }
      );
      
      if (response.ok) {
        setDisciples(prev => ({ ...prev, [visitorId]: newStatus }));
        toast.success('Statut mis à jour');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // Calculer les stats
  const totalDisciplesOui = Object.values(disciples).filter(d => d === 'Oui').length;
  const totalDisciplesEnCours = Object.values(disciples).filter(d => d === 'En Cours').length;
  const totalNon = visitors.length - totalDisciplesOui - totalDisciplesEnCours;

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Navigation rapide pour mobile - TOUJOURS visible sur mobile */}
        <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 md:hidden bg-white sticky top-0 z-50 pt-2 border-b">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-shrink-0"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-shrink-0"
            onClick={() => navigate('/visitors')}
          >
            Nouveaux
          </Button>
          <Button 
            variant="default" 
            size="sm"
            className="flex-shrink-0 bg-blue-600"
            onClick={() => navigate('/suivi-disciples')}
          >
            Disciples
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-shrink-0 bg-green-50 text-green-700 border-green-200"
            onClick={() => navigate('/reproduction')}
          >
            Reproduction
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Suivi Disciples</h2>
            <p className="text-gray-500 mt-1">
              {visitors.length} nouveaux arrivants + {contacts.length} personnes contactées = {visitors.length + contacts.length} total
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowMethodHelp(true)}>
            <HelpCircle className="h-4 w-4 mr-1" />
            Méthode KPI
          </Button>
        </div>

        {/* Compteurs */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">{totalDisciplesOui}</p>
              <p className="text-sm text-gray-600">Disciples (Oui)</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-orange-600">{totalDisciplesEnCours}</p>
              <p className="text-sm text-gray-600">En Cours</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-gray-600">{totalNon}</p>
              <p className="text-sm text-gray-600">Non encore</p>
            </CardContent>
          </Card>
        </div>

        {/* Section Nouveaux Arrivants Assignés */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Nouveaux Arrivants Assignés ({visitors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {visitors.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Aucun nouveau arrivant assigné</p>
              ) : (
                visitors.map((visitor) => {
                  // Utiliser les données KPI chargées
                  const kpiData = kpiStatuses[visitor.id] || {};
                  const levelName = kpiData.level || "Non classé";
                  const levelInfo = DISCIPOLAT_LEVELS[levelName] || DISCIPOLAT_LEVELS["Non classé"];
                  const score = kpiData.average_score || 0;
                  
                  return (
                    <div 
                      key={visitor.id}
                      className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/visitors/${visitor.id}`)}
                      data-testid={`visitor-row-${visitor.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{visitor.firstname} {visitor.lastname}</p>
                          {/* Badge KPI Discipolat */}
                          <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${levelInfo.color}`}>
                            <span>{levelInfo.emoji}</span>
                            <span>{levelName}</span>
                            {score > 0 && (
                              <span className="font-bold">({score})</span>
                            )}
                          </span>
                          {kpiData.months_count > 0 && (
                            <span className="text-xs text-gray-400">
                              ({kpiData.months_count} mois)
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {visitor.phone || '-'} • {visitor.visitor_type || visitor.types?.join(', ') || 'Nouveau arrivant'}
                        </p>
                      </div>
                      <Select
                        value={disciples[visitor.id] || 'Non'}
                        onValueChange={(value) => handleUpdateDisciple(visitor.id, value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Non">Non</SelectItem>
                          <SelectItem value="En Cours">En Cours</SelectItem>
                          <SelectItem value="Oui">Oui ✓</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section Personnes Contactées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-purple-600" />
              Personnes Contactées ({contacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contacts.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Aucune personne contactée. Ajoutez-en dans l'onglet Reproduction.
                </p>
              ) : (
                contacts.map((contact) => (
                  <div 
                    key={contact.id}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{contact.prenom} {contact.nom}</p>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          contact.type_contact === 'Evangelisation' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {contact.type_contact}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        {contact.telephone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.telephone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(contact.date_contact).toLocaleDateString('fr-FR')}
                        </span>
                        {contact.statut && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {contact.statut}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Méthode de calcul KPI */}
      <Dialog open={showMethodHelp} onOpenChange={setShowMethodHelp}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-purple-600" />
              Méthode de calcul - KPI Discipolat
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Formule</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                Score = Σ (Valeur × Coefficient)
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Critères et Coefficients</h4>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-2 text-left">Critère</th>
                    <th className="py-2 px-2 text-right">Poids</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(KPI_CONFIG).map(([key, config]) => (
                    <tr key={key} className="border-b">
                      <td className="py-1 px-2">{config.label}</td>
                      <td className="py-1 px-2 text-right font-medium text-purple-600">×{config.poids}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Niveaux de Discipolat</h4>
              <div className="space-y-1">
                {Object.entries(DISCIPOLAT_LEVELS).map(([name, level]) => (
                  <div key={name} className={`flex items-center justify-between p-2 rounded ${level.color}`}>
                    <span>{level.emoji} {name}</span>
                    <span className="text-sm">{level.min} - {level.max} pts</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
              <strong>Note:</strong> Le statut affiché est la <strong>moyenne</strong> des scores de tous les mois enregistrés pour chaque personne.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default SuiviDisciplesPage;
