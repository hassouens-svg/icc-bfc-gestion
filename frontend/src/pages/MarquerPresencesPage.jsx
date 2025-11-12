import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getVisitors, addPresence, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Calendar, Save } from 'lucide-react';
import { toast } from 'sonner';

const MarquerPresencesPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [visitors, setVisitors] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [presences, setPresences] = useState({});
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !['referent', 'promotions', 'admin', 'super_admin'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    loadVisitors();
  }, [user, navigate]);

  useEffect(() => {
    // Charger les présences existantes quand la date change
    if (selectedDate && visitors.length > 0) {
      loadExistingPresences();
    }
  }, [selectedDate, visitors]);

  const loadVisitors = async () => {
    try {
      const visitorsData = await getVisitors();
      // Filtrer par ville si le user n'est pas admin/super_admin
      const filtered = ['admin', 'super_admin'].includes(user.role) 
        ? visitorsData 
        : visitorsData.filter(v => v.city === user.city);
      setVisitors(filtered);
    } catch (error) {
      toast.error('Erreur lors du chargement des visiteurs');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingPresences = () => {
    // Charger les présences déjà enregistrées pour cette date
    const newPresences = {};
    const newComments = {};
    
    visitors.forEach(visitor => {
      // Chercher dans les présences dimanche et jeudi
      const allPresences = [
        ...(visitor.presences_dimanche || []),
        ...(visitor.presences_jeudi || [])
      ];
      
      const existingPresence = allPresences.find(p => p.date === selectedDate);
      if (existingPresence) {
        newPresences[visitor.id] = existingPresence.present;
        if (existingPresence.commentaire) {
          newComments[visitor.id] = existingPresence.commentaire;
        }
      }
    });
    
    setPresences(newPresences);
    setComments(newComments);
  };

  const handlePresenceChange = (visitorId, isPresent) => {
    setPresences(prev => {
      const newPresences = {...prev};
      // Si on coche la même valeur qui est déjà cochée, on la décoche
      if (newPresences[visitorId] === isPresent) {
        delete newPresences[visitorId];
      } else {
        // Sinon on met la nouvelle valeur
        newPresences[visitorId] = isPresent;
      }
      return newPresences;
    });
  };

  const handleSaveAll = async () => {
    try {
      const promises = Object.entries(presences).map(([visitorId, isPresent]) => {
        return addPresence({
          visitor_id: visitorId,
          date: selectedDate,
          present: isPresent,
          type: 'dimanche',
          commentaire: comments[visitorId] || null
        });
      });

      await Promise.all(promises);
      toast.success(`${Object.keys(presences).length} présences enregistrées/mises à jour pour le ${selectedDate}`);
      
      // Recharger les visiteurs pour rafraîchir les données
      await loadVisitors();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Marquer les Présences</h2>
            <p className="text-gray-500 mt-1">Enregistrez les présences pour une date spécifique</p>
          </div>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Retour au Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sélectionnez la date</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-48"
                  />
                </div>
                <Button 
                  onClick={handleSaveAll} 
                  disabled={Object.keys(presences).length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer ({Object.keys(presences).length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nom</th>
                    <th className="text-left py-3 px-4">Prénom</th>
                    <th className="text-left py-3 px-4">Catégorie</th>
                    <th className="text-left py-3 px-4">Canal d'arrivée</th>
                    <th className="text-center py-3 px-4 w-24">Présent ✅</th>
                    <th className="text-center py-3 px-4 w-24">Absent ❌</th>
                    <th className="text-left py-3 px-4 w-72">Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((visitor) => (
                    <tr key={visitor.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{visitor.lastname}</td>
                      <td className="py-3 px-4">{visitor.firstname}</td>
                      <td className="py-3 px-4">
                        {visitor.types?.join(', ') || 'N/A'}
                      </td>
                      <td className="py-3 px-4">{visitor.arrival_channel}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={presences[visitor.id] === true}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handlePresenceChange(visitor.id, true);
                              } else if (presences[visitor.id] === true) {
                                handlePresenceChange(visitor.id, true); // Décoche
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={presences[visitor.id] === false}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handlePresenceChange(visitor.id, false);
                              } else if (presences[visitor.id] === false) {
                                handlePresenceChange(visitor.id, false); // Décoche
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          placeholder="Commentaire..."
                          value={comments[visitor.id] || ''}
                          onChange={(e) => setComments({...comments, [visitor.id]: e.target.value})}
                          className="w-full text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {visitors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucun visiteur trouvé
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MarquerPresencesPage;
