import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  getPromotionsDetailed, 
  getVisitorsTable, 
  getFIDetailed, 
  getMembresTable,
  getPresencesDimanche,
  getCulteStatsSummary,
  getCities,
  getUser,
  getFamillesImpact,
  getMembresFI,
  getPresencesFI,
  getAgeDistribution,
  getArrivalChannelDistribution
} from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Users, 
  MapPin, 
  TrendingUp, 
  Percent, 
  BarChart3, 
  UserPlus, 
  Building2,
  Heart,
  Calendar,
  Filter,
  Download,
  UserCheck,
  UserX
} from 'lucide-react';
import { toast } from 'sonner';
import DepartmentAlert from '../components/DepartmentAlert';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const DashboardSuperAdminCompletPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  
  // Check permissions - Pasteur a les mêmes droits que Super Admin
  const canEdit = ['super_admin', 'pasteur', 'responsable_eglise'].includes(user?.role);
  const isReadOnly = false; // Pasteur n'est plus en lecture seule
  const isResponsableEglise = user?.role === 'responsable_eglise';
  
  // Fonction Export CSV
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(key => {
        const value = row[key];
        // Échapper les virgules et guillemets
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export réussi !');
  };
  
  const [selectedView, setSelectedView] = useState('promotions'); // 'promotions' or 'fi' or 'presences' or 'cultes'
  const [selectedPromoFilter, setSelectedPromoFilter] = useState('all'); // Filter for "Fidélisation par Promo" table
  const [selectedCity, setSelectedCity] = useState(() => {
    // Pour responsable_eglise, forcer sa ville
    if (user?.role === 'responsable_eglise') {
      return user.city;
    }
    // Récupérer la ville sélectionnée depuis localStorage
    const savedCity = localStorage.getItem('selected_city_view');
    return savedCity || 'all';
  });
  const [selectedMonth, setSelectedMonth] = useState('all'); // Filtre Mois (1-12)
  const [selectedYear, setSelectedYear] = useState('all'); // Filtre Année (2024-2030)
  const [selectedPromo, setSelectedPromo] = useState('all'); // Filtre Promo pour tableau visiteurs
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [cities, setCities] = useState([]);
  const [ageDistribution, setAgeDistribution] = useState([]);
  const [arrivalChannelDist, setArrivalChannelDist] = useState([]);
  const [promosData, setPromosData] = useState(null);
  const [visitorsTable, setVisitorsTable] = useState([]);
  const [fiData, setFiData] = useState(null);
  const [membresTable, setMembresTable] = useState([]);
  const [presencesDimancheData, setPresencesDimancheData] = useState(null);
  const [culteStatsData, setCulteStatsData] = useState(null);
  
  // Filters for tables
  const [visitorsFilter, setVisitorsFilter] = useState('');
  const [membresFilter, setMembresFilter] = useState('');
  
  // Filters for presences dimanche
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // KPIs FI par date
  const [selectedDateFI, setSelectedDateFI] = useState('');
  const [kpisFI, setKpisFI] = useState(null);
  
  // Filters for culte stats
  const [culteTypeFilter, setCulteTypeFilter] = useState('all');
  const [fideleTypeFilter, setFideleTypeFilter] = useState('all');
  
  // Use refs to prevent race conditions
  const abortControllerRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const citiesLoadedRef = useRef(false);

  // Load cities once on mount
  useEffect(() => {
    const loadCities = async () => {
      if (citiesLoadedRef.current) return;
      try {
        const citiesData = await getCities();
        setCities(citiesData);
        citiesLoadedRef.current = true;
      } catch (error) {
        console.error('Error loading cities:', error);
        toast.error('Erreur lors du chargement des villes');
      }
    };
    loadCities();
  }, []);

  const loadData = useCallback(async () => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear any pending loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    
    try {
      if (selectedView === 'promotions') {
        await loadPromotionsData();
      } else if (selectedView === 'fi') {
        await loadFIData();
      } else if (selectedView === 'presences') {
        await loadPresencesDimancheData();
      } else if (selectedView === 'cultes') {
        await loadCulteStatsData();
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
        return;
      }
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      // Use timeout to prevent rapid loading state changes
      loadingTimeoutRef.current = setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  }, [selectedView, selectedCity, selectedMonth, selectedYear]);

  useEffect(() => {
    if (!user || !['super_admin', 'pasteur', 'responsable_eglise'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    
    loadData();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [user, navigate, loadData]);

  const loadPromotionsData = async () => {
    try {
      // Pass filters directly to backend
      const cityFilter = selectedCity !== 'all' ? selectedCity : null;
      const monthFilter = selectedMonth !== 'all' ? selectedMonth : null;
      const yearFilter = selectedYear !== 'all' ? selectedYear : null;
      
      // Load all data with proper error handling for each
      const results = await Promise.allSettled([
        getAgeDistribution(cityFilter),
        getArrivalChannelDistribution(cityFilter),
        getPromotionsDetailed(cityFilter, monthFilter, yearFilter),
        getVisitorsTable(cityFilter)
      ]);
      
      // Process results
      if (results[0].status === 'fulfilled') {
        setAgeDistribution(results[0].value || []);
      } else {
        console.error('Error loading age distribution:', results[0].reason);
        setAgeDistribution([]);
      }
      
      if (results[1].status === 'fulfilled') {
        setArrivalChannelDist(results[1].value || []);
      } else {
        console.error('Error loading arrival channel:', results[1].reason);
        setArrivalChannelDist([]);
      }
      
      if (results[2].status === 'fulfilled') {
        setPromosData(results[2].value);
      } else {
        console.error('Error loading promos:', results[2].reason);
        setPromosData(null);
      }
      
      if (results[3].status === 'fulfilled') {
        let filteredVisitors = results[3].value || [];
        
        // Filtrer les visiteurs par mois/année si sélectionnés côté frontend (pour le tableau)
        if (selectedMonth !== 'all' || selectedYear !== 'all') {
          filteredVisitors = filteredVisitors.filter(v => {
            const assignedMonth = v.assigned_month; // Format: "2025-01"
            if (!assignedMonth) return false;
            
            const [year, month] = assignedMonth.split('-');
            
            const monthMatch = selectedMonth === 'all' || month === selectedMonth;
            const yearMatch = selectedYear === 'all' || year === selectedYear;
            
            return monthMatch && yearMatch;
          });
        }
        
        setVisitorsTable(filteredVisitors);
      } else {
        console.error('Error loading visitors:', results[3].reason);
        setVisitorsTable([]);
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
      // Set default empty values to prevent undefined errors
      setAgeDistribution([]);
      setArrivalChannelDist([]);
      setPromosData(null);
      setVisitorsTable([]);
    }
  };

  const loadFIData = async () => {
    try {
      // Filtrer par ville si une ville spécifique est sélectionnée
      const cityFilter = selectedCity !== 'all' ? selectedCity : null;
      
      const [fi, membres] = await Promise.all([
        getFIDetailed(cityFilter),
        getMembresTable(cityFilter)
      ]);
      
      setFiData(fi);
      setMembresTable(membres);
    } catch (error) {
      console.error('Error loading FI:', error);
    }
  };

  const loadPresencesDimancheData = async () => {
    try {
      // Filtrer par ville si une ville spécifique est sélectionnée
      const cityFilter = selectedCity !== 'all' ? selectedCity : null;
      const data = await getPresencesDimanche(
        startDate || null, 
        endDate || null, 
        selectedCity !== 'all' ? selectedCity : null
      );
      setPresencesDimancheData(data);
    } catch (error) {
      console.error('Error loading presences dimanche:', error);
    }
  };

  const loadCulteStatsData = async () => {
    try {
      const data = await getCulteStatsSummary(
        selectedCity !== 'all' ? selectedCity : null,
        startDate || null,
        endDate || null
      );
      setCulteStatsData(data || { summary: [], global_stats: { total_dimanches: 0, avg_fideles_per_dimanche: 0, avg_stars_per_dimanche: 0, avg_total_per_dimanche: 0 } });
    } catch (error) {
      console.error('Error loading culte stats:', error);
      setCulteStatsData({ summary: [], global_stats: { total_dimanches: 0, avg_fideles_per_dimanche: 0, avg_stars_per_dimanche: 0, avg_total_per_dimanche: 0 } });
    }
  };

  const loadFIKPIsByDate = async (date) => {
    try {
      const ville = selectedCity !== 'all' ? selectedCity : null;
      
      // Charger toutes les FIs de la ville
      const fisData = await getFamillesImpact(ville);
      
      let allMembres = [];
      let allPresences = [];

      for (const fi of fisData) {
        try {
          const membres = await getMembresFI(fi.id);
          const presences = await getPresencesFI(fi.id, date);
          
          allMembres = [...allMembres, ...membres];
          allPresences = [...allPresences, ...presences];
        } catch (error) {
          console.error(`Erreur chargement FI ${fi.name}:`, error);
        }
      }

      const totalMembres = allMembres.length;
      const presents = allPresences.filter(p => p.present === true).length;
      const absents = allPresences.filter(p => p.present === false).length;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const nouveaux = allMembres.filter(m => {
        const dateAjout = new Date(m.date_ajout);
        return dateAjout >= sevenDaysAgo;
      }).length;

      const tauxFidelisation = totalMembres > 0 ? (presents / totalMembres) * 100 : 0;

      setKpisFI({
        totalMembres,
        presents,
        absents,
        nouveaux,
        tauxFidelisation: tauxFidelisation.toFixed(1)
      });

    } catch (error) {
      console.error('Erreur calcul KPIs FI:', error);
    }
  };

  // Filter data by city
  const filterByCity = (data, cityField = 'city') => {
    if (selectedCity === 'all') return data;
    return data.filter(item => item[cityField] === selectedCity);
  };

  // Filter visitors table
  const filteredVisitors = visitorsTable.filter(v => {
    if (selectedCity !== 'all' && v.city !== selectedCity) return false;
    if (selectedPromo !== 'all' && v.assigned_month !== selectedPromo) return false;
    if (!visitorsFilter) return true;
    
    const searchLower = visitorsFilter.toLowerCase();
    return (
      v.firstname?.toLowerCase().includes(searchLower) ||
      v.lastname?.toLowerCase().includes(searchLower) ||
      v.email?.toLowerCase().includes(searchLower) ||
      v.phone?.includes(searchLower) ||
      v.assigned_fi?.toLowerCase().includes(searchLower)
    );
  });

  // Filter membres table
  const filteredMembres = membresTable.filter(m => {
    if (selectedCity !== 'all' && m.ville !== selectedCity) return false;
    if (!membresFilter) return true;
    
    const searchLower = membresFilter.toLowerCase();
    return (
      m.firstname?.toLowerCase().includes(searchLower) ||
      m.lastname?.toLowerCase().includes(searchLower) ||
      m.fi_nom?.toLowerCase().includes(searchLower) ||
      m.secteur_nom?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600">Chargement du dashboard...</p>
          <p className="text-sm text-gray-400">Préparation des données</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {user?.role === 'super_admin' 
                ? 'Tableau de Bord - Super Administrateur' 
                : user?.role === 'responsable_eglise'
                ? 'Tableau de bord Responsable d\'église'
                : 'Tableau de Bord - Pasteur'}
            </h2>
            <p className="text-gray-500 mt-1">
              {user?.role === 'super_admin' 
                ? 'Gestion complète multi-villes' 
                : user?.role === 'responsable_eglise'
                ? `Gestion complète de ${selectedCity}`
                : 'Gestion complète multi-villes'}
            </p>
          </div>
          
          {canEdit && (
            <div className="flex space-x-2">
              {/* Gérer Villes - Pour Super Admin et Pasteur */}
              {['super_admin', 'pasteur'].includes(user?.role) && (
                <Button onClick={() => navigate('/cities')} variant="outline">
                  <MapPin className="h-4 w-4 mr-2" />
                  Gérer Villes
                </Button>
              )}
              <Button onClick={() => navigate('/gestion-acces')} variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Gérer Accès
              </Button>
              {/* Gérer Permissions Dashboard - Pour Super Admin et Pasteur */}
              {['super_admin', 'pasteur'].includes(user?.role) && (
                <Button 
                  onClick={() => navigate('/gestion-permissions-dashboard')} 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  🔐 Gérer les Permissions Dashboard
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vue</label>
                <Select value={selectedView} onValueChange={setSelectedView}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotions">Promotions</SelectItem>
                    <SelectItem value="fi">Familles d'Impact</SelectItem>
                    <SelectItem value="evangelisation">Évangélisation</SelectItem>
                    <SelectItem value="cultes">Statistiques des Cultes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ville</label>
                {isResponsableEglise ? (
                  <div className="px-3 py-2 border rounded-md bg-gray-50">
                    <p className="text-sm font-medium text-gray-700">{selectedCity}</p>
                    <p className="text-xs text-gray-500">Votre ville assignée</p>
                  </div>
                ) : (
                  <Select 
                    value={selectedCity} 
                    onValueChange={setSelectedCity}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les villes</SelectItem>
                      {[...cities]
                        .sort((a, b) => {
                          const nameA = a?.name || '';
                          const nameB = b?.name || '';
                          return nameA.localeCompare(nameB);
                        })
                        .map((city) => (
                          <SelectItem key={city.id} value={city.name}>
                            {city.name} ({city.country || 'France'})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mois</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les mois</SelectItem>
                    <SelectItem value="01">Janvier</SelectItem>
                    <SelectItem value="02">Février</SelectItem>
                    <SelectItem value="03">Mars</SelectItem>
                    <SelectItem value="04">Avril</SelectItem>
                    <SelectItem value="05">Mai</SelectItem>
                    <SelectItem value="06">Juin</SelectItem>
                    <SelectItem value="07">Juillet</SelectItem>
                    <SelectItem value="08">Août</SelectItem>
                    <SelectItem value="09">Septembre</SelectItem>
                    <SelectItem value="10">Octobre</SelectItem>
                    <SelectItem value="11">Novembre</SelectItem>
                    <SelectItem value="12">Décembre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Année</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les années</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                    <SelectItem value="2028">2028</SelectItem>
                    <SelectItem value="2029">2029</SelectItem>
                    <SelectItem value="2030">2030</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PROMOTIONS VIEW */}
        {selectedView === 'promotions' && promosData && (
          <>
            <DepartmentAlert view="Promotions" />
            {/* Global KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Promos</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{promosData.summary.total_promos}</div>
                  <p className="text-xs text-muted-foreground">Mois de suivi</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Personnes Reçues</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{promosData.summary.total_visitors}</div>
                  <p className="text-xs text-muted-foreground">Tous types confondus</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nouveaux Arrivants</CardTitle>
                  <UserPlus className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{promosData.summary.total_na}</div>
                  <p className="text-xs text-muted-foreground">NA</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nouveaux Convertis</CardTitle>
                  <Heart className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{promosData.summary.total_nc}</div>
                  <p className="text-xs text-muted-foreground">NC</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fidélisation Moyenne</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">
                    {promosData.summary.avg_fidelisation}%
                  </div>
                  <p className="text-xs text-muted-foreground">Toutes promos</p>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Répartition NA / NC / DP */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition NA / NC / DP</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Nouveaux Arrivants', value: promosData.summary.total_na, color: '#10b981' },
                          { name: 'Nouveaux Convertis', value: promosData.summary.total_nc, color: '#ef4444' },
                          { name: 'De Passage', value: promosData.summary.total_dp || 0, color: '#f59e0b' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Canal d'arrivée */}
              <Card>
                <CardHeader>
                  <CardTitle>Canal d'Arrivée</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={arrivalChannelDist}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#6366f1" />
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#ec4899" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Répartition par tranche d'âge */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par Tranche d'Âge</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={ageDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#6366f1" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Fidélisation par Promo - NOUVEAU FORMAT */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Fidélisation par Promo (Mois)</CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="promo-filter" className="text-sm">Filtre Promo:</Label>
                  <Select value={selectedPromoFilter} onValueChange={setSelectedPromoFilter}>
                    <SelectTrigger id="promo-filter" className="w-[200px]">
                      <SelectValue placeholder="Toutes les promos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les promos</SelectItem>
                      {promosData.promos.map((promo, index) => (
                        <SelectItem key={index} value={promo.month}>{promo.month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Promo</th>
                        <th className="text-center py-3 px-4">Nbre de pers suivis</th>
                        <th className="text-center py-3 px-4">NA</th>
                        <th className="text-center py-3 px-4">NC</th>
                        <th className="text-center py-3 px-4">Nbre de suivis arrêtés</th>
                        <th className="text-center py-3 px-4">Présences dimanche</th>
                        <th className="text-center py-3 px-4">Présence jeudi</th>
                        <th className="text-center py-3 px-4">Fidélisation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promosData.promos
                        .filter(promo => selectedPromoFilter === 'all' || promo.month === selectedPromoFilter)
                        .map((promo, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{promo.month}</td>
                          <td className="text-center py-3 px-4">{promo.nbre_pers_suivis}</td>
                          <td className="text-center py-3 px-4 text-green-600">{promo.na_count}</td>
                          <td className="text-center py-3 px-4 text-red-600">{promo.nc_count}</td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <span>{promo.suivis_arretes_count}</span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // Sauvegarder le filtre promo pour StoppedVisitorsPage
                                  localStorage.setItem('stopped_visitors_filter_promo', promo.month);
                                  navigate('/stopped-visitors');
                                }}
                              >
                                Voir
                              </Button>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            {promo.total_presences_dimanche} / {promo.expected_presences_dimanche}
                          </td>
                          <td className="text-center py-3 px-4">
                            {promo.total_presences_jeudi} / {promo.expected_presences_jeudi}
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`font-bold ${promo.fidelisation >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                              {promo.fidelisation}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* NOUVEAU: Détail des personnes reçues par jour - TOUJOURS AFFICHÉ */}
            {promosData.daily_details && (
              <Card>
                <CardHeader>
                  <CardTitle>Personnes Reçues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Date</th>
                          <th className="text-center py-3 px-4">Nombre total de personnes reçues</th>
                          <th className="text-center py-3 px-4">Nbre de "de passage"</th>
                          <th className="text-center py-3 px-4">Nbre de résident</th>
                          <th className="text-center py-3 px-4">Nbre de NA</th>
                          <th className="text-center py-3 px-4">Nbre de NC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {promosData.daily_details.length > 0 ? (
                          promosData.daily_details.map((day, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{day.date}</td>
                              <td className="text-center py-3 px-4 font-medium">{day.total_personnes_recues}</td>
                              <td className="text-center py-3 px-4 text-orange-600">{day.nbre_de_passage}</td>
                              <td className="text-center py-3 px-4 text-blue-600">{day.nbre_residents}</td>
                              <td className="text-center py-3 px-4 text-green-600">{day.nbre_na}</td>
                              <td className="text-center py-3 px-4 text-red-600">{day.nbre_nc}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center py-8 text-gray-500">
                              Aucune donnée disponible. Sélectionnez une ville et/ou une période.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Évolution Fidélisation */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution de la Fidélisation par Promos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={promosData.promos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" label={{ value: 'Promos', position: 'insideBottom', offset: -5 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="fidelisation" stroke="#6366f1" strokeWidth={2} name="Fidélisation (%)" />
                    <Line type="monotone" dataKey="total_visitors" stroke="#10b981" strokeWidth={2} name="Visiteurs" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tableau Visiteurs Complet */}
            <Card>
              <CardHeader>
                <div className="flex flex-row items-center justify-between mb-4">
                  <CardTitle>Tous les Visiteurs - Vue Tableau Complète</CardTitle>
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => exportToCSV(filteredVisitors, 'visiteurs')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="border rounded px-3 py-1 text-sm"
                    value={visitorsFilter}
                    onChange={(e) => setVisitorsFilter(e.target.value)}
                  />
                  <Select value={selectedPromo} onValueChange={setSelectedPromo}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrer par Promo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les Promos</SelectItem>
                      {promosData?.promos?.map((promo) => (
                        <SelectItem key={promo.month} value={promo.month}>
                          {promo.month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Nom</th>
                        <th className="text-left py-2 px-2">Ville</th>
                        <th className="text-left py-2 px-2">Types</th>
                        <th className="text-left py-2 px-2">Téléphone</th>
                        <th className="text-left py-2 px-2">Email</th>
                        <th className="text-center py-2 px-2">Mois</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVisitors.map((visitor) => (
                        <tr key={visitor.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">{visitor.firstname} {visitor.lastname}</td>
                          <td className="py-2 px-2">{visitor.city}</td>
                          <td className="py-2 px-2">
                            <span className="text-xs">
                              {visitor.types?.includes('Nouveau Arrivant') && <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded mr-1">NA</span>}
                              {visitor.types?.includes('Nouveau Converti') && <span className="bg-red-100 text-red-800 px-1 py-0.5 rounded mr-1">NC</span>}
                              {visitor.types?.includes('De Passage') && <span className="bg-orange-100 text-orange-800 px-1 py-0.5 rounded">DP</span>}
                            </span>
                          </td>
                          <td className="py-2 px-2">{visitor.phone}</td>
                          <td className="py-2 px-2 text-xs">{visitor.email || '-'}</td>
                          <td className="text-center py-2 px-2">{visitor.assigned_month}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {filteredVisitors.length} visiteurs affichés
                </p>
              </CardContent>
            </Card>

            {/* Actions Rapides Promotions */}
            {canEdit && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button onClick={() => navigate('/visitors')} variant="outline" className="h-20">
                  <div className="text-center">
                    <Users className="h-6 w-6 mx-auto mb-2" />
                    <p>Gérer Visiteurs</p>
                  </div>
                </Button>
                <Button onClick={() => navigate('/referents')} variant="outline" className="h-20">
                  <div className="text-center">
                    <UserPlus className="h-6 w-6 mx-auto mb-2" />
                    <p>Gérer Responsables</p>
                  </div>
                </Button>
                <Button onClick={() => navigate('/analytics')} variant="outline" className="h-20">
                  <div className="text-center">
                    <BarChart3 className="h-6 w-6 mx-auto mb-2" />
                    <p>Analytics Détaillés</p>
                  </div>
                </Button>
                <Button onClick={() => navigate('/fidelisation')} variant="outline" className="h-20">
                  <div className="text-center">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                    <p>Fidélisation</p>
                  </div>
                </Button>
              </div>
            )}
          </>
        )}

        {/* FAMILLES D'IMPACT VIEW */}
        {selectedView === 'fi' && fiData && (
          <>
            <DepartmentAlert view="Familles d'Impact" />
            {/* Global KPIs FI */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Secteurs</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{fiData.summary.total_secteurs}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Familles d'Impact</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{fiData.summary.total_fi}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Membres</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{fiData.summary.total_membres}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fidélisation Moyenne FI</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">
                    {fiData.summary.avg_fidelisation}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section KPIs FI par date */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Analyse des Présences FI par Date</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label>Sélectionner une date</Label>
                    <Input
                      type="date"
                      value={selectedDateFI || ''}
                      onChange={(e) => {
                        setSelectedDateFI(e.target.value);
                        if (e.target.value) loadFIKPIsByDate(e.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Note</Label>
                    <p className="text-sm text-gray-600">
                      Sélectionnez une date pour voir les KPIs de présences de toutes les FI de la ville
                    </p>
                  </div>
                </div>

                {selectedDateFI && kpisFI && (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                          <Users className="h-6 w-6 text-blue-600" />
                          <div>
                            <p className="text-xs text-gray-600">Total Membres</p>
                            <p className="text-xl font-bold text-blue-600">{kpisFI.totalMembres}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-600">Présents</p>
                            <p className="text-xl font-bold text-green-600">{kpisFI.presents}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                          <UserX className="h-6 w-6 text-red-600" />
                          <div>
                            <p className="text-xs text-gray-600">Absents</p>
                            <p className="text-xl font-bold text-red-600">{kpisFI.absents}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                          <UserPlus className="h-6 w-6 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-600">Nouveaux (7j)</p>
                            <p className="text-xl font-bold text-purple-600">{kpisFI.nouveaux}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-6 w-6 text-indigo-600" />
                          <div>
                            <p className="text-xs text-gray-600">Fidélisation</p>
                            <p className="text-xl font-bold text-indigo-600">{kpisFI.tauxFidelisation}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* FI par Secteur */}
            <Card>
              <CardHeader>
                <CardTitle>FI par Secteur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Secteur</th>
                        <th className="text-left py-3 px-4">Ville</th>
                        <th className="text-center py-3 px-4">Nombre de FI</th>
                        <th className="text-center py-3 px-4">Nombre de Membres</th>
                        <th className="text-left py-3 px-4">Liste des FI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterByCity(fiData.secteurs, 'ville').map((secteur, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{secteur.secteur_nom}</td>
                          <td className="py-3 px-4">{secteur.ville}</td>
                          <td className="text-center py-3 px-4 font-bold text-indigo-600">{secteur.nombre_fi}</td>
                          <td className="text-center py-3 px-4 font-bold text-green-600">{secteur.nombre_membres}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {secteur.fi_list.map((fi) => (
                                <span key={fi.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {fi.nom}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Évolution FI par Secteur */}
            <Card>
              <CardHeader>
                <CardTitle>Nombre de FI par Secteur</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filterByCity(fiData.secteurs, 'ville')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="secteur_nom" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="nombre_fi" fill="#6366f1" name="Nombre de FI" />
                    <Bar dataKey="nombre_membres" fill="#10b981" name="Nombre de Membres" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Fidélisation par FI */}
            <Card>
              <CardHeader>
                <CardTitle>Fidélisation par Famille d'Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Famille d'Impact</th>
                        <th className="text-left py-3 px-4">Ville</th>
                        <th className="text-center py-3 px-4">Membres</th>
                        <th className="text-center py-3 px-4">Présences</th>
                        <th className="text-center py-3 px-4">Fidélisation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterByCity(fiData.fi_fidelisation, 'ville').map((fi, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{fi.fi_nom}</td>
                          <td className="py-3 px-4">{fi.ville}</td>
                          <td className="text-center py-3 px-4">{fi.total_membres}</td>
                          <td className="text-center py-3 px-4">{fi.total_presences}</td>
                          <td className="text-center py-3 px-4">
                            <span className={`font-bold ${fi.fidelisation >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                              {fi.fidelisation}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Tableau Membres Complet */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tous les Membres FI - Vue Tableau Complète</CardTitle>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="border rounded px-3 py-1 text-sm"
                    value={membresFilter}
                    onChange={(e) => setMembresFilter(e.target.value)}
                  />
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => exportToCSV(filteredMembres, 'membres_fi')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Nom</th>
                        <th className="text-left py-2 px-2">Téléphone</th>
                        <th className="text-left py-2 px-2">Ville</th>
                        <th className="text-left py-2 px-2">FI</th>
                        <th className="text-left py-2 px-2">Secteur</th>
                        <th className="text-center py-2 px-2">Présences</th>
                        <th className="text-left py-2 px-2">Date d'adhésion</th>
                        {canEdit && <th className="text-center py-2 px-2">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembres.map((membre) => (
                        <tr key={membre.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">{membre.prenom} {membre.nom}</td>
                          <td className="py-2 px-2">{membre.phone || '-'}</td>
                          <td className="py-2 px-2">{membre.ville}</td>
                          <td className="py-2 px-2 text-xs">{membre.fi_nom}</td>
                          <td className="py-2 px-2 text-xs">{membre.secteur_nom}</td>
                          <td className="text-center py-2 px-2 font-bold">{membre.presences_count}</td>
                          <td className="py-2 px-2 text-xs">{membre.date_joined}</td>
                          {canEdit && (
                            <td className="text-center py-2 px-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/fi/membres/${membre.id}`)}
                              >
                                Voir
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {filteredMembres.length} membres affichés
                </p>
              </CardContent>
            </Card>

            {/* Actions Rapides FI */}
            {canEdit && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button onClick={() => navigate('/familles-impact/secteurs')} variant="outline" className="h-20">
                  <div className="text-center">
                    <Building2 className="h-6 w-6 mx-auto mb-2" />
                    <p>Gérer Secteurs</p>
                  </div>
                </Button>
                <Button onClick={() => navigate('/familles-impact')} variant="outline" className="h-20">
                  <div className="text-center">
                    <Users className="h-6 w-6 mx-auto mb-2" />
                    <p>Gérer FI</p>
                  </div>
                </Button>
                <Button onClick={() => navigate('/familles-impact/affectation')} variant="outline" className="h-20">
                  <div className="text-center">
                    <UserPlus className="h-6 w-6 mx-auto mb-2" />
                    <p>Affecter Membres</p>
                  </div>
                </Button>
                <Button onClick={() => navigate('/familles-impact/dashboard-superviseur')} variant="outline" className="h-20">
                  <div className="text-center">
                    <BarChart3 className="h-6 w-6 mx-auto mb-2" />
                    <p>Stats FI</p>
                  </div>
                </Button>
              </div>
            )}
          </>
        )}

        {/* PRESENCES DIMANCHE VIEW - SUPPRIMÉE (pas pertinent) */}

        {/* CULTE STATISTICS VIEW */}
        {selectedView === 'cultes' && culteStatsData && (
          <>
            <DepartmentAlert view="Statistiques des Cultes" />
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Dimanches</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{culteStatsData.global_stats.total_dimanches}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Moy. Fidèles/Dimanche</CardTitle>
                  <Users className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">
                    {culteStatsData.global_stats.avg_fideles_per_dimanche}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Moy. STARS/Dimanche</CardTitle>
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {culteStatsData.global_stats.avg_stars_per_dimanche}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Moyen</CardTitle>
                  <BarChart3 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {culteStatsData.global_stats.avg_total_per_dimanche}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters for Charts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filtres pour Graphiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date début</label>
                    <input
                      type="date"
                      className="w-full border rounded px-3 py-2"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date fin</label>
                    <input
                      type="date"
                      className="w-full border rounded px-3 py-2"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={loadCulteStatsData} className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      Appliquer
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type de Culte</label>
                    <Select value={culteTypeFilter} onValueChange={setCulteTypeFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les cultes</SelectItem>
                        <SelectItem value="culte_1">Culte 1</SelectItem>
                        <SelectItem value="culte_2">Culte 2</SelectItem>
                        <SelectItem value="ejp">EJP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type de Fidèle</label>
                    <Select value={fideleTypeFilter} onValueChange={setFideleTypeFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous (Fidèles + STARS)</SelectItem>
                        <SelectItem value="fideles">Fidèles uniquement</SelectItem>
                        <SelectItem value="stars">STARS uniquement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evolution Chart with Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution - {fideleTypeFilter === 'all' ? 'Tous' : fideleTypeFilter === 'fideles' ? 'Fidèles' : 'STARS'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={culteStatsData.summary.slice(0, 20).reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    
                    {culteTypeFilter === 'all' && (
                      <>
                        {fideleTypeFilter !== 'stars' && (
                          <Line 
                            type="monotone" 
                            dataKey="total_fideles" 
                            stroke="#6366f1" 
                            strokeWidth={2} 
                            name="Fidèles" 
                          />
                        )}
                        {fideleTypeFilter !== 'fideles' && (
                          <Line 
                            type="monotone" 
                            dataKey="total_stars" 
                            stroke="#eab308" 
                            strokeWidth={2} 
                            name="STARS" 
                          />
                        )}
                        {fideleTypeFilter === 'all' && (
                          <Line 
                            type="monotone" 
                            dataKey="total_general" 
                            stroke="#10b981" 
                            strokeWidth={2} 
                            name="Total" 
                          />
                        )}
                      </>
                    )}
                    
                    {culteTypeFilter === 'culte_1' && (
                      <>
                        {fideleTypeFilter !== 'stars' && (
                          <Line 
                            type="monotone" 
                            dataKey="culte_1.fideles" 
                            stroke="#6366f1" 
                            strokeWidth={2} 
                            name="Culte 1 - Fidèles" 
                          />
                        )}
                        {fideleTypeFilter !== 'fideles' && (
                          <Line 
                            type="monotone" 
                            dataKey="culte_1.stars" 
                            stroke="#eab308" 
                            strokeWidth={2} 
                            name="Culte 1 - STARS" 
                          />
                        )}
                      </>
                    )}
                    
                    {culteTypeFilter === 'culte_2' && (
                      <>
                        {fideleTypeFilter !== 'stars' && (
                          <Line 
                            type="monotone" 
                            dataKey="culte_2.fideles" 
                            stroke="#a855f7" 
                            strokeWidth={2} 
                            name="Culte 2 - Fidèles" 
                          />
                        )}
                        {fideleTypeFilter !== 'fideles' && (
                          <Line 
                            type="monotone" 
                            dataKey="culte_2.stars" 
                            stroke="#eab308" 
                            strokeWidth={2} 
                            name="Culte 2 - STARS" 
                          />
                        )}
                      </>
                    )}
                    
                    {culteTypeFilter === 'ejp' && (
                      <>
                        {fideleTypeFilter !== 'stars' && (
                          <Line 
                            type="monotone" 
                            dataKey="ejp.fideles" 
                            stroke="#10b981" 
                            strokeWidth={2} 
                            name="EJP - Fidèles" 
                          />
                        )}
                        {fideleTypeFilter !== 'fideles' && (
                          <Line 
                            type="monotone" 
                            dataKey="ejp.stars" 
                            stroke="#eab308" 
                            strokeWidth={2} 
                            name="EJP - STARS" 
                          />
                        )}
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tableau Détaillé */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Statistiques Détaillées par Dimanche</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Ville</th>
                        <th className="text-center py-3 px-4">Culte 1 (F/S)</th>
                        <th className="text-center py-3 px-4">Culte 2 (F/S)</th>
                        <th className="text-center py-3 px-4">EJP (F/S)</th>
                        <th className="text-center py-3 px-4">Total Fidèles</th>
                        <th className="text-center py-3 px-4">Total STARS</th>
                        <th className="text-center py-3 px-4">Total Général</th>
                      </tr>
                    </thead>
                    <tbody>
                      {culteStatsData.summary.map((row, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{row.date}</td>
                          <td className="py-3 px-4">{row.ville}</td>
                          <td className="text-center py-3 px-4">
                            <div className="text-sm">
                              <span className="text-indigo-600">{row.culte_1.fideles}</span>
                              {' / '}
                              <span className="text-yellow-600">{row.culte_1.stars}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="text-sm">
                              <span className="text-indigo-600">{row.culte_2.fideles}</span>
                              {' / '}
                              <span className="text-yellow-600">{row.culte_2.stars}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="text-sm">
                              <span className="text-indigo-600">{row.ejp.fideles}</span>
                              {' / '}
                              <span className="text-yellow-600">{row.ejp.stars}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4 font-bold text-indigo-600">
                            {row.total_fideles}
                          </td>
                          <td className="text-center py-3 px-4 font-bold text-yellow-600">
                            {row.total_stars}
                          </td>
                          <td className="text-center py-3 px-4 font-bold text-green-600">
                            {row.total_general}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {culteStatsData.summary.length} dimanches enregistrés
                </p>
              </CardContent>
            </Card>

            {/* Actions Rapides */}
            {canEdit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => {
                  // Sauvegarder le filtre ville actuel pour CulteStatsPage
                  localStorage.setItem('culte_stats_filter_city', selectedCity);
                  navigate('/culte-stats');
                }} variant="outline" className="h-20">
                  <div className="text-center">
                    <BarChart3 className="h-6 w-6 mx-auto mb-2" />
                    <p>Gérer Statistiques Cultes</p>
                  </div>
                </Button>
              </div>
            )}
          </>
        )}

        {/* Vue Évangélisation */}
        {selectedView === 'evangelisation' && (
          <>
            <DepartmentAlert view="Évangélisation" />
            <Card className="bg-gradient-to-br from-red-50 to-pink-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <Heart className="h-6 w-6" />
                  Statistiques d'Évangélisation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Évangélisation Église */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">Évangélisation de l'Église</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <p className="text-xs text-gray-600">Gagneurs d'âme</p>
                        <p className="text-3xl font-bold text-blue-600">0</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded">
                        <p className="text-xs text-gray-600">Pers. réceptives</p>
                        <p className="text-3xl font-bold text-orange-600">0</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <p className="text-xs text-gray-600">Prières salut</p>
                        <p className="text-3xl font-bold text-green-600">0</p>
                      </div>
                      <div className="text-center p-3 bg-indigo-50 rounded">
                        <p className="text-xs text-gray-600">Contacts pris</p>
                        <p className="text-3xl font-bold text-indigo-600">0</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <p className="text-xs text-gray-600">Âmes invitées</p>
                        <p className="text-3xl font-bold text-purple-600">0</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded">
                        <p className="text-xs text-gray-600">Miracles</p>
                        <p className="text-3xl font-bold text-yellow-600">0</p>
                      </div>
                    </div>
                  </div>

                  {/* Évangélisation Familles d'Impact */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold text-purple-900 mb-4">Évangélisation Familles d'Impact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <p className="text-xs text-gray-600">Gagneurs d'âme</p>
                        <p className="text-3xl font-bold text-purple-600">0</p>
                      </div>
                      <div className="text-center p-3 bg-pink-50 rounded">
                        <p className="text-xs text-gray-600">Pers. réceptives</p>
                        <p className="text-3xl font-bold text-pink-600">0</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <p className="text-xs text-gray-600">Prières salut</p>
                        <p className="text-3xl font-bold text-green-600">0</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <p className="text-xs text-gray-600">Contacts pris</p>
                        <p className="text-3xl font-bold text-blue-600">0</p>
                      </div>
                      <div className="text-center p-3 bg-indigo-50 rounded">
                        <p className="text-xs text-gray-600">Âmes invitées</p>
                        <p className="text-3xl font-bold text-indigo-600">0</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded">
                        <p className="text-xs text-gray-600">Miracles</p>
                        <p className="text-3xl font-bold text-yellow-600">0</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-white rounded-lg border border-red-200">
                  <p className="text-sm text-gray-600 text-center">
                    💡 Sélectionnez une ville et une période dans les filtres ci-dessus pour voir les statistiques d'évangélisation
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default DashboardSuperAdminCompletPage;
