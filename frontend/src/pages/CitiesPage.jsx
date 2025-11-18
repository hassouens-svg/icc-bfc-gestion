import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getCities, getUser, createCity, updateCity, deleteCity, getCityStats } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Plus, MapPin, Settings, Trash2, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const CitiesPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityStats, setCityStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());
  const [statsMonth, setStatsMonth] = useState(null);

  useEffect(() => {
    if (!user || !['superviseur_promos', 'superviseur_fi', 'promotions', 'super_admin', 'pasteur'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    loadCities();
  }, [user, navigate]);

  const loadCities = async () => {
    try {
      const data = await getCities();
      setCities(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des villes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCity = async (e) => {
    e.preventDefault();
    
    if (!newCityName.trim()) {
      toast.error('Veuillez entrer un nom de ville');
      return;
    }

    try {
      await createCity(newCityName);
      toast.success('Ville créée avec succès!');
      setIsDialogOpen(false);
      setNewCityName('');
      loadCities();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    }
  };

  const handleManageCity = (city) => {
    setSelectedCity({ ...city });
    setIsManageDialogOpen(true);
  };

  const handleUpdateCity = async (e) => {
    e.preventDefault();
    
    if (!selectedCity.name.trim()) {
      toast.error('Veuillez entrer un nom de ville');
      return;
    }

    try {
      await updateCity(selectedCity.id, selectedCity.name);
      toast.success('Ville mise à jour avec succès!');
      setIsManageDialogOpen(false);
      loadCities();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteCity = async () => {
    try {
      await deleteCity(selectedCity.id);
      toast.success('Ville supprimée avec succès!');
      setIsDeleteDialogOpen(false);
      setIsManageDialogOpen(false);
      loadCities();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const handleViewStats = async (city) => {
    setSelectedCity(city);
    setIsStatsDialogOpen(true);
    setStatsLoading(true);
    
    try {
      const stats = await getCityStats(city.id);
      setCityStats(stats);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setStatsLoading(false);
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
            <h2 className="text-3xl font-bold text-gray-900" data-testid="cities-title">Villes ICC</h2>
            <p className="text-gray-500 mt-1">Gérez les différentes villes ICC</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-city-button">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Ville
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une nouvelle ville</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCity} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="city-name">Nom de la ville *</Label>
                  <Input
                    id="city-name"
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    placeholder="ex: Lyon"
                    data-testid="city-name-input"
                  />
                </div>

                <Button type="submit" className="w-full" data-testid="submit-city">
                  Créer la ville
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities.length === 0 ? (
            <p className="text-center text-gray-500 py-8 col-span-full">Aucune ville</p>
          ) : (
            cities.map((city) => (
              <Card key={city.id} data-testid={`city-card-${city.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-indigo-100 rounded-lg">
                        <MapPin className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{city.name}</p>
                        <p className="text-sm text-gray-500">Ville ICC</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handleViewStats(city)}
                        variant="ghost"
                        size="sm"
                        title="Voir les statistiques"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => handleManageCity(city)}
                        variant="ghost"
                        size="sm"
                        title="Gérer"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Manage City Dialog */}
        <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gérer la ville</DialogTitle>
            </DialogHeader>
            {selectedCity && (
              <form onSubmit={handleUpdateCity} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city-name">Nom de la ville</Label>
                  <Input
                    id="edit-city-name"
                    value={selectedCity.name}
                    onChange={(e) => setSelectedCity({...selectedCity, name: e.target.value})}
                    placeholder="Nom de la ville"
                  />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <Button 
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setIsManageDialogOpen(false);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsManageDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button type="submit">
                      Mettre à jour
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action supprimera définitivement la ville "{selectedCity?.name}".
                Cette opération ne peut pas être annulée et échouera si la ville contient des utilisateurs ou nouveaux arrivants et nouveaux convertiss.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCity} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* City Statistics Dialog */}
        <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Statistiques - {selectedCity?.name}</DialogTitle>
            </DialogHeader>
            {statsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : cityStats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total Responsable de promoss</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{cityStats.total_referents}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total Nouveaux Arrivants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {cityStats.referent_stats.reduce((sum, r) => sum + r.total_visitors, 0)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Statistiques par Responsable de promos</h4>
                  {cityStats.referent_stats.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Aucun responsable de promos avec des données</p>
                  ) : (
                    cityStats.referent_stats.map((ref) => (
                      <Card key={ref.referent_id}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-lg">{ref.referent_name}</p>
                                <p className="text-sm text-gray-500">Mois: {ref.assigned_month}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-indigo-600">{ref.avg_fidelity_rate}%</p>
                                <p className="text-xs text-gray-500">Taux de fidélité</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-4 pt-2 border-t">
                              <div>
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-lg font-semibold">{ref.total_visitors}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Arrivants</p>
                                <p className="text-lg font-semibold text-blue-600">{ref.nouveaux_arrivants}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Convertis</p>
                                <p className="text-lg font-semibold text-green-600">{ref.nouveaux_convertis}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">De passage</p>
                                <p className="text-lg font-semibold text-orange-600">{ref.de_passage}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Aucune donnée disponible</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default CitiesPage;
