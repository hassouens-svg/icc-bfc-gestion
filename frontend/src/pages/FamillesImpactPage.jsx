import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getSecteurs, getFamillesImpact, createFamilleImpact, deleteFamilleImpact, getUser, getReferents } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Users, ArrowRight, Settings } from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

const FamillesImpactPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [secteurs, setSecteurs] = useState([]);
  const [famillesImpact, setFamillesImpact] = useState([]);
  const [selectedSecteur, setSelectedSecteur] = useState('');
  const [pilotes, setPilotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFI, setNewFI] = useState({
    nom: '',
    secteur_id: '',
    ville: user?.city || '',
    adresse: '',
    pilote_ids: [],
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadSecteurs();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedSecteur) {
      loadFamillesImpact();
    }
  }, [selectedSecteur]);

  const loadSecteurs = async () => {
    try {
      const data = await getSecteurs(user.city);
      setSecteurs(data);
      await loadPilotes();
    } catch (error) {
      toast.error('Erreur lors du chargement des secteurs');
    } finally {
      setLoading(false);
    }
  };

  const loadPilotes = async () => {
    try {
      const data = await getReferents();
      const pilotesFI = data.filter(u => u.role === 'pilote_fi' && u.city === user.city);
      setPilotes(pilotesFI);
    } catch (error) {
      console.error('Erreur lors du chargement des pilotes');
    }
  };

  const loadFamillesImpact = async () => {
    try {
      const data = await getFamillesImpact(selectedSecteur);
      setFamillesImpact(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des Familles d\'Impact');
    }
  };

  const handleCreateFI = async (e) => {
    e.preventDefault();
    
    if (!newFI.nom || !newFI.secteur_id) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      await createFamilleImpact(newFI);
      toast.success('Famille d\'Impact créée avec succès!');
      setIsDialogOpen(false);
      setNewFI({ nom: '', secteur_id: '', ville: user?.city || '', adresse: '', pilote_ids: [] });
      loadFamillesImpact();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
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
            <h2 className="text-3xl font-bold text-gray-900">Familles d'Impact</h2>
            <p className="text-gray-500 mt-1">Gérez les cellules de prière - Jeudis</p>
          </div>
          <div className="flex space-x-2">
            {['admin', 'super_admin', 'superviseur_fi'].includes(user?.role) && (
              <Button onClick={() => navigate('/familles-impact/secteurs')} variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Gérer les Secteurs
              </Button>
            )}
            {['admin', 'super_admin', 'superviseur_fi', 'responsable_secteur'].includes(user?.role) && selectedSecteur && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle FI
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une nouvelle Famille d'Impact</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateFI} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Secteur *</Label>
                      <Select 
                        value={newFI.secteur_id} 
                        onValueChange={(value) => setNewFI({...newFI, secteur_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un secteur" />
                        </SelectTrigger>
                        <SelectContent>
                          {secteurs.map((secteur) => (
                            <SelectItem key={secteur.id} value={secteur.id}>
                              {secteur.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nom de la FI *</Label>
                      <Input
                        value={newFI.nom}
                        onChange={(e) => setNewFI({...newFI, nom: e.target.value})}
                        placeholder="ex: FI République, FI Fontaine d'Ouche..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Adresse (optionnel)</Label>
                      <Input
                        value={newFI.adresse}
                        onChange={(e) => setNewFI({...newFI, adresse: e.target.value})}
                        placeholder="Adresse complète de la FI"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pilotes assignés (plusieurs possibles)</Label>
                      <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                        {pilotes.length > 0 ? (
                          pilotes.map((pilote) => (
                            <div key={pilote.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`pilote-${pilote.id}`}
                                checked={(newFI.pilote_ids || []).includes(pilote.id)}
                                onCheckedChange={(checked) => {
                                  const currentPilotes = newFI.pilote_ids || [];
                                  const newPilotes = checked 
                                    ? [...currentPilotes, pilote.id]
                                    : currentPilotes.filter(id => id !== pilote.id);
                                  setNewFI({...newFI, pilote_ids: newPilotes});
                                }}
                              />
                              <label htmlFor={`pilote-${pilote.id}`} className="text-sm cursor-pointer">
                                {pilote.username}
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">Aucun pilote disponible</p>
                        )}
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      Créer la Famille d'Impact
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Secteur Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Sélectionnez un secteur</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedSecteur} onValueChange={setSelectedSecteur}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un secteur" />
              </SelectTrigger>
              <SelectContent>
                {secteurs.map((secteur) => (
                  <SelectItem key={secteur.id} value={secteur.id}>
                    {secteur.nom} - {secteur.ville}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Familles Impact List */}
        {selectedSecteur && (
          <Card>
            <CardHeader>
              <CardTitle>Familles d'Impact ({famillesImpact.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {famillesImpact.length === 0 ? (
                  <p className="col-span-full text-center text-gray-500 py-8">Aucune Famille d'Impact</p>
                ) : (
                  famillesImpact.map((fi) => (
                    <Card 
                      key={fi.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(`/familles-impact/fi/${fi.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Users className="h-8 w-8 text-green-500" />
                            <div>
                              <h3 className="font-semibold text-lg">{fi.nom}</h3>
                              <p className="text-sm text-gray-500">{fi.ville}</p>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default FamillesImpactPage;