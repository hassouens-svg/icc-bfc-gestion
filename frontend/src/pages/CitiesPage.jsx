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
            <CardTitle>Statistiques par Ville ({stats?.stats_by_city?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.stats_by_city && stats.stats_by_city.length > 0 ? (
                stats.stats_by_city.map((cityStats, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setExpandedCity(expandedCity === cityStats.ville ? null : cityStats.ville)}
                    >
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-indigo-600" />
                        <div>
                          <h3 className="font-semibold text-lg">{cityStats.ville}</h3>
                          <p className="text-sm text-gray-500">{cityStats.total_secteurs} secteurs • {cityStats.total_fi} FI</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600">{cityStats.total_membres}</p>
                          <p className="text-xs text-gray-500">Total Membres</p>
                        </div>
                        {expandedCity === cityStats.ville ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {expandedCity === cityStats.ville && (
                      <div className="p-4 bg-white border-t">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-indigo-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Building2 className="h-4 w-4 text-indigo-600" />
                              <p className="text-xs text-gray-600">Secteurs</p>
                            </div>
                            <p className="text-2xl font-bold text-indigo-600">{cityStats.total_secteurs}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <MapPin className="h-4 w-4 text-green-600" />
                              <p className="text-xs text-gray-600">Familles Impact</p>
                            </div>
                            <p className="text-2xl font-bold text-green-600">{cityStats.total_fi}</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Users className="h-4 w-4 text-blue-600" />
                              <p className="text-xs text-gray-600">Total Membres</p>
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{cityStats.total_membres}</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <Percent className="h-4 w-4 text-purple-600" />
                              <p className="text-xs text-gray-600">Fidélisation</p>
                            </div>
                            <p className="text-2xl font-bold text-purple-600">{cityStats.fidelisation}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
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
