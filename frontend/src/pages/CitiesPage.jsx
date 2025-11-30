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
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCity, setCurrentCity] = useState({ id: '', name: '', country: 'France' });
  const [currentPage, setCurrentPage] = useState(0);
  const [citiesPerPage] = useState(10);

  const loadCities = async () => {
    setLoading(true);
    console.log('CitiesPage: Début chargement villes...');
    try {
      const data = await getCities();
      console.log('CitiesPage: Données reçues:', data?.length, 'villes');
      setCities(data || []);
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
            <CardTitle>Liste des Villes ({cities.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Nom</th>
                    <th className="text-left p-4">Pays</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCities.map((city) => (
                    <tr key={city.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-indigo-600" />
                          <span className="font-medium">{city.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{city.country}</td>
                      <td className="p-4">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(city)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(city.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
