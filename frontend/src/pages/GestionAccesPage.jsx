import React, { useState, useEffect } from 'react';
import { useCities } from '../contexts/CitiesContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUsers, createUser, updateUser, deleteUser, blockUser, unblockUser, getCities, getSecteurs, getFamillesImpact, getUser, resetUserPassword, exportCredentials } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Plus, Edit, Trash2, Lock, Unlock, Key, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';

const GestionAccesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const { cities } = useCities(); // Use shared cities from Context
  const [filtreVille, setFiltreVille] = useState('all');
  const [secteurs, setSecteurs] = useState([]);
  const [famillesImpact, setFamillesImpact] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({}); // Pour gérer l'affichage individuel
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    city: '',
    role: 'referent',
    telephone: '',
    promo_name: '',
    assigned_month: '', // Un seul mois sans année
    assigned_fi_id: null,
    assigned_fi_ids: [],
    assigned_secteur_id: null
  });

  useEffect(() => {
    const loggedUser = getUser();
    setCurrentUser(loggedUser);
    setUser(loggedUser);
    
    if (!loggedUser || !['super_admin', 'pasteur', 'responsable_eglise', 'superviseur_promos', 'superviseur_fi', 'responsable_secteur'].includes(loggedUser.role)) {
      navigate('/dashboard');
      return;
    }

    // Récupérer les utilisateurs, villes et secteurs/FI
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersData, secteursData, fisData] = await Promise.all([
          getUsers(),
          loggedUser?.role === 'super_admin' || loggedUser?.role === 'superviseur_fi' || loggedUser?.role === 'responsable_secteur' ? getSecteurs() : Promise.resolve([]),
          loggedUser?.role === 'super_admin' || loggedUser?.role === 'superviseur_fi' || loggedUser?.role === 'responsable_secteur' ? getFamillesImpact() : Promise.resolve([])
        ]);
        setUsers(usersData);
        setSecteurs(secteursData);
        setFamillesImpact(fisData);
      } catch (error) {
        toast.error('Erreur lors du chargement des données');
        console.error('Error details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validation pour pilote
    if (newUser.role === 'pilote_fi' && !newUser.telephone) {
      toast.error('Le numéro de téléphone est obligatoire pour les pilotes');
      return;
    }
    
    try {
      // Préparer les données en nettoyant les champs vides
      const dataToSend = {
        username: newUser.username,
        password: newUser.password,
        city: newUser.city,
        role: newUser.role,
      };
      
      // Ajouter uniquement les champs non vides
      if (newUser.telephone) {
        dataToSend.telephone = newUser.telephone;
      }
      
      // Gérer assigned_month pour les responsables de promos
      if ((newUser.role === 'referent' || newUser.role === 'responsable_promos') && newUser.assigned_month) {
        dataToSend.assigned_month = newUser.assigned_month;
      }
      
      await createUser(dataToSend);

      toast.success('Utilisateur créé avec succès!');
      setIsDialogOpen(false);
      setNewUser({ username: '', password: '', city: '', role: 'referent', telephone: '', promo_name: '', assigned_month: [], assigned_fi_id: null, assigned_fi_ids: [], assigned_secteur_id: null });
      // Rechargez la liste
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      const errorMsg = error.response?.data?.detail;
      // Si detail est un objet (erreur de validation), extraire le message
      const displayMsg = typeof errorMsg === 'string' 
        ? errorMsg 
        : Array.isArray(errorMsg) 
          ? errorMsg.map(e => e.msg).join(', ')
          : 'Erreur lors de la création';
      toast.error(displayMsg);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await updateUser(selectedUser.id, selectedUser);
      toast.success('Utilisateur mis à jour!');
      setIsEditDialogOpen(false);
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      const errorMsg = error.response?.data?.detail;
      const displayMsg = typeof errorMsg === 'string' 
        ? errorMsg 
        : Array.isArray(errorMsg) 
          ? errorMsg.map(e => e.msg).join(', ')
          : 'Erreur lors de la mise à jour';
      toast.error(displayMsg);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      toast.success('Utilisateur supprimé!');
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      const errorMsg = error.response?.data?.detail;
      const displayMsg = typeof errorMsg === 'string' 
        ? errorMsg 
        : Array.isArray(errorMsg) 
          ? errorMsg.map(e => e.msg).join(', ')
          : 'Erreur lors de la suppression';
      toast.error(displayMsg);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      const userToBlock = users.find(u => u.id === userId);
      if (userToBlock?.is_blocked) {
        await unblockUser(userId);
        toast.success('Utilisateur débloqué!');
      } else {
        await blockUser(userId);
        toast.success('Utilisateur bloqué!');
      }
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      const errorMsg = error.response?.data?.detail;
      const displayMsg = typeof errorMsg === 'string' 
        ? errorMsg 
        : Array.isArray(errorMsg) 
          ? errorMsg.map(e => e.msg).join(', ')
          : 'Erreur';
      toast.error(displayMsg);
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
      const errorMsg = error.response?.data?.detail;
      const displayMsg = typeof errorMsg === 'string' 
        ? errorMsg 
        : Array.isArray(errorMsg) 
          ? errorMsg.map(e => e.msg).join(', ')
          : 'Erreur lors de la réinitialisation';
      toast.error(displayMsg);
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
      'responsable_eglise': 'Responsable d\'Église',
      'gestion_projet': 'Gestion de Projet'
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
            <h1 className="text-3xl font-bold">Gestion des Accès</h1>
            <p className="text-gray-500">Gérer les utilisateurs et leurs permissions</p>
          </div>
          <div className="flex gap-2">
            {/* Bouton pour voir/cacher tous les mots de passe (super_admin uniquement) */}
            {user?.role === 'super_admin' && (
              <Button 
                variant="outline" 
                onClick={() => setShowPasswords(!showPasswords)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {showPasswords ? 'Masquer les mots de passe' : 'Voir les mots de passe'}
              </Button>
            )}
            {user?.role === 'super_admin' && (
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    const blob = await exportCredentials();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `credentials_${new Date().toISOString().split('T')[0]}.xlsx`;
                    a.click();
                    toast.success('Export réussi!');
                  } catch (error) {
                    toast.error('Erreur lors de l\'export');
                  }
                }}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exporter les identifiants
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom d'utilisateur *</Label>
                  <Input
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mot de passe *</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Téléphone {newUser.role === 'pilote_fi' && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    type="tel"
                    value={newUser.telephone || ''}
                    onChange={(e) => setNewUser({...newUser, telephone: e.target.value})}
                    placeholder="0612345678"
                    required={newUser.role === 'pilote_fi'}
                  />
                  {newUser.role === 'pilote_fi' && !newUser.telephone && (
                    <p className="text-xs text-red-500">Le numéro de téléphone est obligatoire pour les pilotes</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Ville *</Label>
                  <Select value={newUser.city} onValueChange={(val) => setNewUser({...newUser, city: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...cities].filter(c => c.name && c.name.trim() !== '').sort((a, b) => a.name.localeCompare(b.name)).map((city) => (
                        <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rôle *</Label>
                  <Select value={newUser.role} onValueChange={(val) => setNewUser({...newUser, role: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {user?.role === 'superviseur_promos' ? (
                        <SelectItem value="referent">Responsable de Promos</SelectItem>
                      ) : user?.role === 'superviseur_fi' ? (
                        <>
                          <SelectItem value="pilote_fi">Pilote FI</SelectItem>
                          <SelectItem value="responsable_secteur">Responsable Secteur</SelectItem>
                        </>
                      ) : user?.role === 'responsable_secteur' ? (
                        <SelectItem value="pilote_fi">Pilote FI</SelectItem>
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
                              <SelectItem value="gestion_projet">Gestion de Projet</SelectItem>
                            </>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {user?.role === 'superviseur_promos' && (
                    <p className="text-xs text-gray-500">Vous ne pouvez créer que des comptes Responsable de Promos</p>
                  )}
                  {user?.role === 'superviseur_fi' && (
                    <p className="text-xs text-gray-500">Vous pouvez créer: Pilote FI et Responsable Secteur</p>
                  )}
                  {user?.role === 'responsable_secteur' && (
                    <p className="text-xs text-gray-500">Vous ne pouvez créer que des comptes Pilote FI</p>
                  )}
                  {user?.role === 'responsable_secteur' && (
                    <p className="text-xs text-gray-500">Vous ne pouvez créer que des comptes Pilote FI</p>
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
                </div>

                {/* Bouton fixe en bas */}
                <div className="pt-4 border-t mt-4">
                  <Button type="submit" className="w-full">
                    Créer l'utilisateur
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Liste des pilotes pour responsable_secteur */}
        {currentUser.role === 'responsable_secteur' && (
          <Card>
            <CardHeader>
              <CardTitle>Liste des pilotes de votre secteur ({users.filter(u => u.role === 'pilote_fi').length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.filter(u => u.role === 'pilote_fi').length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucun pilote créé. Utilisez le bouton "+ Nouvel Utilisateur" pour créer votre premier pilote.</p>
                ) : (
                  <div className="grid gap-3">
                    {users.filter(u => u.role === 'pilote_fi').map((pilote) => (
                      <div key={pilote.id} className="border rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                        <div>
                          <div className="font-medium">{pilote.username}</div>
                          <div className="text-sm text-gray-500">{pilote.city}</div>
                          {pilote.assigned_fi_ids && pilote.assigned_fi_ids.length > 0 && (
                            <div className="text-xs text-gray-400">FI assignées: {pilote.assigned_fi_ids.length}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedUser(pilote); setIsEditDialogOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filtre ville pour superadmin et pasteur */}
            {(user?.role === 'super_admin' || user?.role === 'pasteur') && (
              <div className="mb-4 flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Filtrer par ville</Label>
                  <Select value={filtreVille} onValueChange={setFiltreVille}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les villes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les villes</SelectItem>
                      {cities.filter(city => city.name && city.name.trim() !== '').map((city) => (
                        <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Utilisateur</th>
                    <th className="text-left p-2">Ville</th>
                    <th className="text-left p-2">Rôle</th>
                    {user?.role === 'super_admin' && (
                      <th className="text-left p-2">Mot de passe</th>
                    )}
                    <th className="text-left p-2">Statut</th>
                    <th className="text-right p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => filtreVille === 'all' || u.city === filtreVille).map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{u.username}</td>
                      <td className="p-2">{u.city}</td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      {user?.role === 'super_admin' && (
                        <td className="p-2">
                          {showPasswords ? (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{u.plain_password || '***'}</code>
                          ) : (
                            <span className="text-gray-400 text-xs">•••••••</span>
                          )}
                        </td>
                      )}
                      <td className="p-2">
                        {u.is_blocked ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Bloqué</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Actif</span>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => { setSelectedUser(u); setIsEditDialogOpen(true); }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => { setSelectedUser(u); setIsResetPasswordDialogOpen(true); }}
                          >
                            <Key className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleBlockUser(u.id)}
                          >
                            {u.is_blocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                          </Button>
                          {user?.role === 'super_admin' && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                if (window.confirm(`Supprimer ${u.username} ?`)) {
                                  handleDeleteUser(u.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog Edit User */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom d'utilisateur</Label>
                  <Input
                    value={selectedUser?.username || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={selectedUser?.telephone || ''}
                    onChange={(e) => setSelectedUser({...selectedUser, telephone: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ville</Label>
                  <Select 
                    value={selectedUser?.city || ''} 
                    onValueChange={(val) => setSelectedUser({...selectedUser, city: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(cities) && cities.map((city) => {
                        const cityValue = typeof city === 'string' ? city : city?.name;
                        const cityKey = typeof city === 'string' ? city : city?.id || city?.name;
                        return (
                          <SelectItem key={cityKey} value={cityValue}>
                            {cityValue}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rôle</Label>
                  <Select 
                    value={selectedUser?.role || ''} 
                    onValueChange={(val) => setSelectedUser({...selectedUser, role: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Administrateur</SelectItem>
                      <SelectItem value="pasteur">Pasteur</SelectItem>
                      <SelectItem value="responsable_eglise">Responsable d'Église</SelectItem>
                      <SelectItem value="superviseur_promos">Superviseur Promotions</SelectItem>
                      <SelectItem value="resp_bergers">Responsable Bergers</SelectItem>
                      <SelectItem value="berger">Berger</SelectItem>
                      <SelectItem value="gestion_projet">Gestion Projet</SelectItem>
                      <SelectItem value="accueil_integration">Accueil et Intégration</SelectItem>
                      <SelectItem value="referent">Référent</SelectItem>
                      <SelectItem value="responsable_promos">Responsable de Promos</SelectItem>
                      <SelectItem value="pilote">Pilote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Reset Password */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-gray-600">Utilisateur: <strong>{selectedUser?.username}</strong></p>
              <div>
                <Label>Nouveau mot de passe</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Réinitialiser</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default GestionAccesPage;