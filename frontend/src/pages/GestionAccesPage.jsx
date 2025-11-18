import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUsers, createUser, updateUser, deleteUser, blockUser, unblockUser, getCities, getSecteurs, getFamillesImpact, getUser, resetUserPassword } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Plus, Edit, Trash2, Lock, Unlock, Key, Eye } from 'lucide-react';
import { toast } from 'sonner';

const GestionAccesPage = () => {
  const navigate = useNavigate();
  const currentUser = getUser();
  const [user, setUser] = useState(currentUser);
  const [users, setUsers] = useState([]);
  const [cities, setCities] = useState([]);
  const [secteurs, setSecteurs] = useState([]);
  const [famillesImpact, setFamillesImpact] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    city: '',
    role: 'referent',
    telephone: '',
    promo_name: '',
    assigned_month: [], // Changé en tableau pour sélection multiple
    assigned_fi_id: null,
    assigned_fi_ids: [],
    assigned_secteur_id: null
  });

  useEffect(() => {
    if (!currentUser || !['super_admin', 'pasteur', 'responsable_eglise', 'superviseur_promos', 'responsable_secteur'].includes(currentUser.role)) {
      navigate('/dashboard');
      return;
    }
    setUser(currentUser);
    
    // Pour responsable_eglise, superviseur_promos et responsable_secteur, fixer automatiquement la ville et le rôle
    if (currentUser.role === 'responsable_eglise' || currentUser.role === 'superviseur_promos') {
      setNewUser(prev => ({ 
        ...prev, 
        city: currentUser.city,
        role: currentUser.role === 'superviseur_promos' ? 'referent' : 'referent' // superviseur_promos ne peut créer que referent
      }));
    } else if (currentUser.role === 'responsable_secteur') {
      setNewUser(prev => ({ 
        ...prev, 
        city: currentUser.city,
        role: 'pilote_fi' // responsable_secteur ne peut créer que pilote_fi
      }));
    }
    
    loadData();
    // eslint-disable-next-line
  }, []);

  const loadData = async () => {
    try {
      const [usersData, citiesData, secteursData, fisData] = await Promise.all([
        getUsers(),
        getCities(),
        getSecteurs(),
        getFamillesImpact()
      ]);
      setUsers(usersData);
      setCities(citiesData);
      setSecteurs(secteursData);
      setFamillesImpact(fisData);
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

    // Vérifier que pour referent, au moins un mois est sélectionné
    if (newUser.role === 'referent' && (!Array.isArray(newUser.assigned_month) || newUser.assigned_month.length === 0)) {
      toast.error('Veuillez sélectionner au moins un mois pour le Responsable de Promos');
      return;
    }

    try {
      // Convertir le tableau de mois en string séparé par des virgules
      const userData = {...newUser};
      if (Array.isArray(userData.assigned_month)) {
        userData.assigned_month = userData.assigned_month.join(',');
      }
      
      await createUser(userData);
      toast.success('Utilisateur créé avec succès!');
      setIsDialogOpen(false);
      setNewUser({ username: '', password: '', city: '', role: 'referent', promo_name: '', assigned_month: [], assigned_fi_id: null, assigned_fi_ids: [], assigned_secteur_id: null });
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

  const handleEditUser = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      const updateData = {
        username: selectedUser.username,
        assigned_month: selectedUser.assigned_month,
        promo_name: selectedUser.promo_name || null,
        assigned_fi_id: selectedUser.assigned_fi_id,
        assigned_fi_ids: selectedUser.assigned_fi_ids || [],
        assigned_secteur_id: selectedUser.assigned_secteur_id
      };
      
      // Si super_admin, permettre de modifier ville et rôle
      if (user?.role === 'super_admin') {
        updateData.city = selectedUser.city;
        updateData.role = selectedUser.role;
      }
      
      await updateUser(selectedUser.id, updateData);
      toast.success('Utilisateur modifié avec succès!');
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la modification');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!selectedUser || !newPassword) {
      toast.error('Veuillez entrer un nouveau mot de passe');
      return;
    }

    try {
      await resetUserPassword(selectedUser.id, newPassword);
      toast.success('Mot de passe réinitialisé avec succès!');
      setIsResetPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la réinitialisation');
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
      'super_admin': 'Super Administrateur',
      'responsable_eglise': 'Responsable d\'Église'
    };
    return labels[role] || role;
  };

  // Générer les mois de Janvier 2024 à Décembre 2030
  const generateMonths = () => {
    const months = [];
    for (let year = 2024; year <= 2030; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        months.push({
          value: `${year}-${monthStr}`,
          label: `${getMonthName(month)} ${year}`
        });
      }
    }
    return months;
  };

  const getMonthName = (month) => {
    const names = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return names[month - 1];
  };

  const toggleMonth = (month) => {
    setNewUser(prev => {
      const months = Array.isArray(prev.assigned_month) ? prev.assigned_month : [];
      if (months.includes(month)) {
        return {...prev, assigned_month: months.filter(m => m !== month)};
      } else {
        return {...prev, assigned_month: [...months, month]};
      }
    });
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
                  <Label>Téléphone {newUser.role === 'pilote_fi' && '*'}</Label>
                  <Input
                    type="tel"
                    value={newUser.telephone}
                    onChange={(e) => setNewUser({...newUser, telephone: e.target.value})}
                    placeholder="+33 6 12 34 56 78"
                  />
                  {newUser.role === 'pilote_fi' && (
                    <p className="text-xs text-gray-500">
                      Requis pour les pilotes FI (affiché sur la carte de localisation)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Ville *</Label>
                  {user?.role === 'responsable_eglise' ? (
                    <div className="px-3 py-2 border rounded-md bg-gray-50">
                      <p className="text-sm font-medium text-gray-700">{newUser.city}</p>
                      <p className="text-xs text-gray-500">Votre ville assignée (fixe)</p>
                    </div>
                  ) : (
                    <Select 
                      value={newUser.city} 
                      onValueChange={(value) => setNewUser({...newUser, city: value})}
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
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Rôle *</Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value) => setNewUser({...newUser, role: value})}
                    disabled={user?.role === 'superviseur_promos'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {user?.role === 'superviseur_promos' ? (
                        <SelectItem value="referent">Responsable de Promos</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="superviseur_promos">Superviseur Promotions</SelectItem>
                          <SelectItem value="superviseur_fi">Superviseur Familles d'Impact</SelectItem>
                          <SelectItem value="referent">Responsable de Promos</SelectItem>
                          <SelectItem value="pilote_fi">Pilote FI</SelectItem>
                          <SelectItem value="responsable_secteur">Responsable Secteur</SelectItem>
                          <SelectItem value="accueil">Accueil et Intégration</SelectItem>
                          <SelectItem value="responsable_evangelisation">Responsable Évangélisation</SelectItem>
                          {user?.role === 'super_admin' && (
                            <>
                              <SelectItem value="promotions">Promotions</SelectItem>
                              <SelectItem value="responsable_eglise">Responsable d'Église</SelectItem>
                            </>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {user?.role === 'superviseur_promos' && (
                    <p className="text-xs text-gray-500">Vous ne pouvez créer que des comptes Responsable de Promos</p>
                  )}
                </div>

                {(newUser.role === 'referent' || newUser.role === 'promotions') && (
                  <div className="space-y-2">
                    <Label>Nom de la promo (optionnel)</Label>
                    <Input
                      value={newUser.promo_name || ''}
                      onChange={(e) => setNewUser({...newUser, promo_name: e.target.value})}
                      placeholder="Ex: Promo Excellence, Novembre 2024..."
                    />
                    <p className="text-xs text-gray-500">
                      Remplace l'affichage du mois assigné dans les dashboards
                    </p>
                  </div>
                )}

                {newUser.role === 'referent' && (
                  <div className="space-y-2">
                    <Label>Mois assignés (sélection multiple) *</Label>
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {generateMonths().map((month) => (
                          <label key={month.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={Array.isArray(newUser.assigned_month) && newUser.assigned_month.includes(month.value)}
                              onChange={() => toggleMonth(month.value)}
                              className="rounded"
                            />
                            <span className="text-sm">{month.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {Array.isArray(newUser.assigned_month) && newUser.assigned_month.length > 0
                        ? `${newUser.assigned_month.length} mois sélectionné(s)`
                        : 'Aucun mois sélectionné'}
                    </p>
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
                      <Button 
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditDialogOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => {
                          setSelectedUser(user);
                          setIsResetPasswordDialogOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        title="Réinitialiser le mot de passe"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      {user.is_blocked ? (
                        <Button 
                          onClick={() => handleUnblockUser(user.id)}
                          variant="outline"
                          size="sm"
                          title="Débloquer"
                        >
                          <Unlock className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleBlockUser(user.id)}
                          variant="outline"
                          size="sm"
                          title="Bloquer"
                        >
                          <Lock className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        onClick={() => handleDeleteUser(user.id)}
                        variant="destructive"
                        size="sm"
                        title="Supprimer"
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

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <form onSubmit={handleEditUser} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom d'utilisateur</Label>
                  <Input
                    value={selectedUser.username}
                    onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})}
                    placeholder="Nom d'utilisateur"
                  />
                </div>

                {user?.role === 'super_admin' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Rôle</Label>
                      <Select 
                        value={selectedUser.role} 
                        onValueChange={(value) => setSelectedUser({...selectedUser, role: value})}
                      >
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
                          <SelectItem value="responsable_eglise">Responsable d'Église</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Ville</Label>
                      <Select 
                        value={selectedUser.city} 
                        onValueChange={(value) => setSelectedUser({...selectedUser, city: value})}
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
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Rôle</Label>
                      <Input
                        value={getRoleLabel(selectedUser.role)}
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500">Le rôle ne peut pas être modifié.</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Ville</Label>
                      <Input
                        value={selectedUser.city}
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500">La ville ne peut pas être modifiée.</p>
                    </div>
                  </>
                )}

                {selectedUser.role === 'referent' && (
                  <>
                    <div className="space-y-2">
                      <Label>Mois assignés</Label>
                      <Input
                        value={selectedUser.assigned_month || ''}
                        onChange={(e) => setSelectedUser({...selectedUser, assigned_month: e.target.value})}
                        placeholder="2024-01,2024-02,2024-03"
                      />
                      <p className="text-xs text-gray-500">Format: YYYY-MM, séparés par des virgules</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Nom personnalisé de la promo (optionnel)</Label>
                      <Input
                        value={selectedUser.promo_name || ''}
                        onChange={(e) => setSelectedUser({...selectedUser, promo_name: e.target.value})}
                        placeholder="Ex: Promo Excellence, Novembre 2024..."
                      />
                      <p className="text-xs text-gray-500">Remplace l'affichage du mois (ex: "2024-11")</p>
                    </div>
                  </>
                )}

                {selectedUser.role === 'promotions' && (
                  <div className="space-y-2">
                    <Label>Nom personnalisé de la promo (optionnel)</Label>
                    <Input
                      value={selectedUser.promo_name || ''}
                      onChange={(e) => setSelectedUser({...selectedUser, promo_name: e.target.value})}
                      placeholder="Ex: Promo Excellence, Novembre 2024..."
                    />
                    <p className="text-xs text-gray-500">Remplace l'affichage du mois assigné</p>
                  </div>
                )}

                {selectedUser.role === 'responsable_secteur' && (
                  <div className="space-y-2">
                    <Label>Secteur assigné</Label>
                    <Select 
                      value={selectedUser.assigned_secteur_id || ''} 
                      onValueChange={(value) => setSelectedUser({...selectedUser, assigned_secteur_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un secteur" />
                      </SelectTrigger>
                      <SelectContent>
                        {secteurs
                          .filter(s => s.city === selectedUser.city)
                          .map((secteur) => (
                            <SelectItem key={secteur.id} value={secteur.id}>
                              {secteur.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedUser.role === 'pilote_fi' && (
                  <div className="space-y-2">
                    <Label>Familles d'Impact assignées (plusieurs possibles)</Label>
                    <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                      {famillesImpact
                        .filter(fi => fi.ville === selectedUser.city)
                        .map((fi) => (
                          <div key={fi.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`fi-${fi.id}`}
                              checked={(selectedUser.assigned_fi_ids || []).includes(fi.id)}
                              onCheckedChange={(checked) => {
                                const currentFIs = selectedUser.assigned_fi_ids || [];
                                const newFIs = checked 
                                  ? [...currentFIs, fi.id]
                                  : currentFIs.filter(id => id !== fi.id);
                                setSelectedUser({...selectedUser, assigned_fi_ids: newFIs});
                              }}
                            />
                            <label htmlFor={`fi-${fi.id}`} className="text-sm cursor-pointer">
                              {fi.nom} ({fi.ville})
                            </label>
                          </div>
                        ))}
                      {famillesImpact.filter(fi => fi.ville === selectedUser.city).length === 0 && (
                        <p className="text-sm text-gray-500">Aucune FI disponible pour cette ville</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1">
                    Enregistrer
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>Utilisateur</Label>
                  <Input
                    value={selectedUser.username}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nouveau mot de passe *</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Entrez le nouveau mot de passe"
                    required
                  />
                  <p className="text-xs text-gray-500">Minimum 6 caractères recommandés</p>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1">
                    Réinitialiser
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsResetPasswordDialogOpen(false);
                      setSelectedUser(null);
                      setNewPassword('');
                    }}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default GestionAccesPage;
