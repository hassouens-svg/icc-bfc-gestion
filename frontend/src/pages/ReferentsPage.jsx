import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getReferents, getUser, createReferent, getCities, updateUser, deleteUser, blockUser, unblockUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, UserPlus, Settings, Trash2, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const ReferentsPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [referents, setReferents] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReferent, setSelectedReferent] = useState(null);
  const [newReferent, setNewReferent] = useState({
    username: '',
    password: '',
    city: '',
    role: 'referent',
    assigned_month: '',
  });

  useEffect(() => {
    if (!user || !['admin', 'promotions', 'super_admin', 'pasteur', 'responsable_eglise', 'superviseur_promos'].includes(user.role)) {
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
      toast.error('Erreur lors du chargement des bergers');
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
      toast.error('Veuillez sélectionner un mois pour le berger');
      return;
    }

    try {
      await createReferent(newReferent);
      toast.success('Berger créé avec succès!');
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

  const handleManageReferent = (referent) => {
    setSelectedReferent({
      ...referent,
      permissions: referent.permissions || {
        can_view_all_months: false,
        can_edit_visitors: true,
        can_stop_tracking: true,
        can_add_comments: true,
        can_mark_presence: true,
        can_view_analytics: false
      }
    });
    setIsManageDialogOpen(true);
  };

  const handleUpdateResponsableDePromos = async (e) => {
    e.preventDefault();
    
    try {
      const updateData = {
        username: selectedReferent.username,
        assigned_month: selectedReferent.assigned_month,
        permissions: selectedReferent.permissions
      };
      
      await updateUser(selectedReferent.id, updateData);
      toast.success('Berger mis à jour avec succès!');
      setIsManageDialogOpen(false);
      loadReferents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    }
  };

  const togglePermission = (permission) => {
    setSelectedReferent({
      ...selectedReferent,
      permissions: {
        ...selectedReferent.permissions,
        [permission]: !selectedReferent.permissions[permission]
      }
    });
  };

  const handleDeleteReferent = async () => {
    try {
      await deleteUser(selectedReferent.id);
      toast.success('Utilisateur supprimé avec succès!');
      setIsDeleteDialogOpen(false);
      setIsManageDialogOpen(false);
      loadReferents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const handleBlockReferent = async () => {
    try {
      if (selectedReferent.is_blocked) {
        await unblockUser(selectedReferent.id);
        toast.success('Utilisateur débloqué avec succès!');
      } else {
        await blockUser(selectedReferent.id);
        toast.success('Utilisateur bloqué avec succès!');
      }
      setIsManageDialogOpen(false);
      loadReferents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors du blocage/déblocage');
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
            <h2 className="text-3xl font-bold text-gray-900" data-testid="referents-title">Bergers</h2>
            <p className="text-gray-500 mt-1">Gérez vos bergers et membres de l'équipe</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-referent-button">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Berger
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau berger</DialogTitle>
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
                      <SelectItem value="referent">Berger (mois spécifique)</SelectItem>
                      <SelectItem value="accueil">Accueil et Intégration</SelectItem>
                      <SelectItem value="promotions">Bergeries</SelectItem>
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
                  Créer le berger
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bergers List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des bergers ({referents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun berger</p>
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
                          {referent.role === 'referent' ? 'Berger' : 
                           referent.role === 'accueil' ? 'Accueil et Intégration' : 
                           'Bergeries'}
                          {referent.assigned_month && ` - ${referent.assigned_month}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        {referent.city}
                      </div>
                      <Button 
                        onClick={() => handleManageReferent(referent)}
                        variant="outline"
                        size="sm"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Gérer
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Management Dialog */}
        <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gérer le berger - {selectedReferent?.username}</DialogTitle>
            </DialogHeader>
            {selectedReferent && (
              <form onSubmit={handleUpdateResponsableDePromos} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="manage-username">Nom d'utilisateur</Label>
                    <Input
                      id="manage-username"
                      value={selectedReferent.username}
                      onChange={(e) => setSelectedReferent({...selectedReferent, username: e.target.value})}
                      placeholder="Nom d'utilisateur"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manage-role">Rôle</Label>
                    <Input
                      id="manage-role"
                      value={selectedReferent.role === 'referent' ? 'Berger' : 
                             selectedReferent.role === 'accueil' ? 'Accueil et Intégration' : 
                             selectedReferent.role === 'promotions' ? 'Bergeries' : 
                             selectedReferent.role}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>

                  {selectedReferent.role === 'referent' && (
                    <div className="space-y-2">
                      <Label htmlFor="manage-month">Mois assigné</Label>
                      <Select 
                        value={selectedReferent.assigned_month || ''} 
                        onValueChange={(value) => setSelectedReferent({...selectedReferent, assigned_month: value})}
                      >
                        <SelectTrigger>
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
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Permissions</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Voir tous les mois</p>
                        <p className="text-sm text-gray-500">Accès aux données de tous les mois</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedReferent.permissions?.can_view_all_months || false}
                        onChange={() => togglePermission('can_view_all_months')}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Modifier les nouveaux arrivants et nouveaux convertiss</p>
                        <p className="text-sm text-gray-500">Éditer les informations des nouveaux arrivants et nouveaux convertiss</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedReferent.permissions?.can_edit_visitors || false}
                        onChange={() => togglePermission('can_edit_visitors')}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Arrêter le suivi</p>
                        <p className="text-sm text-gray-500">Marquer les nouveaux arrivants et nouveaux convertiss comme arrêtés</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedReferent.permissions?.can_stop_tracking || false}
                        onChange={() => togglePermission('can_stop_tracking')}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Ajouter des commentaires</p>
                        <p className="text-sm text-gray-500">Commenter les fiches nouveaux arrivants et nouveaux convertiss</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedReferent.permissions?.can_add_comments || false}
                        onChange={() => togglePermission('can_add_comments')}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Marquer les présences</p>
                        <p className="text-sm text-gray-500">Gérer les présences aux événements</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedReferent.permissions?.can_mark_presence || false}
                        onChange={() => togglePermission('can_mark_presence')}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Voir les analytics</p>
                        <p className="text-sm text-gray-500">Accès aux statistiques et rapports</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedReferent.permissions?.can_view_analytics || false}
                        onChange={() => togglePermission('can_view_analytics')}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex space-x-2">
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
                    
                    {user.city === 'Dijon' && (
                      <Button 
                        type="button"
                        variant={selectedReferent.is_blocked ? "default" : "outline"}
                        onClick={handleBlockReferent}
                      >
                        {selectedReferent.is_blocked ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Débloquer
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-2" />
                            Bloquer
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
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
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer {selectedReferent?.username} ?
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteReferent} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default ReferentsPage;
