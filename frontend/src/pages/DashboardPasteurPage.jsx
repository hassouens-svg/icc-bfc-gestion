import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStats, getAdminFidelisation, getStatsPasteur, getCities, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Users, MapPin, TrendingUp, Percent, Heart, BarChart3, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const DashboardPasteurPage = () => {
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

  useEffect(() => {
    if (!user || user.role !== 'pasteur') {
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
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tableau de Bord - Pasteur</h2>
          <p className="text-gray-500 mt-1">Vue d'ensemble multi-villes et multi-départements</p>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedCity === 'all' ? 'Toutes les villes' : selectedCity}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Responsables Actifs</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{promosStats?.active_referents || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Référents en service</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux Fidélisation Moyen</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgFidelisationPromos.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Moyenne globale</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Villes Actives</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{cities.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Villes avec promos</p>
                </CardContent>
              </Card>
            </div>

            {/* Détails par Responsable de Promos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Détails par Responsable de Promos</span>
                  <span className="text-sm font-normal text-gray-500">
                    {promosFidelisation?.length || 0} responsables
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {promosFidelisation && promosFidelisation.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsable</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mois Assigné</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Visiteurs</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fidélisation</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {promosFidelisation.map((referent, index) => {
                          const monthLabel = referent.assigned_month ? 
                            new Date(referent.assigned_month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 
                            'Non assigné';
                          const fidelisation = referent.monthly_average || 0;
                          const status = fidelisation >= 75 ? 'Excellent' : fidelisation >= 50 ? 'Bon' : 'À améliorer';
                          const statusColor = fidelisation >= 75 ? 'bg-green-100 text-green-800' : 
                                            fidelisation >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                                            'bg-red-100 text-red-800';
                          
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {referent.referent_name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{referent.city}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{monthLabel}</td>
                              <td className="px-4 py-3 text-sm text-center">
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                  {referent.total_visitors}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <span className="text-lg font-bold text-indigo-600">
                                  {fidelisation.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Aucune donnée disponible</p>
                )}
              </CardContent>
            </Card>

            {/* Stats par Ville */}
            {selectedCity === 'all' && (
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques par Ville - Promotions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cities.map((city) => {
                      const cityReferents = promosFidelisation?.filter(r => r.city === city.name) || [];
                      const cityVisitors = promosStats?.visitors?.filter(v => v.city === city.name).length || 0;
                      const avgFid = cityReferents.length > 0 ? 
                        cityReferents.reduce((sum, r) => sum + (r.monthly_average || 0), 0) / cityReferents.length : 0;
                      
                      return (
                        <div key={city.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-lg font-semibold">{city.name}</h3>
                              <p className="text-sm text-gray-500">{cityReferents.length} responsables actifs</p>
                            </div>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                              {avgFid.toFixed(1)}% fidélisation
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Nouveaux Arrivants</p>
                              <p className="text-2xl font-bold">{cityVisitors}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Responsables</p>
                              <p className="text-2xl font-bold">{cityReferents.length}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
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
          </>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPasteurPage;