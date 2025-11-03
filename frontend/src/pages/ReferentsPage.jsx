import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getReferents, getUser, createReferent, getCities, updateUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, UserPlus, Settings } from 'lucide-react';
import { toast } from 'sonner';

const ReferentsPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [referents, setReferents] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedReferent, setSelectedReferent] = useState(null);
  const [newReferent, setNewReferent] = useState({
    username: '',
    password: '',
    city: '',
    role: 'referent',
    assigned_month: '',
  });

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'promotions')) {
      navigate('/dashboard');
      return;
    }
    loadReferents();
    loadCities();
  }, [user, navigate]);

  const loadCities = async () => {
    try {
      const citiesData = await getCities();
      setCities(citiesData);
    } catch (error) {
      // Silent fail
    }
  };

  const loadReferents = async () => {
    try {
      const data = await getReferents();
      setReferents(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des référents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReferent = async (e) => {
    e.preventDefault();
    
    if (!newReferent.username || !newReferent.password || !newReferent.role || !newReferent.city) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (newReferent.role === 'referent' && !newReferent.assigned_month) {
      toast.error('Veuillez sélectionner un mois pour le référent');
      return;
    }

    try {
      await createReferent(newReferent);
      toast.success('Référent créé avec succès!');
      setIsDialogOpen(false);
      setNewReferent({
        username: '',
        password: '',
        city: '',
        role: 'referent',
        assigned_month: '',
      });
      loadReferents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    }
  };

  // Generate month options for the next 12 months
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = -3; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
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
            <h2 className="text-3xl font-bold text-gray-900" data-testid="referents-title">Référents</h2>
            <p className="text-gray-500 mt-1">Gérez vos référents et membres de l'équipe</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-referent-button">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Référent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau référent</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateReferent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ville ICC *</Label>
                  <Select 
                    value={newReferent.city} 
                    onValueChange={(value) => setNewReferent({...newReferent, city: value})}
                  >
                    <SelectTrigger data-testid="referent-city-select">
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
                  <Label htmlFor="username">Nom d'utilisateur *</Label>
                  <Input
                    id="username"
                    value={newReferent.username}
                    onChange={(e) => setNewReferent({...newReferent, username: e.target.value})}
                    placeholder="ex: referent_janvier"
                    data-testid="referent-username-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newReferent.password}
                    onChange={(e) => setNewReferent({...newReferent, password: e.target.value})}
                    placeholder="Choisissez un mot de passe"
                    data-testid="referent-password-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rôle *</Label>
                  <Select 
                    value={newReferent.role} 
                    onValueChange={(value) => setNewReferent({...newReferent, role: value, assigned_month: value !== 'referent' ? '' : newReferent.assigned_month})}
                  >
                    <SelectTrigger data-testid="referent-role-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="referent">Référent (mois spécifique)</SelectItem>
                      <SelectItem value="accueil">Accueil et Intégration</SelectItem>
                      <SelectItem value="promotions">Promotions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newReferent.role === 'referent' && (
                  <div className="space-y-2">
                    <Label htmlFor="assigned_month">Mois assigné *</Label>
                    <Select 
                      value={newReferent.assigned_month} 
                      onValueChange={(value) => setNewReferent({...newReferent, assigned_month: value})}
                    >
                      <SelectTrigger data-testid="referent-month-select">
                        <SelectValue placeholder="Sélectionnez un mois" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateMonthOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button type="submit" className="w-full" data-testid="submit-referent">
                  Créer le référent
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Referents List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des référents ({referents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun référent</p>
              ) : (
                referents.map((referent) => (
                  <div
                    key={referent.id}
                    className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                    data-testid={`referent-item-${referent.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <UserPlus className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{referent.username}</p>
                        <p className="text-sm text-gray-500">
                          {referent.role === 'referent' ? 'Référent' : 
                           referent.role === 'accueil' ? 'Accueil et Intégration' : 
                           'Promotions'}
                          {referent.assigned_month && ` - ${referent.assigned_month}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {referent.city}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ReferentsPage;
