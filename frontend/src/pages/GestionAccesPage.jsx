import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUsers, createUser, updateUser, deleteUser, blockUser, unblockUser, getCities, getSecteurs, getFamillesImpact, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Plus, Edit, Trash2, Lock, Unlock, Key, Eye } from 'lucide-react';
import { toast } from 'sonner';

const GestionAccesPage = () => {
  const navigate = useNavigate();
  const currentUser = getUser();
  const [users, setUsers] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    city: '',
    role: 'referent',
    assigned_month: null
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'super_admin') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [currentUser, navigate]);

  const loadData = async () => {
    try {
      const [usersData, citiesData] = await Promise.all([
        getUsers(),
        getCities()
      ]);
      setUsers(usersData);
      setCities(citiesData);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.username || !newUser.password || !newUser.city || !newUser.role) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await createUser(newUser);
      toast.success('Utilisateur créé avec succès!');
      setIsDialogOpen(false);
      setNewUser({ username: '', password: '', city: '', role: 'referent', assigned_month: null });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await blockUser(userId);
      toast.success('Utilisateur bloqué');
      loadData();
    } catch (error) {
      toast.error('Erreur lors du blocage');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await unblockUser(userId);
      toast.success('Utilisateur débloqué');
      loadData();
    } catch (error) {
      toast.error('Erreur lors du déblocage');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }
    
    try {
      await deleteUser(userId);
      toast.success('Utilisateur supprimé');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      'superviseur_promos': 'Superviseur Promotions',
      'superviseur_fi': 'Superviseur Familles d\'Impact',
      'referent': 'Responsable de Promos',
      'pilote_fi': 'Pilote FI',
      'responsable_secteur': 'Responsable Secteur',
      'accueil': 'Accueil et Intégration',
      'promotions': 'Promotions',
      'pasteur': 'Pasteur',
      'super_admin': 'Super Administrateur'
    };
    return labels[role] || role;
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
            <h2 className="text-3xl font-bold text-gray-900">Gestion des Accès</h2>
            <p className="text-gray-500 mt-1">Créez et gérez tous les accès utilisateurs</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom d'utilisateur *</Label>
                  <Input
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    placeholder="Nom d'utilisateur"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mot de passe *</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Mot de passe"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ville *</Label>
                  <Select value={newUser.city} onValueChange={(value) => setNewUser({...newUser, city: value})}>
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
                  <Label>Rôle *</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="superviseur_promos">Superviseur Promotions</SelectItem>
                      <SelectItem value="superviseur_fi">Superviseur Familles d'Impact</SelectItem>
                      <SelectItem value="referent">Responsable de Promos</SelectItem>
                      <SelectItem value="pilote_fi">Pilote FI</SelectItem>
                      <SelectItem value="responsable_secteur">Responsable Secteur</SelectItem>
                      <SelectItem value="accueil">Accueil et Intégration</SelectItem>
                      <SelectItem value="promotions">Promotions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newUser.role === 'referent' && (
                  <div className="space-y-2">
                    <Label>Mois assigné (YYYY-MM)</Label>
                    <Input
                      type="month"
                      value={newUser.assigned_month || ''}
                      onChange={(e) => setNewUser({...newUser, assigned_month: e.target.value})}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full">
                  Créer l'utilisateur
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des utilisateurs ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun utilisateur</p>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex justify-between items-center p-4 border rounded-lg ${user.is_blocked ? 'bg-red-50 border-red-200' : 'hover:bg-gray-50'}`}
                  >
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-gray-500">
                        {getRoleLabel(user.role)} - {user.city}
                        {user.assigned_month && ` - ${user.assigned_month}`}
                      </p>
                      {user.is_blocked && (
                        <p className="text-xs text-red-600 font-semibold">BLOQUÉ</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {user.is_blocked ? (
                        <Button 
                          onClick={() => handleUnblockUser(user.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Unlock className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleBlockUser(user.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Lock className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        onClick={() => handleDeleteUser(user.id)}
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
      </div>
    </Layout>
  );
};

export default GestionAccesPage;
