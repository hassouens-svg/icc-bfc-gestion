import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser, getVisitors } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Users, Phone, Calendar, Heart, Info, HelpCircle, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

// Configuration des KPIs pour l'affichage de la méthode
const KPI_CONFIG = {
  presence_dimanche: { label: "Présence Dimanche Église", poids: 5 },
  presence_fi: { label: "Présence FI", poids: 2 },
  presence_reunion_disciples: { label: "Présence Réunion Disciples", poids: 3 },
  service_eglise: { label: "Service à l'Église", poids: 6 },
  consommation_pain_jour: { label: "Consommation Pain du Jour", poids: 5 },
  bapteme: { label: "Baptême", poids: 2 }
};

// Niveaux de discipolat pour l'affichage
const DISCIPOLAT_LEVELS = {
  "Non classé": { color: "bg-gray-100 text-gray-600", emoji: "⚪", min: 0, max: 19 },
  "Débutant": { color: "bg-blue-100 text-blue-700", emoji: "🔵", min: 20, max: 39 },
  "Intermédiaire": { color: "bg-yellow-100 text-yellow-700", emoji: "🟡", min: 40, max: 59 },
  "Confirmé": { color: "bg-green-100 text-green-700", emoji: "🟢", min: 60, max: 200 }
};

const SuiviDisciplesPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [visitors, setVisitors] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpiStatuses, setKpiStatuses] = useState({});
  const [showMethodHelp, setShowMethodHelp] = useState(false);
  const [showManualStatusDialog, setShowManualStatusDialog] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [manualStatusForm, setManualStatusForm] = useState({ level: '', commentaire: '' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const visitorsData = await getVisitors();
      setVisitors(visitorsData);
      
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
      
      // Charger les contacts
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

  const openManualStatusDialog = (visitor, e) => {
    e.stopPropagation();
    setSelectedVisitor(visitor);
    const kpiData = kpiStatuses[visitor.id] || {};
    setManualStatusForm({
      level: kpiData.manual_status || '',
      commentaire: kpiData.manual_commentaire || ''
    });
    setShowManualStatusDialog(true);
  };

  const handleSaveManualStatus = async () => {
    if (!selectedVisitor) return;
    
    try {
      // Convert "auto" to null for automatic status
      const statusValue = manualStatusForm.level === 'auto' || !manualStatusForm.level ? null : manualStatusForm.level;
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/visitors/${selectedVisitor.id}/manual-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            manual_status: statusValue,
            manual_commentaire: manualStatusForm.commentaire
          })
        }
      );
      
      if (response.ok) {
        toast.success('Statut manuel enregistré');
        setShowManualStatusDialog(false);
        loadData();
      } else {
        toast.error('Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  // Calculer les stats par niveau
  const countByLevel = Object.entries(DISCIPOLAT_LEVELS).map(([name, info]) => {
    const count = visitors.filter(v => {
      const kpiData = kpiStatuses[v.id] || {};
      const status = kpiData.manual_status || kpiData.level || "Non classé";
      return status === name;
    }).length;
    return { name, count, ...info };
  });

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
        {/* Navigation mobile */}
        <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 md:hidden bg-white sticky top-0 z-50 pt-2 border-b">
          <Button variant="outline" size="sm" className="flex-shrink-0" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
          <Button variant="outline" size="sm" className="flex-shrink-0" onClick={() => navigate('/visitors')}>
            Nouveaux
          </Button>
          <Button variant="default" size="sm" className="flex-shrink-0 bg-blue-600" onClick={() => navigate('/suivi-disciples')}>
            Disciples
          </Button>
          <Button variant="outline" size="sm" className="flex-shrink-0 bg-green-50 text-green-700 border-green-200" onClick={() => navigate('/reproduction')}>
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

        {/* Compteurs par niveau */}
        <div className="grid grid-cols-4 gap-3">
          {countByLevel.map(level => (
            <Card key={level.name} className={`${level.color} border-0`}>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold">{level.count}</p>
                <p className="text-sm flex items-center justify-center gap-1">
                  <span>{level.emoji}</span>
                  <span>{level.name}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Section Nouveaux Arrivants */}
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
                  const kpiData = kpiStatuses[visitor.id] || {};
                  const levelName = kpiData.manual_status || kpiData.level || "Non classé";
                  const levelInfo = DISCIPOLAT_LEVELS[levelName] || DISCIPOLAT_LEVELS["Non classé"];
                  const score = kpiData.average_score || 0;
                  const isManual = !!kpiData.manual_status;
                  
                  return (
                    <div 
                      key={visitor.id}
                      className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/visitor/${visitor.id}`)}
                      data-testid={`visitor-row-${visitor.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{visitor.firstname} {visitor.lastname}</p>
                          {/* Badge KPI Discipolat */}
                          <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${levelInfo.color}`}>
                            <span>{levelInfo.emoji}</span>
                            <span>{levelName}</span>
                            {!isManual && score > 0 && (
                              <span className="font-bold">({score})</span>
                            )}
                            {isManual && <span className="text-[10px]">(manuel)</span>}
                          </span>
                          {kpiData.months_count > 0 && !isManual && (
                            <span className="text-xs text-gray-400">
                              ({kpiData.months_count} mois)
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {visitor.phone || '-'} • {visitor.visitor_type || visitor.types?.join(', ') || 'Nouveau arrivant'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => openManualStatusDialog(visitor, e)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Statut manuel
                      </Button>
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
                  Aucune personne contactée. Ajoutez-en dans l&apos;onglet Reproduction.
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

      {/* Dialog Statut Manuel */}
      <Dialog open={showManualStatusDialog} onOpenChange={setShowManualStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Définir un statut manuel
              {selectedVisitor && (
                <span className="font-normal text-gray-500 ml-2">
                  - {selectedVisitor.firstname} {selectedVisitor.lastname}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Niveau de Disciple</Label>
              <Select 
                value={manualStatusForm.level} 
                onValueChange={(v) => setManualStatusForm({...manualStatusForm, level: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un niveau (ou laisser vide pour auto)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatique (basé sur KPIs)</SelectItem>
                  {Object.entries(DISCIPOLAT_LEVELS).map(([name, info]) => (
                    <SelectItem key={name} value={name}>
                      {info.emoji} {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Laissez vide pour utiliser le calcul automatique basé sur les KPIs
              </p>
            </div>
            <div>
              <Label className="mb-2 block">Commentaire</Label>
              <Textarea
                value={manualStatusForm.commentaire}
                onChange={(e) => setManualStatusForm({...manualStatusForm, commentaire: e.target.value})}
                placeholder="Raison du statut manuel, observations..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualStatusDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveManualStatus} className="bg-purple-600 hover:bg-purple-700">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <strong>Note:</strong> Le statut affiché est la <strong>moyenne</strong> des scores de tous les mois enregistrés.
              Un statut <strong>manuel</strong> peut être défini pour remplacer le calcul automatique.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default SuiviDisciplesPage;
