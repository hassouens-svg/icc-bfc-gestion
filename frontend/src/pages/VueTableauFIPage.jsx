import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getMembresFI, getPresencesFI, getUser, createPresenceFI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Users, UserCheck, UserX, UserPlus, TrendingUp, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const VueTableauFIPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [membres, setMembres] = useState([]);
  const [filteredMembres, setFilteredMembres] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  
  // KPIs
  const [kpis, setKpis] = useState({
    totalMembres: 0,
    presents: 0,
    absents: 0,
    nouveaux: 0,
    tauxFidelisation: 0
  });
  
  // Edit modal
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMembre, setEditingMembre] = useState(null);
  const [editPresence, setEditPresence] = useState(null);
  const [editComment, setEditComment] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'pilote_fi') {
      navigate('/dashboard');
      return;
    }
    loadMembres();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedDate && membres.length > 0) {
      loadPresencesForDate();
    }
  }, [selectedDate, membres]);

  const loadMembres = async () => {
    try {
      // Support both old (assigned_fi_id) and new (assigned_fi_ids) format
      const fiId = user.assigned_fi_id || (user.assigned_fi_ids && user.assigned_fi_ids[0]);
      
      if (!fiId) {
        toast.error('Aucune FI assignée à votre compte');
        setLoading(false);
        return;
      }

      const membresData = await getMembresFI(fiId);
      setMembres(membresData);

    } catch (error) {
      toast.error('Erreur lors du chargement');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPresencesForDate = async () => {
    try {
      const presencesData = await getPresencesFI(user.assigned_fi_id, selectedDate);
      
      const presencesMap = {};
      presencesData.forEach(p => {
        presencesMap[p.membre_fi_id] = p;
      });
      
      const enrichedMembres = membres.map(membre => ({
        ...membre,
        presence: presencesMap[membre.id] || null
      }));
      
      setFilteredMembres(enrichedMembres);
      
      // Calculer les KPIs
      const totalMembres = membres.length;
      const presents = presencesData.filter(p => p.present === true).length;
      const absents = presencesData.filter(p => p.present === false).length;
      
      // Nouveaux membres = membres ajoutés dans les 7 derniers jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const nouveaux = membres.filter(m => {
        const dateAjout = new Date(m.date_ajout);
        return dateAjout >= sevenDaysAgo;
      }).length;
      
      const tauxFidelisation = totalMembres > 0 ? (presents / totalMembres) * 100 : 0;
      
      setKpis({
        totalMembres,
        presents,
        absents,
        nouveaux,
        tauxFidelisation: tauxFidelisation.toFixed(1)
      });
      
    } catch (error) {
      toast.error('Erreur lors du chargement des présences');
      console.error(error);
    }
  };

  const handleEditPresence = (membre) => {
    setEditingMembre(membre);
    
    if (membre.presence) {
      setEditPresence(membre.presence.present);
      setEditComment(membre.presence.commentaire || '');
    } else {
      setEditPresence(null);
      setEditComment('');
    }
    
    setEditDialogOpen(true);
  };

  const handleSavePresenceEdit = async () => {
    if (!editingMembre || !selectedDate) {
      toast.error('Erreur: Aucune date sélectionnée');
      return;
    }

    if (editPresence === null) {
      toast.error('Veuillez sélectionner Présent ou Absent');
      return;
    }

    try {
      await createPresenceFI({
        membre_fi_id: editingMembre.id,
        date: selectedDate,
        present: editPresence,
        commentaire: editComment || null
      });
      
      toast.success('Présence mise à jour avec succès');
      setEditDialogOpen(false);
      loadPresencesForDate();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
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
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Vue Tableau - Famille d'Impact</h2>
            <p className="text-gray-500 mt-1">Présences et statistiques des membres</p>
          </div>
          <Button onClick={() => navigate('/dashboard-pilote-fi')} variant="outline">
            Retour au Dashboard
          </Button>
        </div>

        {/* Filtre de date */}
        <Card>
          <CardHeader>
            <CardTitle>Sélectionner une date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs">
              <Label>Date de réunion</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {selectedDate && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Membres</p>
                      <p className="text-2xl font-bold text-blue-600">{kpis.totalMembres}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Présents</p>
                      <p className="text-2xl font-bold text-green-600">{kpis.presents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <UserX className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">Absents</p>
                      <p className="text-2xl font-bold text-red-600">{kpis.absents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Nouveaux (7j)</p>
                      <p className="text-2xl font-bold text-purple-600">{kpis.nouveaux}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-8 w-8 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-600">Fidélisation</p>
                      <p className="text-2xl font-bold text-indigo-600">{kpis.tauxFidelisation}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tableau */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des membres ({filteredMembres.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Nom</th>
                        <th className="text-left py-3 px-4">Prénom</th>
                        <th className="text-left py-3 px-4">Téléphone</th>
                        <th className="text-center py-3 px-4">Présent</th>
                        <th className="text-center py-3 px-4">Absent</th>
                        <th className="text-left py-3 px-4">Commentaire</th>
                        <th className="text-center py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembres.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-gray-500">
                            Aucun membre trouvé
                          </td>
                        </tr>
                      ) : (
                        filteredMembres.map((membre) => (
                          <tr key={membre.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{membre.nom}</td>
                            <td className="py-3 px-4">{membre.prenom}</td>
                            <td className="py-3 px-4">{membre.telephone || '-'}</td>
                            <td className="py-3 px-4 text-center text-lg">
                              {membre.presence && membre.presence.present === true ? '✅' : '-'}
                            </td>
                            <td className="py-3 px-4 text-center text-lg">
                              {membre.presence && membre.presence.present === false ? '❌' : '-'}
                            </td>
                            <td className="py-3 px-4">
                              {membre.presence?.commentaire || '-'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Button
                                onClick={() => handleEditPresence(membre)}
                                variant="outline"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Edit Presence Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la présence</DialogTitle>
            </DialogHeader>
            {editingMembre && (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{editingMembre.prenom} {editingMembre.nom}</p>
                  <p className="text-sm text-gray-500">Date: {selectedDate}</p>
                </div>

                <div className="space-y-3">
                  <Label>Présence</Label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setEditPresence(true)}
                      className={`px-4 py-2 rounded border-2 flex items-center space-x-2 transition-colors ${
                        editPresence === true
                          ? 'bg-green-500 border-green-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
                      }`}
                    >
                      <span className="text-lg">✓</span>
                      <span>Présent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPresence(false)}
                      className={`px-4 py-2 rounded border-2 flex items-center space-x-2 transition-colors ${
                        editPresence === false
                          ? 'bg-red-500 border-red-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-red-400'
                      }`}
                    >
                      <span className="text-lg">✗</span>
                      <span>Absent</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Commentaire</Label>
                  <Textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSavePresenceEdit} className="bg-indigo-600 hover:bg-indigo-700">
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default VueTableauFIPage;
