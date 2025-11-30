import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { MapPin, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Users, Building2, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { getCities, createCity, updateCity, deleteCity, getStatsPasteur } from '../utils/api';
import { getUser } from '../utils/api';

const CitiesPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCity, setCurrentCity] = useState({ id: '', name: '', country: 'France' });
  const [expandedCity, setExpandedCity] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [citiesPerPage] = useState(10);

  const loadCities = async () => {
    setLoading(true);
    console.log('CitiesPage: Début chargement villes et stats...');
    try {
      const [citiesData, statsData] = await Promise.all([
        getCities(),
        getStatsPasteur()
      ]);
      console.log('CitiesPage: Données reçues:', citiesData?.length, 'villes');
      setCities(citiesData || []);
      setStats(statsData || null);
    } catch (error) {
      console.error('CitiesPage: Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des villes');
    } finally {
      console.log('CitiesPage: Fin chargement');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!['super_admin', 'pasteur'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    loadCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createCity(currentCity);
      toast.success('Ville créée avec succès');
      setIsDialogOpen(false);
      setCurrentCity({ id: '', name: '', country: 'France' });
      loadCities();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await updateCity(currentCity.id, currentCity);
      toast.success('Ville mise à jour avec succès');
      setIsDialogOpen(false);
      setIsEditMode(false);
      setCurrentCity({ id: '', name: '', country: 'France' });
      loadCities();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (cityId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette ville ?')) {
      return;
    }
    try {
      await deleteCity(cityId);
      toast.success('Ville supprimée avec succès');
      loadCities();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const openCreateDialog = () => {
    setCurrentCity({ id: '', name: '', country: 'France' });
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (city) => {
    setCurrentCity(city);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  // Pagination
  const indexOfLastCity = (currentPage + 1) * citiesPerPage;
  const indexOfFirstCity = indexOfLastCity - citiesPerPage;
  const currentCities = cities.slice(indexOfFirstCity, indexOfLastCity);
  const totalPages = Math.ceil(cities.length / citiesPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
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
            <h2 className="text-3xl font-bold text-gray-900">Gestion des Villes</h2>
            <p className="text-gray-500 mt-1">Gérez les villes de l'église</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Ville
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Villes ICC ({stats?.stats_by_city?.length || 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats?.stats_by_city && stats.stats_by_city.length > 0 ? (
                stats.stats_by_city.map((cityStats, idx) => (
                  <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-5 w-5 text-indigo-600" />
                          <h3 className="font-bold text-lg">{cityStats.ville}</h3>
                        </div>
                        <button 
                          onClick={() => setExpandedCity(expandedCity === cityStats.ville ? null : cityStats.ville)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          {expandedCity === cityStats.ville ? (
                            <ChevronUp className="h-5 w-5 text-gray-600" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-600" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">Ville ICC</p>
                    </CardHeader>
                    
                    {expandedCity === cityStats.ville && (
                      <CardContent className="pt-0 space-y-4">
                        {/* Promotions */}
                        <div className="border rounded-lg p-3 bg-gradient-to-br from-purple-50 to-purple-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-purple-200 rounded-lg">
                                <svg className="h-5 w-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                </svg>
                              </div>
                              <h4 className="font-semibold text-gray-800">Promotions</h4>
                            </div>
                            <div className="bg-purple-200 px-3 py-1 rounded-full">
                              <p className="text-xs font-bold text-purple-800">{cityStats.promotions?.fidelisation || 0}%</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <p className="text-2xl font-bold text-purple-700">{cityStats.promotions?.na || 0}</p>
                              <p className="text-xs text-gray-600">NA</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-purple-700">{cityStats.promotions?.nc || 0}</p>
                              <p className="text-xs text-gray-600">NC</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-purple-700">{cityStats.promotions?.dp || 0}</p>
                              <p className="text-xs text-gray-600">DP</p>
                            </div>
                          </div>
                        </div>

                        {/* Familles d'Impact */}
                        <div className="border rounded-lg p-3 bg-gradient-to-br from-green-50 to-green-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-green-200 rounded-lg">
                                <Users className="h-5 w-5 text-green-700" />
                              </div>
                              <h4 className="font-semibold text-gray-800">Familles d'Impact</h4>
                            </div>
                            <div className="bg-green-200 px-3 py-1 rounded-full">
                              <p className="text-xs font-bold text-green-800">{cityStats.familles_impact?.fidelisation || 0}%</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <p className="text-2xl font-bold text-green-700">{cityStats.familles_impact?.secteurs || 0}</p>
                              <p className="text-xs text-gray-600">Secteurs</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-700">{cityStats.familles_impact?.familles || 0}</p>
                              <p className="text-xs text-gray-600">Familles</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-700">{cityStats.familles_impact?.membres || 0}</p>
                              <p className="text-xs text-gray-600">Membres</p>
                            </div>
                          </div>
                        </div>

                        {/* Statistiques Cultes */}
                        <div className="border rounded-lg p-3 bg-gradient-to-br from-blue-50 to-blue-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-blue-200 rounded-lg">
                                <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                              </div>
                              <h4 className="font-semibold text-gray-800">Statistiques Cultes</h4>
                            </div>
                            <div className="bg-blue-200 px-3 py-1 rounded-full">
                              <p className="text-xs font-bold text-blue-800">{cityStats.cultes?.fidelisation || 0}%</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-center">
                            <div>
                              <p className="text-2xl font-bold text-blue-700">{cityStats.cultes?.moy_adultes || 0}</p>
                              <p className="text-xs text-gray-600">Moy. Adultes</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-blue-700">{cityStats.cultes?.moy_enfants || 0}</p>
                              <p className="text-xs text-gray-600">Moy. Enfants</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-blue-700">{cityStats.cultes?.moy_stars || 0}</p>
                              <p className="text-xs text-gray-600">Moy. Stars</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-blue-700">{cityStats.cultes?.total_services || 0}</p>
                              <p className="text-xs text-gray-600">Total Services</p>
                            </div>
                          </div>
                        </div>

                        {/* Dynamique d'Évangélisation */}
                        <div className="border rounded-lg p-3 bg-gradient-to-br from-orange-50 to-orange-100">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="p-2 bg-orange-200 rounded-lg">
                              <Sparkles className="h-5 w-5 text-orange-700" />
                            </div>
                            <h4 className="font-semibold text-gray-800">Dynamique d'Évangélisation</h4>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-gray-600 font-semibold mb-2">Église</p>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-white bg-opacity-50 rounded p-2">
                                  <p className="text-lg font-bold text-orange-700">{cityStats.evangelisation?.eglise?.gagneurs_ame || 0}</p>
                                  <p className="text-xs text-gray-600">Gagneurs</p>
                                </div>
                                <div className="bg-white bg-opacity-50 rounded p-2">
                                  <p className="text-lg font-bold text-orange-700">{cityStats.evangelisation?.eglise?.priere_salut || 0}</p>
                                  <p className="text-xs text-gray-600">Prières</p>
                                </div>
                                <div className="bg-white bg-opacity-50 rounded p-2">
                                  <p className="text-lg font-bold text-orange-700">{cityStats.evangelisation?.eglise?.miracles || 0}</p>
                                  <p className="text-xs text-gray-600">Miracles</p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-semibold mb-2">Familles Impact</p>
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-white bg-opacity-50 rounded p-2">
                                  <p className="text-lg font-bold text-orange-700">{cityStats.evangelisation?.familles_impact?.gagneurs_ame || 0}</p>
                                  <p className="text-xs text-gray-600">Gagneurs</p>
                                </div>
                                <div className="bg-white bg-opacity-50 rounded p-2">
                                  <p className="text-lg font-bold text-orange-700">{cityStats.evangelisation?.familles_impact?.priere_salut || 0}</p>
                                  <p className="text-xs text-gray-600">Prières</p>
                                </div>
                                <div className="bg-white bg-opacity-50 rounded p-2">
                                  <p className="text-lg font-bold text-orange-700">{cityStats.evangelisation?.familles_impact?.miracles || 0}</p>
                                  <p className="text-xs text-gray-600">Miracles</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucune statistique disponible</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={goToPrevPage}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage + 1} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Modifier la Ville' : 'Nouvelle Ville'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={isEditMode ? handleEdit : handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la ville *</Label>
              <Input
                required
                value={currentCity.name}
                onChange={(e) => setCurrentCity({ ...currentCity, name: e.target.value })}
                placeholder="Ex: Dijon"
              />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Input
                value={currentCity.country}
                onChange={(e) => setCurrentCity({ ...currentCity, country: e.target.value })}
                placeholder="Ex: France"
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                {isEditMode ? 'Mettre à jour' : 'Créer'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setIsEditMode(false);
                  setCurrentCity({ id: '', name: '', country: 'France' });
                }}
              >
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CitiesPage;
