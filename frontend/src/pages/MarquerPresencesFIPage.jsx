import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getMembresFI, getPresencesFI, createPresenceFI, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';

const MarquerPresencesFIPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [membres, setMembres] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [presences, setPresences] = useState({}); // {membre_id: true/false}
  const [comments, setComments] = useState({}); // {membre_id: "commentaire"}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'pilote_fi') {
      navigate('/dashboard');
      return;
    }
    
    if (!user.assigned_fi_id) {
      toast.error('Aucune FI assignée');
      navigate('/dashboard');
      return;
    }

    loadMembres();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedDate && membres.length > 0) {
      loadExistingPresences();
    }
  }, [selectedDate]);

  const loadMembres = async () => {
    try {
      const data = await getMembresFI(user.assigned_fi_id);
      setMembres(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des membres');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingPresences = async () => {
    try {
      const presencesData = await getPresencesFI(user.assigned_fi_id, selectedDate);
      
      const presencesMap = {};
      const commentsMap = {};
      
      presencesData.forEach(p => {
        presencesMap[p.membre_fi_id] = p.present;
        commentsMap[p.membre_fi_id] = p.commentaire || '';
      });
      
      setPresences(presencesMap);
      setComments(commentsMap);
    } catch (error) {
      console.error('Erreur lors du chargement des présences:', error);
    }
  };

  const handlePresenceToggle = (membreId, isPresent) => {
    console.log('handlePresenceToggle called:', membreId, isPresent);
    setPresences(prev => {
      const newPresences = {...prev};
      
      // Si on clique sur une case déjà cochée, on la décoche
      if (newPresences[membreId] === isPresent) {
        delete newPresences[membreId];
      } else {
        // Sinon on met la nouvelle valeur (true ou false)
        newPresences[membreId] = isPresent;
      }
      
      console.log('New presences state:', newPresences);
      return newPresences;
    });
  };

  const handleSaveAll = async () => {
    if (!selectedDate) {
      toast.error('Veuillez sélectionner une date');
      return;
    }

    try {
      const promises = Object.entries(presences).map(([membreId, isPresent]) => {
        return createPresenceFI({
          membre_fi_id: membreId,
          date: selectedDate,
          present: isPresent,
          commentaire: comments[membreId] || null
        });
      });

      await Promise.all(promises);
      toast.success(`${promises.length} présences enregistrées/mises à jour pour le ${selectedDate}`);
      
      // Reset
      setPresences({});
      setComments({});
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p>Chargement...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Marquer les Présences - Famille d'Impact</h1>
          <Button variant="outline" onClick={() => navigate('/dashboard-pilote-fi')}>
            Retour au Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Sélectionner une date</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Date de la réunion FI *</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle>
                Liste des membres - {selectedDate}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Nom</th>
                      <th className="text-left py-3 px-4">Prénom</th>
                      <th className="text-left py-3 px-4">Téléphone</th>
                      <th className="text-center py-3 px-4 w-24">Présent ✅</th>
                      <th className="text-center py-3 px-4 w-24">Absent ❌</th>
                      <th className="text-left py-3 px-4 w-72">Commentaire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membres.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-gray-500">
                          Aucun membre dans cette FI
                        </td>
                      </tr>
                    ) : (
                      membres.map((membre) => (
                        <tr key={membre.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{membre.nom}</td>
                          <td className="py-3 px-4">{membre.prenom}</td>
                          <td className="py-3 px-4">{membre.telephone || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() => handlePresenceToggle(membre.id, true)}
                                className={`w-8 h-8 rounded border-2 flex items-center justify-center font-bold text-lg transition-colors ${
                                  presences[membre.id] === true
                                    ? 'bg-green-500 border-green-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-400 hover:border-green-400'
                                }`}
                              >
                                {presences[membre.id] === true && '✓'}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() => handlePresenceToggle(membre.id, false)}
                                className={`w-8 h-8 rounded border-2 flex items-center justify-center font-bold text-lg transition-colors ${
                                  presences[membre.id] === false
                                    ? 'bg-red-500 border-red-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-400 hover:border-red-400'
                                }`}
                              >
                                {presences[membre.id] === false && '✗'}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              placeholder="Commentaire..."
                              value={comments[membre.id] || ''}
                              onChange={(e) => setComments({...comments, [membre.id]: e.target.value})}
                              className="w-full text-xs"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleSaveAll}
                  disabled={Object.keys(presences).length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Enregistrer ({Object.keys(presences).length})
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default MarquerPresencesFIPage;
