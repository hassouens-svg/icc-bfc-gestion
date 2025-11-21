import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getFamilleImpact, getMembresFI, createMembreFI, deleteMembreFI, getPresencesFI, createPresenceFI, getUser, updateFamilleImpact } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, UserPlus, Calendar, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

const FamilleImpactDetailPage = () => {
  const navigate = useNavigate();
  const { fiId } = useParams();
  const user = getUser();
  const [fi, setFi] = useState(null);
  const [membres, setMembres] = useState([]);
  const [presences, setPresences] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newMembre, setNewMembre] = useState({ prenom: '', nom: '', fi_id: fiId });
  const [presenceComments, setPresenceComments] = useState({});
  const [editFIData, setEditFIData] = useState({ nom: '', adresse: '', heure_debut: '', heure_fin: '' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [fiId, user, navigate]);

  useEffect(() => {
    if (membres.length > 0) {
      loadPresences();
    }
  }, [selectedDate, membres]);

  const loadData = async () => {
    try {
      const [fiData, membresData] = await Promise.all([
        getFamilleImpact(fiId),
        getMembresFI(fiId)
      ]);
      setFi(fiData);
      setMembres(membresData);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadPresences = async () => {
    try {
      const presencesData = await getPresencesFI(fiId, selectedDate);
      const presencesMap = {};
      presencesData.forEach(p => {
        presencesMap[p.membre_fi_id] = p;
      });
      setPresences(presencesMap);
    } catch (error) {
      console.error('Error loading presences:', error);
    }
  };

  const handleAddMembre = async (e) => {
    e.preventDefault();
    if (!newMembre.prenom || !newMembre.nom) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      await createMembreFI(newMembre);
      toast.success('Membre ajouté avec succès!');
      setIsDialogOpen(false);
      setNewMembre({ prenom: '', nom: '', fi_id: fiId });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  const handlePresenceChange = async (membreId, present) => {
    try {
      await createPresenceFI({
        membre_fi_id: membreId,
        date: selectedDate,
        present: present,
        commentaire: presenceComments[membreId] || null
      });
      toast.success('Présence enregistrée');
      loadPresences();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteMembre = async (membreId) => {
    if (!window.confirm('Supprimer ce membre ?')) return;
    try {
      await deleteMembreFI(membreId);
      toast.success('Membre supprimé');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEditFI = () => {
    setEditFIData({
      nom: fi.nom,
      adresse: fi.adresse || '',
      secteur_id: fi.secteur_id,
      ville: fi.ville,
      heure_debut: fi.heure_debut || '',
      heure_fin: fi.heure_fin || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateFI = async (e) => {
    e.preventDefault();
    if (!editFIData.nom) {
      toast.error('Le nom est obligatoire');
      return;
    }

    try {
      await updateFamilleImpact(fiId, editFIData);
      toast.success('Famille d\'Impact modifiée avec succès!');
      setIsEditDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la modification');
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
            <h2 className="text-3xl font-bold text-gray-900">{fi?.nom}</h2>
            <p className="text-gray-500 mt-1">{fi?.ville} - Cellule de prière (Jeudis)</p>
            {fi?.adresse && (
              <p className="text-sm text-gray-600 mt-1">📍 {fi.adresse}</p>
            )}
            {(fi?.heure_debut || fi?.heure_fin) && (
              <p className="text-sm text-gray-600 mt-1">
                🕐 {fi.heure_debut || '--:--'} - {fi.heure_fin || '--:--'}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            {['admin', 'super_admin', 'superviseur_fi', 'responsable_secteur', 'pilote_fi'].includes(user?.role) && (
              <Button onClick={handleEditFI} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Modifier les informations
              </Button>
            )}
            {['admin', 'super_admin', 'superviseur_fi', 'responsable_secteur', 'pilote_fi'].includes(user?.role) && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter Membre
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un nouveau membre</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddMembre} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Prénom *</Label>
                    <Input
                      value={newMembre.prenom}
                      onChange={(e) => setNewMembre({...newMembre, prenom: e.target.value})}
                      placeholder="Prénom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom *</Label>
                    <Input
                      value={newMembre.nom}
                      onChange={(e) => setNewMembre({...newMembre, nom: e.target.value})}
                      placeholder="Nom"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Ajouter
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          </div>
        </div>

        {/* Date Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Présences du jeudi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
          </CardContent>
        </Card>

        {/* Membres et Présences */}
        <Card>
          <CardHeader>
            <CardTitle>Membres ({membres.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {membres.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun membre</p>
              ) : (
                membres.map((membre) => {
                  const presence = presences[membre.id];
                  return (
                    <div key={membre.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4 flex-1">
                        <UserPlus className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium">{membre.prenom} {membre.nom}</p>
                          {membre.source === 'nouveau_arrivant' && (
                            <p className="text-xs text-green-600">Nouveau arrivant</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={presence?.present || false}
                              onCheckedChange={(checked) => handlePresenceChange(membre.id, checked)}
                            />
                            <Label className="cursor-pointer">Présent</Label>
                          </div>
                          <Input
                            placeholder="Commentaire..."
                            value={presenceComments[membre.id] || presence?.commentaire || ''}
                            onChange={(e) => setPresenceComments({...presenceComments, [membre.id]: e.target.value})}
                            className="w-48"
                          />
                          {['admin', 'super_admin', 'superviseur_fi', 'pilote_fi'].includes(user?.role) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteMembre(membre.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit FI Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la Famille d'Impact</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateFI} className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de la FI *</Label>
                <Input
                  value={editFIData.nom}
                  onChange={(e) => setEditFIData({...editFIData, nom: e.target.value})}
                  placeholder="Nom de la FI"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Adresse (optionnel)</Label>
                <Textarea
                  value={editFIData.adresse}
                  onChange={(e) => setEditFIData({...editFIData, adresse: e.target.value})}
                  placeholder="Adresse complète de la FI"
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  Cette adresse sera utilisée sur la carte "Trouver ma FI"
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Heure de début (optionnel)</Label>
                  <Input
                    type="time"
                    value={editFIData.heure_debut}
                    onChange={(e) => setEditFIData({...editFIData, heure_debut: e.target.value})}
                    placeholder="HH:MM"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure de fin (optionnel)</Label>
                  <Input
                    type="time"
                    value={editFIData.heure_fin}
                    onChange={(e) => setEditFIData({...editFIData, heure_fin: e.target.value})}
                    placeholder="HH:MM"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" className="flex-1">
                  Enregistrer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default FamilleImpactDetailPage;