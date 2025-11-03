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
  const [newCityName, setNewCityName] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'promotions')) {
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
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <MapPin className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{city.name}</p>
                      <p className="text-sm text-gray-500">Ville ICC</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CitiesPage;
