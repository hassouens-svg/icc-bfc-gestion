import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getVisitors, getUser, deleteVisitor, addPresence, updateVisitor, getReferentFidelisation } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Checkbox } from '../components/ui/checkbox';
import { Trash2, Filter, X, Pencil, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

const VisitorsTablePage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  
  // Edit presence modal state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [editPresence, setEditPresence] = useState(null); // true, false, or null
  const [editComment, setEditComment] = useState('');
  
  // Edit visitor info modal state
  const [editVisitorDialogOpen, setEditVisitorDialogOpen] = useState(false);
  const [visitorToEdit, setVisitorToEdit] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    date: '',
    presence: 'all', // present, absent, all
    category: 'all', // Nouveau Arrivant, Nouveau Converti, De Passage, all
    status: 'actif', // actif, arrete, all
    search: '',
    promo: 'all' // NEW: filter by promo
  });

  // Fidélisation state
  const [tauxFidelisation, setTauxFidelisation] = useState(0);
  const [uniquePromos, setUniquePromos] = useState([]);
  const [fidelisationData, setFidelisationData] = useState(null);
  const [loadingFidelisation, setLoadingFidelisation] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadVisitors();
    // Load fidelisation data for responsable_promo
    if (user.role === 'responsable_promo') {
      loadFidelisationData();
    }
  }, [user, navigate]);

  useEffect(() => {
    applyFilters();
  }, [visitors, filters]);

  const loadFidelisationData = async () => {
    try {
      setLoadingFidelisation(true);
      const data = await getReferentFidelisation();
      setFidelisationData(data);
    } catch (error) {
      console.error('Erreur lors du chargement des données de fidélisation:', error);
    } finally {
      setLoadingFidelisation(false);
    }
  };

  // Calculer le taux de fidélisation en fonction de la date sélectionnée
  const calculateFidelisationRate = () => {
    if (!fidelisationData) return 0;

    // Si une date est sélectionnée, calculer pour cette semaine uniquement
    if (filters.date) {
      const selectedDate = new Date(filters.date);
      const weekNumber = getWeekNumber(filters.date);
      
      const weekData = fidelisationData.weekly_rates?.find(w => w.week === weekNumber);
      return weekData ? weekData.rate : 0;
    }

    // Sinon, retourner la moyenne mensuelle globale
    return fidelisationData.monthly_average || 0;
  };

  // Obtenir les données du graphique filtrées par date
  const getChartData = () => {
    if (!fidelisationData || !fidelisationData.weekly_rates) return [];

    // Si une date est sélectionnée, ne montrer que cette semaine
    if (filters.date) {
      const weekNumber = getWeekNumber(filters.date);
      const weekData = fidelisationData.weekly_rates.find(w => w.week === weekNumber);
      return weekData ? [weekData] : [];
    }

    // Sinon, montrer toutes les 52 semaines
    return fidelisationData.weekly_rates;
  };

  const getWeekNumber = (dateStr) => {
    const date = new Date(dateStr);
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const loadVisitors = async () => {
    try {
      // Include stopped visitors if filter allows it
      const includeStopped = filters.status === 'arrete' || filters.status === 'all';
      const data = await getVisitors(includeStopped);
      setVisitors(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des nouveaux arrivants et nouveaux convertiss');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...visitors];

    // Extract unique months from assigned_month (show only month part, e.g., "11" from "2025-11")
    const uniqueMonths = [...new Set(visitors.map(v => {
      if (!v.assigned_month) return null;
      const parts = v.assigned_month.split('-');
      return parts.length === 2 ? parts[1] : null; // Extract month part only
    }).filter(Boolean))];
    setUniquePromos(uniqueMonths);

    // Filter by status
    if (filters.status === 'actif') {
      filtered = filtered.filter(v => !v.tracking_stopped);
    } else if (filters.status === 'arrete') {
      filtered = filtered.filter(v => v.tracking_stopped);
    }

    // Filter by promo (month only)
    if (filters.promo !== 'all') {
      filtered = filtered.filter(v => {
        if (!v.assigned_month) return false;
        const parts = v.assigned_month.split('-');
        const month = parts.length === 2 ? parts[1] : null;
        return month === filters.promo;
      });
    }

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(v => v.types.includes(filters.category));
    }

    // Filter by search (name)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(v => 
        v.firstname.toLowerCase().includes(searchLower) ||
        v.lastname.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date and presence
    if (filters.date) {
      filtered = filtered.map(v => {
        // Combiner toutes les présences
        const allPresences = [
          ...(v.presences_dimanche || []),
          ...(v.presences_jeudi || [])
        ];

        const presenceOnDate = allPresences.find(p => p.date === filters.date);
        
        if (filters.presence === 'present') {
          return presenceOnDate && presenceOnDate.present ? v : null;
        } else if (filters.presence === 'absent') {
          return presenceOnDate && presenceOnDate.present === false ? v : null;
        }
        return v;
      }).filter(v => v !== null);
    }

    setFilteredVisitors(filtered);
    calculateFidelisation(filtered);
  };

  const calculateFidelisation = (visitorsList) => {
    if (visitorsList.length === 0) {
      setTauxFidelisation(0);
      return;
    }

    let totalPresences = 0;
    let totalMembers = visitorsList.length;

    visitorsList.forEach(visitor => {
      const allPresences = [
        ...(visitor.presences_dimanche || []),
        ...(visitor.presences_jeudi || [])
      ];
      // Count only present (not absent)
      const presentCount = allPresences.filter(p => p.present === true).length;
      totalPresences += presentCount;
    });

    // Average presences per member
    const avgPresencesPerMember = totalMembers > 0 ? totalPresences / totalMembers : 0;
    // Assume 8 expected presences per month (2 per week * 4 weeks)
    const expectedPresences = 8;
    const taux = Math.round((avgPresencesPerMember / expectedPresences) * 100);
    
    setTauxFidelisation(Math.min(taux, 100)); // Cap at 100%
  };

  const handleDeleteVisitor = async () => {
    try {
      await deleteVisitor(selectedVisitor.id);
      toast.success('Visiteur supprimé avec succès');
      setDeleteDialogOpen(false);
      loadVisitors();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const resetFilters = () => {
    setFilters({
      date: '',
      presence: 'all',
      category: 'all',
      status: 'actif',
      search: '',
      promo: 'all'
    });
  };

  const getPresenceInfoForDate = (visitor, date) => {
    if (!date) return { present: null, absent: null, commentaire: '-' };
    
    // Combiner toutes les présences
    const allPresences = [
      ...(visitor.presences_dimanche || []),
      ...(visitor.presences_jeudi || [])
    ];
    
    const presence = allPresences.find(p => p.date === date);
    
    if (!presence) {
      return { present: null, absent: null, commentaire: '-' };
    }
    
    return {
      present: presence.present === true ? '✅' : null,
      absent: presence.present === false ? '❌' : null,
      commentaire: presence.commentaire || '-'
    };
  };

  const handleEditPresence = (visitor) => {
    const presenceInfo = getPresenceInfoForDate(visitor, filters.date);
    setEditingVisitor(visitor);
    
    // Déterminer la présence actuelle (true, false, ou null)
    if (presenceInfo.present === '✅') {
      setEditPresence(true);
    } else if (presenceInfo.absent === '❌') {
      setEditPresence(false);
    } else {
      setEditPresence(null);
    }
    
    setEditComment(presenceInfo.commentaire === '-' ? '' : presenceInfo.commentaire);
    setEditDialogOpen(true);
  };

  const handleEditVisitorInfo = (visitor) => {
    setVisitorToEdit({...visitor});
    setEditVisitorDialogOpen(true);
  };

  const handleSaveVisitorEdit = async () => {
    if (!visitorToEdit) return;

    try {
      const updateData = {
        firstname: visitorToEdit.firstname,
        lastname: visitorToEdit.lastname,
        phone: visitorToEdit.phone,
        email: visitorToEdit.email || null,
        city: visitorToEdit.city,
        type: visitorToEdit.type,
        formation_pcnc: visitorToEdit.formation_pcnc || false,
        formation_au_coeur_bible: visitorToEdit.formation_au_coeur_bible || false,
        formation_star: visitorToEdit.formation_star || false
      };

      await updateVisitor(visitorToEdit.id, updateData);
      toast.success('Informations mises à jour avec succès');
      setEditVisitorDialogOpen(false);
      loadVisitors();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleSavePresenceEdit = async () => {
    if (!editingVisitor || !filters.date) {
      toast.error('Erreur: Aucune date sélectionnée');
      return;
    }

    if (editPresence === null) {
      toast.error('Veuillez sélectionner Présent ou Absent');
      return;
    }

    try {
      await addPresence(
        editingVisitor.id,
        filters.date,
        editPresence,
        'dimanche',
        editComment || null
      );
      
      toast.success('Présence mise à jour avec succès');
      setEditDialogOpen(false);
      loadVisitors();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
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
            <h2 className="text-3xl font-bold text-gray-900">Nouveaux Arrivants - Vue Tableau</h2>
            <p className="text-gray-500 mt-1">
              {filteredVisitors.length} nouveaux arrivants et nouveaux convertis(s) 
              {user.role === 'referent' && ` - Mois: ${user.assigned_month}`}
            </p>
          </div>
        </div>

        {/* KPI Fidélisation - Only for responsable_promo */}
        {user.role === 'responsable_promo' && (
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Taux de Fidélisation</p>
                  <h3 className="text-4xl font-bold mt-2">
                    {loadingFidelisation ? '...' : `${calculateFidelisationRate().toFixed(1)}%`}
                  </h3>
                  <p className="text-green-100 text-sm mt-1">
                    {filters.date 
                      ? `Semaine du ${filters.date}` 
                      : 'Moyenne globale (toutes les semaines)'
                    }
                  </p>
                  <p className="text-green-50 text-xs mt-1">
                    Calcul pondéré: Dimanche x2, Jeudi x1
                  </p>
                </div>
                <div className="text-6xl opacity-20">
                  <TrendingUp className="h-16 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filtres
              </CardTitle>
              <Button onClick={resetFilters} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label>Recherche</Label>
                <Input
                  placeholder="Nom..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>

              {/* Promo Filter */}
              <div className="space-y-2">
                <Label>Promotion</Label>
                <Select value={filters.promo} onValueChange={(value) => setFilters({...filters, promo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les promos</SelectItem>
                    {uniquePromos.map(promo => (
                      <SelectItem key={promo} value={promo}>
                        {promo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actifs</SelectItem>
                    <SelectItem value="arrete">Arrêtés</SelectItem>
                    <SelectItem value="all">Tous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="Nouveau Arrivant">Nouveau Arrivant</SelectItem>
                    <SelectItem value="Nouveau Converti">Nouveau Converti</SelectItem>
                    <SelectItem value="De Passage">De Passage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                />
              </div>

              {/* Presence */}
              <div className="space-y-2">
                <Label>Présence</Label>
                <Select value={filters.presence} onValueChange={(value) => setFilters({...filters, presence: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="present">Présents</SelectItem>
                    <SelectItem value="absent">Absents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prénom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Canal d'arrivée</th>
                    {filters.date && (
                      <>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Présent</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absent</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commentaire</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVisitors.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                        Aucun nouveaux arrivants et nouveaux convertis trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredVisitors.map((visitor) => {
                      const presenceInfo = getPresenceInfoForDate(visitor, filters.date);
                      return (
                        <tr key={visitor.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                              {visitor.assigned_month || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{visitor.lastname}</td>
                          <td className="px-4 py-3 text-sm">{visitor.firstname}</td>
                          <td className="px-4 py-3 text-sm">
                            {visitor.types.join(', ')}
                          </td>
                          <td className="px-4 py-3 text-sm">{visitor.arrival_channel}</td>
                          {filters.date && (
                            <>
                              <td className="px-4 py-3 text-center text-lg">
                                {presenceInfo.present || '-'}
                              </td>
                              <td className="px-4 py-3 text-center text-lg">
                                {presenceInfo.absent || '-'}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 text-sm">
                            {presenceInfo.commentaire}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center space-x-2">
                              <Button
                                onClick={() => navigate(`/visitors/${visitor.id}`)}
                                variant="outline"
                                size="sm"
                              >
                                Voir
                              </Button>
                              {['promotions', 'accueil', 'admin', 'super_admin'].includes(user.role) && (
                                <Button
                                  onClick={() => handleEditVisitorInfo(visitor)}
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  title="Modifier les informations"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {filters.date && (
                                <Button
                                  onClick={() => handleEditPresence(visitor)}
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                  title="Modifier la présence"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {['super_admin', 'responsable_eglise', 'admin', 'referent'].includes(user.role) && (
                                <Button
                                  onClick={() => {
                                    setSelectedVisitor(visitor);
                                    setDeleteDialogOpen(true);
                                  }}
                                  variant="destructive"
                                  size="sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Fidelisation Chart - Only for responsable_promo */}
        {user.role === 'responsable_promo' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                {filters.date 
                  ? `Fidélisation - Semaine du ${filters.date}` 
                  : 'Taux de Fidélisation par Semaine (52 semaines)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingFidelisation ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-gray-500">Chargement des données de fidélisation...</div>
                </div>
              ) : fidelisationData && fidelisationData.weekly_rates && fidelisationData.weekly_rates.length > 0 ? (
                <div>
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Visiteurs</p>
                      <p className="text-2xl font-bold text-blue-600">{fidelisationData.total_visitors}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Visiteurs Actifs</p>
                      <p className="text-2xl font-bold text-green-600">{fidelisationData.total_visitors_actifs}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Nouveaux Arrivants</p>
                      <p className="text-2xl font-bold text-purple-600">{fidelisationData.total_na}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Nouveaux Convertis</p>
                      <p className="text-2xl font-bold text-orange-600">{fidelisationData.total_nc}</p>
                    </div>
                  </div>
                  <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="week" 
                          label={{ value: 'Semaine', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          label={{ value: 'Taux de Fidélisation (%)', angle: -90, position: 'insideLeft' }}
                          domain={[0, 100]}
                        />
                        <Tooltip 
                          formatter={(value) => `${value}%`}
                          labelFormatter={(label) => `Semaine ${label}`}
                        />
                        <Legend />
                        <Bar 
                          dataKey="rate" 
                          fill="#4f46e5"
                          name="Taux de Fidélisation"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 text-center">
                    {!filters.date && (
                      <p className="text-sm text-gray-600">
                        Moyenne globale: <span className="font-bold text-indigo-600 text-lg">{fidelisationData.monthly_average}%</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {getChartData().length === 1 
                        ? `1 semaine affichée` 
                        : `${getChartData().length} semaines affichées`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <div className="text-gray-500">Aucune donnée de fidélisation disponible</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Presence Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la présence</DialogTitle>
            </DialogHeader>
            {editingVisitor && (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{editingVisitor.firstname} {editingVisitor.lastname}</p>
                  <p className="text-sm text-gray-500">Date: {filters.date}</p>
                </div>

                <div className="space-y-3">
                  <Label>Présence</Label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setEditPresence(true)}
                      className={`px-4 py-2 rounded border-2 flex items-center space-x-2 transition-colors ${
                        editPresence === true
                          ? 'bg-green-500 border-green-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
                      }`}
                    >
                      <span className="text-lg">✓</span>
                      <span>Présent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPresence(false)}
                      className={`px-4 py-2 rounded border-2 flex items-center space-x-2 transition-colors ${
                        editPresence === false
                          ? 'bg-red-500 border-red-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-red-400'
                      }`}
                    >
                      <span className="text-lg">✗</span>
                      <span>Absent</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Commentaire</Label>
                  <Textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSavePresenceEdit} className="bg-indigo-600 hover:bg-indigo-700">
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer {selectedVisitor?.firstname} {selectedVisitor?.lastname} ?
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteVisitor} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Visitor Info Dialog */}
        <Dialog open={editVisitorDialogOpen} onOpenChange={setEditVisitorDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier les informations du visiteur</DialogTitle>
            </DialogHeader>
            {visitorToEdit && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom *</Label>
                    <Input
                      value={visitorToEdit.lastname}
                      onChange={(e) => setVisitorToEdit({...visitorToEdit, lastname: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prénom *</Label>
                    <Input
                      value={visitorToEdit.firstname}
                      onChange={(e) => setVisitorToEdit({...visitorToEdit, firstname: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Téléphone *</Label>
                  <Input
                    value={visitorToEdit.phone}
                    onChange={(e) => setVisitorToEdit({...visitorToEdit, phone: e.target.value})}
                    placeholder="+33..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email (optionnel)</Label>
                  <Input
                    type="email"
                    value={visitorToEdit.email || ''}
                    onChange={(e) => setVisitorToEdit({...visitorToEdit, email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ville *</Label>
                  <Input
                    value={visitorToEdit.city}
                    onChange={(e) => setVisitorToEdit({...visitorToEdit, city: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type de visiteur *</Label>
                  <Select 
                    value={visitorToEdit.type} 
                    onValueChange={(value) => setVisitorToEdit({...visitorToEdit, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nouveau Arrivant">Nouveau Arrivant</SelectItem>
                      <SelectItem value="Nouveau Converti">Nouveau Converti</SelectItem>
                      <SelectItem value="De Passage">De Passage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label>Formations complétées</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="formation_pcnc"
                      checked={visitorToEdit.formation_pcnc || false}
                      onCheckedChange={(checked) => setVisitorToEdit({...visitorToEdit, formation_pcnc: checked})}
                    />
                    <label htmlFor="formation_pcnc" className="text-sm cursor-pointer">
                      Formation PCNC
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="formation_au_coeur_bible"
                      checked={visitorToEdit.formation_au_coeur_bible || false}
                      onCheckedChange={(checked) => setVisitorToEdit({...visitorToEdit, formation_au_coeur_bible: checked})}
                    />
                    <label htmlFor="formation_au_coeur_bible" className="text-sm cursor-pointer">
                      Formation Au Cœur de la Bible
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="formation_star"
                      checked={visitorToEdit.formation_star || false}
                      onCheckedChange={(checked) => setVisitorToEdit({...visitorToEdit, formation_star: checked})}
                    />
                    <label htmlFor="formation_star" className="text-sm cursor-pointer">
                      Formation STAR
                    </label>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditVisitorDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveVisitorEdit}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default VisitorsTablePage;
