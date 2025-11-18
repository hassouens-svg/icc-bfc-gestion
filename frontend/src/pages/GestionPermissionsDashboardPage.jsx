import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUsers, updateUser, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { 
  Shield, 
  Save, 
  X,
  Eye,
  BarChart3,
  Users,
  TrendingUp,
  Calendar,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

// Default dashboard permissions per role
const DEFAULT_PERMISSIONS = {
  superviseur_promos: {
    can_see_kpis: true,
    can_see_visitors_table: true,
    can_see_analytics: true,
    can_see_fidelisation: true,
    can_see_charts: true,
    can_see_referents_list: true,
    can_export_data: true
  },
  superviseur_fi: {
    can_see_kpis: true,
    can_see_secteurs_table: true,
    can_see_fi_table: true,
    can_see_membres_table: true,
    can_see_charts: true,
    can_see_fidelisation_fi: true,
    can_export_data: true
  },
  referent: {
    can_see_own_visitors: true,
    can_see_own_stats: true,
    can_see_own_fidelisation: true,
    can_add_comments: true,
    can_mark_presence: true,
    can_see_charts: false
  },
  accueil: {
    can_see_visitors_list: true,
    can_see_limited_info: true
  },
  promotions: {
    can_see_all_visitors: true,
    can_see_analytics: true,
    can_see_charts: true,
    can_export_data: true
  },
  pilote_fi: {
    can_see_own_fi: true,
    can_see_membres: true,
    can_mark_presences: true,
    can_see_presences_table: true,
    can_add_membres: true
  },
  responsable_secteur: {
    can_see_secteur_fi: true,
    can_see_secteur_stats: true,
    can_see_membres: true
  }
};

const PERMISSION_LABELS = {
  // Promotions
  can_see_kpis: 'Voir les KPIs',
  can_see_visitors_table: 'Voir le tableau des visiteurs',
  can_see_analytics: 'Voir les analytics',
  can_see_fidelisation: 'Voir la fidélisation',
  can_see_charts: 'Voir les graphiques',
  can_see_referents_list: 'Voir la liste des référents',
  can_export_data: 'Exporter les données',
  can_see_own_visitors: 'Voir ses propres visiteurs',
  can_see_own_stats: 'Voir ses propres stats',
  can_see_own_fidelisation: 'Voir sa propre fidélisation',
  can_add_comments: 'Ajouter des commentaires',
  can_mark_presence: 'Marquer les présences',
  can_see_visitors_list: 'Voir la liste des visiteurs',
  can_see_limited_info: 'Vue limitée (lecture seule)',
  can_see_all_visitors: 'Voir tous les visiteurs',
  
  // FI
  can_see_secteurs_table: 'Voir le tableau des secteurs',
  can_see_fi_table: 'Voir le tableau des FI',
  can_see_membres_table: 'Voir le tableau des membres',
  can_see_fidelisation_fi: 'Voir la fidélisation FI',
  can_see_own_fi: 'Voir sa propre FI',
  can_see_membres: 'Voir les membres',
  can_mark_presences: 'Marquer les présences',
  can_see_presences_table: 'Voir le tableau des présences',
  can_add_membres: 'Ajouter des membres',
  can_see_secteur_fi: 'Voir les FI du secteur',
  can_see_secteur_stats: 'Voir les stats du secteur'
};

const GestionPermissionsDashboardPage = () => {
  const navigate = useNavigate();
  const currentUser = getUser();
  
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser || !['super_admin', 'pasteur'].includes(currentUser.role)) {
      navigate('/dashboard');
      return;
    }
    loadUsers();
    // eslint-disable-next-line
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      // Exclude super_admin and pasteur from the list
      const filteredUsers = data.filter(u => !['super_admin', 'pasteur'].includes(u.role));
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    // Load existing permissions or default
    const existing = user.dashboard_permissions || DEFAULT_PERMISSIONS[user.role] || {};
    setPermissions(existing);
  };

  const handleTogglePermission = (key) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    try {
      await updateUser(selectedUser.id, {
        dashboard_permissions: permissions
      });
      
      toast.success('Permissions mises à jour avec succès!');
      
      // Reload users
      await loadUsers();
      setSelectedUser(null);
      setPermissions({});
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!selectedUser) return;
    const defaultPerms = DEFAULT_PERMISSIONS[selectedUser.role] || {};
    setPermissions(defaultPerms);
    toast.info('Permissions réinitialisées aux valeurs par défaut');
  };

  const getAvailablePermissions = (role) => {
    const defaults = DEFAULT_PERMISSIONS[role] || {};
    return Object.keys(defaults);
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
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Gestion des Permissions Dashboard</h2>
            <p className="text-gray-500 mt-1">
              Contrôlez ce que chaque utilisateur peut voir dans son dashboard
            </p>
          </div>
          <Button onClick={() => navigate(-1)} variant="outline">
            Retour
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Liste des utilisateurs */}
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner un Utilisateur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition ${
                      selectedUser?.id === user.id ? 'border-indigo-500 bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-gray-500">
                          Rôle: <span className="font-medium">{user.role}</span>
                        </p>
                        <p className="text-sm text-gray-500">Ville: {user.city}</p>
                      </div>
                      {user.dashboard_permissions && (
                        <Shield className="h-4 w-4 text-indigo-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {users.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  Aucun utilisateur disponible
                </p>
              )}
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedUser ? `Permissions - ${selectedUser.username}` : 'Sélectionnez un utilisateur'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedUser ? (
                <div className="space-y-6">
                  {/* Role info */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">
                      Rôle: <span className="text-indigo-600">{selectedUser.role}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Ville: {selectedUser.city}
                    </p>
                  </div>

                  {/* Permissions checkboxes */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {getAvailablePermissions(selectedUser.role).map((key) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={permissions[key] || false}
                          onCheckedChange={() => handleTogglePermission(key)}
                        />
                        <label
                          htmlFor={key}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {PERMISSION_LABELS[key] || key}
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleSave} 
                      disabled={saving}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                    <Button 
                      onClick={handleReset} 
                      variant="outline"
                    >
                      Réinitialiser
                    </Button>
                    <Button 
                      onClick={() => {
                        setSelectedUser(null);
                        setPermissions({});
                      }} 
                      variant="outline"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Sélectionnez un utilisateur pour gérer ses permissions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Légende */}
        <Card>
          <CardHeader>
            <CardTitle>Légende des Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-indigo-600" />
                  Promotions
                </h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Voir les KPIs globaux</li>
                  <li>• Tableau des visiteurs</li>
                  <li>• Analytics et graphiques</li>
                  <li>• Fidélisation</li>
                  <li>• Export des données</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center">
                  <Users className="h-4 w-4 mr-2 text-green-600" />
                  Familles d'Impact
                </h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Tableau des secteurs</li>
                  <li>• Tableau des FI</li>
                  <li>• Tableau des membres</li>
                  <li>• Marquer les présences</li>
                  <li>• Fidélisation FI</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-orange-600" />
                  Gestion
                </h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Ajouter des commentaires</li>
                  <li>• Marquer les présences</li>
                  <li>• Ajouter des membres</li>
                  <li>• Voir ses propres stats</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Note */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Note:</strong> Les permissions définies ici contrôlent ce que les utilisateurs peuvent voir
            dans leurs dashboards respectifs. Les permissions de base (accès aux pages) restent déterminées par
            leur rôle.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default GestionPermissionsDashboardPage;
