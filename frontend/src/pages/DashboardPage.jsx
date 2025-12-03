import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStats, getUser, exportExcel, updateUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Users, UserPlus, TrendingUp, Download, BarChart3, Calendar, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '../components/ui/checkbox';

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newPromoName, setNewPromoName] = useState('');
  const [selectedMonths, setSelectedMonths] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadStats();
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (error) {
      // Pas de message d'erreur affiché
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportExcel();
      toast.success('Export Excel réussi!');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleRenamePromo = async () => {
    if (!newPromoName.trim() && selectedMonths.length === 0) {
      toast.error('Veuillez entrer un nom ou sélectionner au moins un mois');
      return;
    }

    try {
      const updateData = {};
      if (newPromoName.trim()) {
        updateData.promo_name = newPromoName;
      }
      if (selectedMonths.length > 0) {
        updateData.assigned_month = selectedMonths.length > 1 ? selectedMonths : selectedMonths[0];
      }
      
      await updateUser(user.id, updateData);
      toast.success('Modifications enregistrées avec succès!');
      setIsRenameDialogOpen(false);
      // Update local user data
      const updatedUser = { ...user, ...updateData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload(); // Reload to update all displays
    } catch (error) {
      console.error('Erreur modification:', error);
      const errorMsg = error?.response?.data?.detail || error?.message || 'Erreur lors de la modification';
      toast.error(errorMsg);
    }
  };

  const openRenameDialog = () => {
    setNewPromoName(user?.promo_name || '');
    // Initialize selected months from user's assigned_month
    if (user?.assigned_month) {
      const months = Array.isArray(user.assigned_month) 
        ? user.assigned_month 
        : [user.assigned_month];
      console.log('Initializing months:', months, 'from user:', user.assigned_month);
      setSelectedMonths(months);
    } else {
      console.log('No assigned_month found for user');
      setSelectedMonths([]);
    }
    setIsRenameDialogOpen(true);
  };

  const generateMonths = () => {
    const months = [];
    const currentYear = new Date().getFullYear();
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    // Generate months for previous year, current year, next year, and year after
    for (let year = currentYear - 1; year <= currentYear + 2; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        months.push({
          value: `${year}-${monthStr}`,
          label: `${monthNames[month - 1]} ${year}`
        });
      }
    }
    return months;
  };

  const toggleMonth = (monthValue) => {
    setSelectedMonths(prev => {
      if (prev.includes(monthValue)) {
        return prev.filter(m => m !== monthValue);
      } else {
        return [...prev, monthValue];
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
        {/* Verset biblique pour les Bergers */}
        {(user?.role === 'berger' || user?.role === 'referent') && (
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📖</div>
                <div>
                  <p className="text-sm font-semibold text-purple-800 mb-2">Jérémie 3:15</p>
                  <p className="text-base italic text-gray-700 leading-relaxed">
                    "Je vous donnerai des bergers selon mon cœur, qui vous paîtront avec intelligence et avec sagesse."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">
                Tableau de bord - {user?.promo_name || user?.assigned_month || 'Bergerie'}
              </h2>
              {(['promotions', 'responsable_promos', 'referent', 'berger'].includes(user?.role)) && (
                <Button 
                  onClick={openRenameDialog} 
                  variant="outline" 
                  size="sm"
                  title="Modifier les informations"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-gray-500 mt-1">
              {['super_admin', 'pasteur'].includes(user?.role) && localStorage.getItem('selected_city_view') 
                ? localStorage.getItem('selected_city_view') 
                : 'Vue d\'ensemble de votre activité'}
            </p>
          </div>
          <div className="flex space-x-2">
            {(user?.role === 'referent' || user?.role === 'promotions' || user?.role === 'admin') && (
              <Button 
                onClick={() => window.location.href = '/marquer-presences'} 
                className="bg-green-600 hover:bg-green-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Marquer les Présences
              </Button>
            )}
            {(user?.role === 'admin' || user?.role === 'promotions') && (
              <Button onClick={handleExport} data-testid="export-excel-button">
                <Download className="h-4 w-4 mr-2" />
                Exporter Excel
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Nouveaux Arrivants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-visitors">
                {stats?.total_visitors || 0}
              </div>
              <p className="text-xs text-muted-foreground">Nouveaux Arrivants actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bergers</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {user?.role === 'berger' || user?.role === 'referent' ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium text-gray-700">Saisir les responsables (max 5)</p>
                    <button
                      onClick={() => {
                        const modal = document.getElementById('team-members-modal');
                        if (modal) modal.showModal();
                      }}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      Gérer
                    </button>
                  </div>
                  <div className="text-sm space-y-1">
                    {user?.team_members && user.team_members.length > 0 ? (
                      user.team_members.map((member, idx) => (
                        <div key={idx} className="text-gray-700">
                          {idx + 1}. {member.firstname} {member.lastname}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic">Aucun responsable ajouté</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="total-referents">
                    {stats?.total_referents || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Membres de l'équipe</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canaux</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-channels">
                {stats?.by_channel?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Sources d'arrivée</p>
            </CardContent>
          </Card>
        </div>

        {/* KPIs Formations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              KPIs Formations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-blue-50">
                <p className="text-sm text-gray-600">Formation PCNC</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.formation_pcnc || 0}</p>
                <p className="text-xs text-gray-500 mt-1">personnes formées</p>
              </div>
              <div className="p-4 border rounded-lg bg-green-50">
                <p className="text-sm text-gray-600">Au Cœur de la Bible</p>
                <p className="text-3xl font-bold text-green-600">{stats?.formation_au_coeur_bible || 0}</p>
                <p className="text-xs text-gray-500 mt-1">personnes formées</p>
              </div>
              <div className="p-4 border rounded-lg bg-purple-50">
                <p className="text-sm text-gray-600">Formation STAR</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.formation_star || 0}</p>
                <p className="text-xs text-gray-500 mt-1">personnes devenues stars</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20"
                onClick={() => navigate('/visitors')}
                data-testid="quick-action-visitors"
              >
                <Users className="h-6 w-6 mr-2" />
                Voir les nouveaux arrivants et nouveaux convertiss
              </Button>
              {(user?.role === 'admin' || user?.role === 'promotions') && (
                <>
                  <Button 
                    variant="outline" 
                    className="h-20"
                    onClick={() => navigate('/referents')}
                    data-testid="quick-action-referents"
                  >
                    <UserPlus className="h-6 w-6 mr-2" />
                    Gérer les bergers
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20"
                    onClick={() => navigate('/analytics')}
                    data-testid="quick-action-analytics"
                  >
                    <BarChart3 className="h-6 w-6 mr-2" />
                    Voir les analytics
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity by Month */}
        {stats?.by_month && stats.by_month.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Nouveaux Arrivants par mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.by_month.slice(-6).reverse().map((item) => (
                  <div key={item._id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium">{item._id}</span>
                    <span className="text-gray-600">{item.count} nouveaux arrivants et nouveaux convertiss</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* By Type */}
        {stats?.by_type && stats.by_type.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Par type de nouveaux arrivants et nouveaux convertis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.by_type.map((item) => (
                  <div key={item._id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium">{item._id}</span>
                    <span className="text-gray-600">{item.count} nouveaux arrivants et nouveaux convertiss</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rename Promo Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier les informations de la promo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de la promo (optionnel)</Label>
                <Input
                  value={newPromoName}
                  onChange={(e) => setNewPromoName(e.target.value)}
                  placeholder="Ex: Bergerie Excellence, Bergerie de Novembre..."
                />
                <p className="text-xs text-gray-500">
                  Ce nom remplacera l'affichage du mois dans l'application
                </p>
              </div>

              <div className="space-y-2">
                <Label>Mois assignés (sélection multiple)</Label>
                <div className="border rounded-md p-3 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {generateMonths().map((month) => (
                      <label key={month.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <Checkbox
                          checked={selectedMonths.includes(month.value)}
                          onCheckedChange={() => toggleMonth(month.value)}
                        />
                        <span className="text-sm">{month.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {selectedMonths.length > 0
                    ? `${selectedMonths.length} mois sélectionné(s)`
                    : 'Aucun mois sélectionné'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleRenamePromo}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Team Members Modal */}
        <dialog id="team-members-modal" className="modal bg-black bg-opacity-50 fixed inset-0 z-50">
          <div className="modal-box bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto mt-20">
            <h3 className="font-bold text-lg mb-4">Gérer les Bergers</h3>
            <p className="text-sm text-gray-500 mb-4">Maximum 5 personnes</p>
            
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Prénom ${idx + 1}`}
                    className="input input-bordered w-full text-sm border rounded px-3 py-2"
                    id={`firstname-${idx}`}
                    defaultValue={user?.team_members?.[idx]?.firstname || ''}
                  />
                  <input
                    type="text"
                    placeholder={`Nom ${idx + 1}`}
                    className="input input-bordered w-full text-sm border rounded px-3 py-2"
                    id={`lastname-${idx}`}
                    defaultValue={user?.team_members?.[idx]?.lastname || ''}
                  />
                </div>
              ))}
            </div>

            <div className="modal-action mt-6 flex gap-2">
              <button
                className="btn btn-outline px-4 py-2 border rounded"
                onClick={() => document.getElementById('team-members-modal').close()}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={async () => {
                  const teamMembers = [];
                  for (let i = 0; i < 5; i++) {
                    const firstname = document.getElementById(`firstname-${i}`).value.trim();
                    const lastname = document.getElementById(`lastname-${i}`).value.trim();
                    if (firstname && lastname) {
                      teamMembers.push({ firstname, lastname });
                    }
                  }

                  try {
                    // Update user with team_members
                    console.log('Updating user:', user.id, 'with team_members:', teamMembers);
                    await updateUser(user.id, { team_members: teamMembers });
                    
                    // Mettre à jour le localStorage avec les nouvelles données
                    const updatedUser = { ...user, team_members: teamMembers };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    
                    toast.success('Équipe mise à jour avec succès');
                    document.getElementById('team-members-modal').close();
                    
                    // Reload to refresh user data
                    setTimeout(() => window.location.reload(), 500);
                  } catch (error) {
                    console.error('Error updating team members:', error);
                    toast.error(`Erreur: ${error.response?.data?.detail || error.message || 'Mise à jour échouée'}`);
                  }
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </dialog>
      </div>
    </Layout>
  );
};

export default DashboardPage;
