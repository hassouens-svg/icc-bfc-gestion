import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser, getVisitors } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Users, UserCheck, Phone, Calendar, Heart, TrendingUp, Info, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

// Niveaux de discipolat pour l'affichage
const DISCIPOLAT_LEVELS = {
  "Non classé": { color: "bg-gray-100 text-gray-600", emoji: "⚪" },
  "Débutant": { color: "bg-blue-100 text-blue-700", emoji: "🔵" },
  "Intermédiaire": { color: "bg-yellow-100 text-yellow-700", emoji: "🟡" },
  "Confirmé": { color: "bg-green-100 text-green-700", emoji: "🟢" }
};

const SuiviDisciplesPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [visitors, setVisitors] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disciples, setDisciples] = useState({});
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
                visitors.map((visitor) => (
                  <div 
                    key={visitor.id}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{visitor.firstname} {visitor.lastname}</p>
                      <p className="text-sm text-gray-500">
                        {visitor.phone || '-'} • {visitor.visitor_type || visitor.types?.join(', ') || 'Nouveau arrivant'}
                      </p>
                    </div>
                    <Select
                      value={disciples[visitor.id] || 'Non'}
                      onValueChange={(value) => handleUpdateDisciple(visitor.id, value)}
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
                ))
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
    </Layout>
  );
};

export default SuiviDisciplesPage;
