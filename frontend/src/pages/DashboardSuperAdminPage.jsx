import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStats, getReferentFidelisation, getAdminFidelisation, getStatsSuperviseurFI, getStatsPasteur, getCities, getUser, exportAllData, importAllData } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Users, MapPin, TrendingUp, Percent, Heart, BarChart3, UserPlus, Download, Upload, Database } from 'lucide-react';
import { toast } from 'sonner';

const DashboardSuperAdminPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = getUser();
  
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'all');
  const [selectedDepartment, setSelectedDepartment] = useState(searchParams.get('department') || 'promotions');
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Promos stats
  const [promosStats, setPromosStats] = useState(null);
  const [promosFidelisation, setPromosFidelisation] = useState(null);
  
  // FI stats
  const [fiStats, setFiStats] = useState(null);
  
  // Data migration
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'super_admin') {
      navigate('/dashboard');
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, selectedDepartment]);

  const loadData = async () => {
    setLoading(true);
    try {
      const citiesData = await getCities();
      setCities(citiesData);
      
      if (selectedDepartment === 'promotions') {
        await loadPromosData();
      } else {
        await loadFIData();
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadPromosData = async () => {
    try {
      const [statsData, fidelisationData] = await Promise.all([
        getStats(),
        getAdminFidelisation()
      ]);
      
      // Filter by city if needed
      if (selectedCity !== 'all') {
        const cityVisitors = statsData.visitors?.filter(v => v.city === selectedCity) || [];
        const cityReferents = fidelisationData?.filter(r => r.city === selectedCity) || [];
        
        setPromosStats({
          total_visitors: cityVisitors.length,
          active_referents: cityReferents.length,
          monthly_arrivals: statsData.monthly_arrivals?.filter(m => 
            cityVisitors.some(v => v.assigned_month === m.month)
          ) || [],
          visitors: cityVisitors
        });
        setPromosFidelisation(cityReferents);
      } else {
        setPromosStats({
          total_visitors: statsData.total_visitors || 0,
          active_referents: fidelisationData?.length || 0,
          monthly_arrivals: statsData.monthly_arrivals || [],
          visitors: statsData.visitors || []
        });
        setPromosFidelisation(fidelisationData);
      }
    } catch (error) {
      console.error('Error loading promos data:', error);
    }
  };

  const loadFIData = async () => {
    try {
      const pasteurStats = await getStatsPasteur();
      
      if (selectedCity !== 'all') {
        const cityStats = pasteurStats.stats_by_city?.find(c => c.ville === selectedCity);
        setFiStats(cityStats ? [cityStats] : []);
      } else {
        setFiStats(pasteurStats.stats_by_city || []);
      }
    } catch (error) {
      console.error('Error loading FI data:', error);
    }
  };

  const handleCityChange = (value) => {
    setSelectedCity(value);
    setSearchParams({ city: value, department: selectedDepartment });
  };

  const handleDepartmentChange = (value) => {
    setSelectedDepartment(value);
    setSearchParams({ city: selectedCity, department: value });
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `icc-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Données exportées avec succès!');
    } catch (error) {
      toast.error('Erreur lors de l\'export: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const result = await importAllData(data);
      toast.success(`Import réussi! ${JSON.stringify(result.counts)}`);
      
      // Reload data after import
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'import: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
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

  // Calculate totals for FI
  const totalFIStats = fiStats?.reduce((acc, city) => {
    acc.secteurs += city.nombre_secteurs || 0;
    acc.fi += city.nombre_fi || 0;
    acc.membres += city.nombre_membres || 0;
    acc.fidelisation += city.fidelisation || 0;
    return acc;
  }, { secteurs: 0, fi: 0, membres: 0, fidelisation: 0 });

  if (totalFIStats && fiStats && fiStats.length > 0) {
    totalFIStats.fidelisation = totalFIStats.fidelisation / fiStats.length;
  }

  // Calculate totals for Promos
  const avgFidelisationPromos = promosFidelisation?.length > 0
    ? promosFidelisation.reduce((sum, r) => sum + (r.monthly_average || 0), 0) / promosFidelisation.length
    : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Tableau de Bord - Super Administrateur</h2>
            <p className="text-gray-500 mt-1">Gestion complète multi-villes et multi-départements</p>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={() => navigate('/cities')} variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Gérer Villes
            </Button>
            <Button onClick={() => navigate('/gestion-acces')} variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Gérer Accès
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Département</label>
                <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotions">Promotions</SelectItem>
                    <SelectItem value="familles-impact">Familles d'Impact</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ville</label>
                <Select value={selectedCity} onValueChange={handleCityChange}>
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
        {selectedDepartment === 'promotions' && (
          <>
            {/* Global KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Nouveaux Arrivants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{promosStats?.total_visitors || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Responsables Actifs</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{promosStats?.active_referents || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux Fidélisation Moyen</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgFidelisationPromos.toFixed(1)}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Villes Actives</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{cities.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Fidélisation par Responsable */}
            <Card>
              <CardHeader>
                <CardTitle>Fidélisation par Responsable de Promos</CardTitle>
              </CardHeader>
              <CardContent>
                {promosFidelisation && promosFidelisation.length > 0 ? (
                  <div className="space-y-3">
                    {promosFidelisation.map((referent, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{referent.referent_name}</p>
                          <p className="text-sm text-gray-500">
                            {referent.total_visitors} visiteurs - {referent.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-indigo-600">
                            {referent.monthly_average?.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">Moyenne mensuelle</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Aucune donnée disponible</p>
                )}
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={() => navigate('/visitors')} className="h-20" variant="outline">
                <div className="text-center">
                  <Users className="h-6 w-6 mx-auto mb-2" />
                  <p>Voir tous les nouveaux arrivants</p>
                </div>
              </Button>
              <Button onClick={() => navigate('/referents')} className="h-20" variant="outline">
                <div className="text-center">
                  <UserPlus className="h-6 w-6 mx-auto mb-2" />
                  <p>Gérer les responsables</p>
                </div>
              </Button>
              <Button onClick={() => navigate('/fidelisation')} className="h-20" variant="outline">
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                  <p>Analytics fidélisation</p>
                </div>
              </Button>
            </div>
          </>
        )}

        {/* FAMILLES D'IMPACT VIEW */}
        {selectedDepartment === 'familles-impact' && (
          <>
            {/* Global KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Secteurs Totaux</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalFIStats?.secteurs || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">FI Totales</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalFIStats?.fi || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Membres Totaux</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalFIStats?.membres || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fidélisation Moyenne</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalFIStats?.fidelisation?.toFixed(1) || 0}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Stats par ville */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiques par Ville</CardTitle>
              </CardHeader>
              <CardContent>
                {fiStats && fiStats.length > 0 ? (
                  <div className="space-y-4">
                    {fiStats.map((city, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold">{city.ville}</h3>
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                            {city.fidelisation?.toFixed(1)}% fidélisation
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Secteurs</p>
                            <p className="text-xl font-bold">{city.nombre_secteurs}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">FI</p>
                            <p className="text-xl font-bold">{city.nombre_fi}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Membres</p>
                            <p className="text-xl font-bold">{city.nombre_membres}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Aucune donnée disponible</p>
                )}
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={() => navigate('/familles-impact/secteurs')} className="h-20" variant="outline">
                <div className="text-center">
                  <MapPin className="h-6 w-6 mx-auto mb-2" />
                  <p>Gérer les secteurs</p>
                </div>
              </Button>
              <Button onClick={() => navigate('/familles-impact')} className="h-20" variant="outline">
                <div className="text-center">
                  <Heart className="h-6 w-6 mx-auto mb-2" />
                  <p>Voir toutes les FI</p>
                </div>
              </Button>
              <Button onClick={() => navigate('/familles-impact/affectation')} className="h-20" variant="outline">
                <div className="text-center">
                  <UserPlus className="h-6 w-6 mx-auto mb-2" />
                  <p>Affecter visiteurs</p>
                </div>
              </Button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default DashboardSuperAdminPage;
