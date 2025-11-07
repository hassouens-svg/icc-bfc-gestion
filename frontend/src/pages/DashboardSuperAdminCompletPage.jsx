import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  getPromotionsDetailed, 
  getVisitorsTable, 
  getFIDetailed, 
  getMembresTable,
  getPresencesDimanche,
  getCities,
  getUser 
} from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
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
  Download
} from 'lucide-react';
import { toast } from 'sonner';
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
  
  // Check permissions
  const canEdit = user?.role === 'super_admin';
  const isReadOnly = user?.role === 'pasteur';
  
  const [selectedView, setSelectedView] = useState('promotions'); // 'promotions' or 'fi' or 'presences' or 'cultes'
  const [selectedCity, setSelectedCity] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [cities, setCities] = useState([]);
  const [promosData, setPromosData] = useState(null);
  const [visitorsTable, setVisitorsTable] = useState([]);
  const [fiData, setFiData] = useState(null);
  const [membresTable, setMembresTable] = useState([]);
  const [presencesDimancheData, setPresencesDimancheData] = useState(null);
  
  // Filters for tables
  const [visitorsFilter, setVisitorsFilter] = useState('');
  const [membresFilter, setMembresFilter] = useState('');
  
  // Filters for presences dimanche
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!user || !['super_admin', 'pasteur'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    loadData();
    // eslint-disable-next-line
  }, [selectedView]);

  const loadData = async () => {
    setLoading(true);
    try {
      const citiesData = await getCities();
      setCities(citiesData);
      
      if (selectedView === 'promotions') {
        await loadPromotionsData();
      } else if (selectedView === 'fi') {
        await loadFIData();
      } else if (selectedView === 'presences') {
        await loadPresencesDimancheData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadPromotionsData = async () => {
    try {
      const [promos, visitors] = await Promise.all([
        getPromotionsDetailed(),
        getVisitorsTable()
      ]);
      
      setPromosData(promos);
      setVisitorsTable(visitors);
    } catch (error) {
      console.error('Error loading promotions:', error);
    }
  };

  const loadFIData = async () => {
    try {
      const [fi, membres] = await Promise.all([
        getFIDetailed(),
        getMembresTable()
      ]);
      
      setFiData(fi);
      setMembresTable(membres);
    } catch (error) {
      console.error('Error loading FI:', error);
    }
  };

  const loadPresencesDimancheData = async () => {
    try {
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

  // Filter data by city
  const filterByCity = (data, cityField = 'city') => {
    if (selectedCity === 'all') return data;
    return data.filter(item => item[cityField] === selectedCity);
  };

  // Filter visitors table
  const filteredVisitors = visitorsTable.filter(v => {
    if (selectedCity !== 'all' && v.city !== selectedCity) return false;
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
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {canEdit ? 'Tableau de Bord - Super Administrateur' : 'Tableau de Bord - Pasteur'}
            </h2>
            <p className="text-gray-500 mt-1">
              {canEdit ? 'Gestion complète multi-villes' : 'Vue complète multi-villes (lecture seule)'}
            </p>
          </div>
          
          {canEdit && (
            <div className="flex space-x-2">
              <Button onClick={() => navigate('/cities')} variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Gérer Villes
              </Button>
              <Button onClick={() => navigate('/gestion-acces')} variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Gérer Accès
              </Button>
              <Button onClick={() => navigate('/gestion-permissions-dashboard')} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Permissions Dashboard
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vue</label>
                <Select value={selectedView} onValueChange={setSelectedView}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotions">Promotions</SelectItem>
                    <SelectItem value="fi">Familles d'Impact</SelectItem>
                    <SelectItem value="presences">Présences Dimanche</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ville</label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PROMOTIONS VIEW */}
        {selectedView === 'promotions' && promosData && (
          <>
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
                  <CardTitle className="text-sm font-medium">Total Visiteurs</CardTitle>
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

            {/* NA vs NC Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition NA vs NC</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Nouveaux Arrivants', value: promosData.summary.total_na, color: '#10b981' },
                        { name: 'Nouveaux Convertis', value: promosData.summary.total_nc, color: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Fidélisation par Promo */}
            <Card>
              <CardHeader>
                <CardTitle>Fidélisation par Promo (Mois)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Mois</th>
                        <th className="text-center py-3 px-4">Total Visiteurs</th>
                        <th className="text-center py-3 px-4">NA</th>
                        <th className="text-center py-3 px-4">NC</th>
                        <th className="text-center py-3 px-4">Présences Dim.</th>
                        <th className="text-center py-3 px-4">Présences Jeu.</th>
                        <th className="text-center py-3 px-4">Fidélisation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promosData.promos.map((promo, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{promo.month}</td>
                          <td className="text-center py-3 px-4">{promo.total_visitors}</td>
                          <td className="text-center py-3 px-4 text-green-600">{promo.na_count}</td>
                          <td className="text-center py-3 px-4 text-red-600">{promo.nc_count}</td>
                          <td className="text-center py-3 px-4">{promo.total_presences_dimanche}</td>
                          <td className="text-center py-3 px-4">{promo.total_presences_jeudi}</td>
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

            {/* Évolution Fidélisation */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution de la Fidélisation par Mois</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={promosData.promos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tous les Visiteurs - Vue Tableau Complète</CardTitle>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="border rounded px-3 py-1 text-sm"
                    value={visitorsFilter}
                    onChange={(e) => setVisitorsFilter(e.target.value)}
                  />
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
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
                        <th className="text-center py-2 px-2">Prés. Dim.</th>
                        <th className="text-center py-2 px-2">Prés. Jeu.</th>
                        <th className="text-center py-2 px-2">Total Prés.</th>
                        <th className="text-left py-2 px-2">FI Assignée</th>
                        <th className="text-center py-2 px-2">Commentaires</th>
                        {canEdit && <th className="text-center py-2 px-2">Actions</th>}
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
                              {visitor.types?.includes('Nouveau Converti') && <span className="bg-red-100 text-red-800 px-1 py-0.5 rounded">NC</span>}
                            </span>
                          </td>
                          <td className="py-2 px-2">{visitor.phone}</td>
                          <td className="py-2 px-2 text-xs">{visitor.email || '-'}</td>
                          <td className="text-center py-2 px-2">{visitor.assigned_month}</td>
                          <td className="text-center py-2 px-2">{visitor.presences_dimanche_count}</td>
                          <td className="text-center py-2 px-2">{visitor.presences_jeudi_count}</td>
                          <td className="text-center py-2 px-2 font-bold">{visitor.total_presences}</td>
                          <td className="py-2 px-2 text-xs">{visitor.assigned_fi || '-'}</td>
                          <td className="text-center py-2 px-2">{visitor.comments_count}</td>
                          {canEdit && (
                            <td className="text-center py-2 px-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/visitors/${visitor.id}`)}
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
                  {filteredVisitors.length} visiteurs affichés
                </p>
              </CardContent>
            </Card>

            {/* Actions Rapides Promotions */}
            {canEdit && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button onClick={() => navigate('/visiteurs')} variant="outline" className="h-20">
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
                <Button onClick={() => navigate('/fidelisation/admin')} variant="outline" className="h-20">
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
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
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
                          <td className="py-2 px-2">{membre.firstname} {membre.lastname}</td>
                          <td className="py-2 px-2">{membre.phone}</td>
                          <td className="py-2 px-2">{membre.ville}</td>
                          <td className="py-2 px-2 text-xs">{membre.fi_nom}</td>
                          <td className="py-2 px-2 text-xs">{membre.secteur_nom}</td>
                          <td className="text-center py-2 px-2 font-bold">{membre.presences_count}</td>
                          <td className="py-2 px-2 text-xs">{membre.date_joined}</td>
                          {canEdit && (
                            <td className="text-center py-2 px-2">
                              <Button variant="outline" size="sm">
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
                <Button onClick={() => navigate('/secteurs')} variant="outline" className="h-20">
                  <div className="text-center">
                    <Building2 className="h-6 w-6 mx-auto mb-2" />
                    <p>Gérer Secteurs</p>
                  </div>
                </Button>
                <Button onClick={() => navigate('/fi/admin')} variant="outline" className="h-20">
                  <div className="text-center">
                    <Users className="h-6 w-6 mx-auto mb-2" />
                    <p>Gérer FI</p>
                  </div>
                </Button>
                <Button onClick={() => navigate('/fi/affectation')} variant="outline" className="h-20">
                  <div className="text-center">
                    <UserPlus className="h-6 w-6 mx-auto mb-2" />
                    <p>Affecter Membres</p>
                  </div>
                </Button>
                <Button onClick={() => navigate('/fi/stats/superviseur')} variant="outline" className="h-20">
                  <div className="text-center">
                    <BarChart3 className="h-6 w-6 mx-auto mb-2" />
                    <p>Stats FI</p>
                  </div>
                </Button>
              </div>
            )}
          </>
        )}

        {/* PRESENCES DIMANCHE VIEW */}
        {selectedView === 'presences' && (
          <>
            {/* Filters for Presences Dimanche */}
            <Card>
              <CardHeader>
                <CardTitle>Filtres Présences Dimanche</CardTitle>
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
                    <Button onClick={loadPresencesDimancheData} className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      Appliquer les filtres
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {presencesDimancheData && (
              <>
                {/* KPIs Présences Dimanche */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Dimanches</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{presencesDimancheData.summary.total_dimanches}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Présences</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{presencesDimancheData.summary.total_presences}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">NA Présents</CardTitle>
                      <UserPlus className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {presencesDimancheData.summary.total_na}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">NC Présents</CardTitle>
                      <Heart className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {presencesDimancheData.summary.total_nc}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Moyenne/Dimanche</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-indigo-600">
                        {presencesDimancheData.summary.avg_per_dimanche}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Graphique Évolution Présences */}
                <Card>
                  <CardHeader>
                    <CardTitle>Évolution des Présences Dimanche</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={presencesDimancheData.presences.slice(0, 20).reverse()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="total_present" stroke="#6366f1" strokeWidth={2} name="Total Présents" />
                        <Line type="monotone" dataKey="na_present" stroke="#10b981" strokeWidth={2} name="NA" />
                        <Line type="monotone" dataKey="nc_present" stroke="#ef4444" strokeWidth={2} name="NC" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Tableau Détaillé Présences Dimanche */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Présences Dimanche - Détails par Date</CardTitle>
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
                            <th className="text-center py-3 px-4">Total Présents</th>
                            <th className="text-center py-3 px-4">Total Absents</th>
                            <th className="text-center py-3 px-4">NA Présents</th>
                            <th className="text-center py-3 px-4">NA Absents</th>
                            <th className="text-center py-3 px-4">NC Présents</th>
                            <th className="text-center py-3 px-4">NC Absents</th>
                            <th className="text-center py-3 px-4">Taux Présence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {presencesDimancheData.presences.map((presence, index) => {
                            const total = presence.total_present + presence.total_absent;
                            const tauxPresence = total > 0 ? ((presence.total_present / total) * 100).toFixed(1) : 0;
                            
                            return (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 font-medium">{presence.date}</td>
                                <td className="text-center py-3 px-4 font-bold text-green-600">
                                  {presence.total_present}
                                </td>
                                <td className="text-center py-3 px-4 text-gray-500">
                                  {presence.total_absent}
                                </td>
                                <td className="text-center py-3 px-4 text-green-600">
                                  {presence.na_present}
                                </td>
                                <td className="text-center py-3 px-4 text-gray-400">
                                  {presence.na_absent}
                                </td>
                                <td className="text-center py-3 px-4 text-red-600">
                                  {presence.nc_present}
                                </td>
                                <td className="text-center py-3 px-4 text-gray-400">
                                  {presence.nc_absent}
                                </td>
                                <td className="text-center py-3 px-4">
                                  <span className={`font-bold ${tauxPresence >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                                    {tauxPresence}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {presencesDimancheData.presences.length} dimanches enregistrés
                    </p>
                  </CardContent>
                </Card>

                {/* Détails Visiteurs par Date (expandable) */}
                <Card>
                  <CardHeader>
                    <CardTitle>Détails des Visiteurs par Dimanche</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {presencesDimancheData.presences.slice(0, 10).map((presence, index) => (
                        <details key={index} className="border rounded-lg p-3">
                          <summary className="cursor-pointer font-medium text-indigo-600 hover:text-indigo-800">
                            {presence.date} - {presence.total_present} présents ({presence.na_present} NA, {presence.nc_present} NC)
                          </summary>
                          <div className="mt-3 space-y-2">
                            {presence.visitors_details.map((visitor, vIndex) => (
                              <div 
                                key={vIndex} 
                                className={`flex justify-between items-center p-2 rounded ${
                                  visitor.present ? 'bg-green-50' : 'bg-gray-50'
                                }`}
                              >
                                <div>
                                  <p className="text-sm font-medium">{visitor.name}</p>
                                  <p className="text-xs text-gray-500">{visitor.city}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {visitor.types.includes('Nouveau Arrivant') && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                      NA
                                    </span>
                                  )}
                                  {visitor.types.includes('Nouveau Converti') && (
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                      NC
                                    </span>
                                  )}
                                  <span className={`text-xs font-medium ${
                                    visitor.present ? 'text-green-600' : 'text-gray-500'
                                  }`}>
                                    {visitor.present ? '✓ Présent' : '✗ Absent'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default DashboardSuperAdminCompletPage;
