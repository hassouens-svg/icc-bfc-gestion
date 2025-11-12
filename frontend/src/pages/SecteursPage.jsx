import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getSecteurs, createSecteur, updateSecteur, deleteSecteur, getCities, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const SecteursPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [secteurs, setSecteurs] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSecteur, setSelectedSecteur] = useState(null);
  const [newSecteur, setNewSecteur] = useState({
    nom: '',
    ville: '',
  });

  useEffect(() => {
    if (!user || !['admin', 'super_admin', 'superviseur_fi', 'pasteur', 'responsable_eglise'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [secteursData, citiesData] = await Promise.all([
        getSecteurs(),
        getCities()
      ]);
      setSecteurs(secteursData);
      setCities(citiesData);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSecteur = async (e) => {
    e.preventDefault();
    
    if (!newSecteur.nom || !newSecteur.ville) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      await createSecteur(newSecteur);
      toast.success('Secteur créé avec succès!');
      setIsDialogOpen(false);
      setNewSecteur({ nom: '', ville: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    }
  };

  const handleUpdateSecteur = async (e) => {
    e.preventDefault();
    
    try {
      await updateSecteur(selectedSecteur.id, {
        nom: selectedSecteur.nom,
        ville: selectedSecteur.ville
      });
      toast.success('Secteur mis à jour avec succès!');
      setIsEditDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteSecteur = async () => {
    try {
      await deleteSecteur(selectedSecteur.id);
      toast.success('Secteur supprimé avec succès!');
      setIsDeleteDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Gestion des Secteurs</h2>
            <p className="text-gray-500 mt-1">Créez et gérez les secteurs géographiques</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Secteur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau secteur</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSecteur} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ville">Ville *</Label>
                  <Select 
                    value={newSecteur.ville} 
                    onValueChange={(value) => setNewSecteur({...newSecteur, ville: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nom">Nom du secteur *</Label>
                  <Input
                    id="nom"
                    value={newSecteur.nom}
                    onChange={(e) => setNewSecteur({...newSecteur, nom: e.target.value})}
                    placeholder="ex: Centre-ville, Nord, Sud..."
                  />
                </div>

                <Button type="submit" className="w-full">
                  Créer le secteur
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Secteurs List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des secteurs ({secteurs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {secteurs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun secteur</p>
              ) : (
                secteurs.map((secteur) => (
                  <div
                    key={secteur.id}
                    className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{secteur.nom}</p>
                        <p className="text-sm text-gray-500">{secteur.ville}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => {
                          setSelectedSecteur(secteur);
                          setIsEditDialogOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => {
                          setSelectedSecteur(secteur);
                          setIsDeleteDialogOpen(true);
                        }}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le secteur</DialogTitle>
            </DialogHeader>
            {selectedSecteur && (
              <form onSubmit={handleUpdateSecteur} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-ville">Ville *</Label>
                  <Select 
                    value={selectedSecteur.ville} 
                    onValueChange={(value) => setSelectedSecteur({...selectedSecteur, ville: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-nom">Nom du secteur *</Label>
                  <Input
                    id="edit-nom"
                    value={selectedSecteur.nom}
                    onChange={(e) => setSelectedSecteur({...selectedSecteur, nom: e.target.value})}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Mettre à jour
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le secteur "{selectedSecteur?.nom}" ?
                Cette action est irréversible et impossible si des Familles d'Impact sont rattachées à ce secteur.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSecteur} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default SecteursPage;
