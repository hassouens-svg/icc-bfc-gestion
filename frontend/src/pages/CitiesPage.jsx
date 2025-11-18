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
    await loadCityStats(city.id);
  };

  const loadCityStats = async (cityId) => {
    setStatsLoading(true);
    try {
      const yearParam = statsYear ? `year=${statsYear}` : '';
      const monthParam = statsMonth ? `&month=${statsMonth}` : '';
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/cities/${cityId}/stats?${yearParam}${monthParam}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur de chargement');
      }
      
      const stats = await response.json();
      setCityStats(stats);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
      setCityStats(null);
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
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Statistiques - {selectedCity?.name}</DialogTitle>
            </DialogHeader>
            
            {/* Filtres */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Année</Label>
                <Select value={statsYear?.toString()} onValueChange={(v) => { setStatsYear(parseInt(v)); if (selectedCity) loadCityStats(selectedCity.id); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mois (optionnel)</Label>
                <Select value={statsMonth?.toString() || 'all'} onValueChange={(v) => { setStatsMonth(v === 'all' ? null : parseInt(v)); if (selectedCity) loadCityStats(selectedCity.id); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toute l'année</SelectItem>
                    <SelectItem value="1">Janvier</SelectItem>
                    <SelectItem value="2">Février</SelectItem>
                    <SelectItem value="3">Mars</SelectItem>
                    <SelectItem value="4">Avril</SelectItem>
                    <SelectItem value="5">Mai</SelectItem>
                    <SelectItem value="6">Juin</SelectItem>
                    <SelectItem value="7">Juillet</SelectItem>
                    <SelectItem value="8">Août</SelectItem>
                    <SelectItem value="9">Septembre</SelectItem>
                    <SelectItem value="10">Octobre</SelectItem>
                    <SelectItem value="11">Novembre</SelectItem>
                    <SelectItem value="12">Décembre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {statsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : cityStats ? (
              <div className="space-y-6">
                {/* PROMOTIONS */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardHeader>
                    <CardTitle>📊 Promotions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-xs text-gray-500">NA</p>
                        <p className="text-2xl font-bold text-blue-600">{cityStats.promotions.nouveaux_arrivants}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-xs text-gray-500">NC</p>
                        <p className="text-2xl font-bold text-green-600">{cityStats.promotions.nouveaux_convertis}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-xs text-gray-500">DP</p>
                        <p className="text-2xl font-bold text-orange-600">{cityStats.promotions.de_passage}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-xs text-gray-500">% Fidélisation</p>
                        <p className="text-2xl font-bold text-indigo-600">{cityStats.promotions.avg_fidelisation}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* FAMILLES D'IMPACT */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardHeader>
                    <CardTitle>🏠 Familles d'Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-xs text-gray-500">Secteurs</p>
                        <p className="text-2xl font-bold text-purple-600">{cityStats.familles_impact.nombre_secteurs}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-xs text-gray-500">Familles</p>
                        <p className="text-2xl font-bold text-purple-600">{cityStats.familles_impact.nombre_familles}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-xs text-gray-500">Membres</p>
                        <p className="text-2xl font-bold text-purple-600">{cityStats.familles_impact.total_membres}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-xs text-gray-500">% Fidélisation</p>
                        <p className="text-2xl font-bold text-indigo-600">{cityStats.familles_impact.avg_fidelisation}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* CULTE STATS */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                  <CardHeader>
                    <CardTitle>⛪ Statistiques Cultes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-xs text-gray-500">Moy. Adultes</p>
                        <p className="text-2xl font-bold text-green-600">{cityStats.culte_stats.avg_adultes}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-xs text-gray-500">Moy. Enfants</p>
                        <p className="text-2xl font-bold text-blue-600">{cityStats.culte_stats.avg_enfants}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-xs text-gray-500">Moy. Stars</p>
                        <p className="text-2xl font-bold text-yellow-600">{cityStats.culte_stats.avg_stars}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-xs text-gray-500">Total Services</p>
                        <p className="text-2xl font-bold text-gray-600">{cityStats.culte_stats.total_services}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
