import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getPromotionsDetailed, getFIDetailed, getCities, getUser, getReferents, getStats } from '../utils/api';
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
      // Filtrer par ville si une ville spécifique est sélectionnée
      const cityFilter = selectedCity !== 'all' ? selectedCity : null;
      
      const [promosData, referentsData, statsData] = await Promise.all([
        getPromotionsDetailed(cityFilter),
        getReferents(),
        getStats() // Pour récupérer les KPIs formations
      ]);
      
      // Filter referents by city if needed
      let filteredReferents = referentsData;
      if (selectedCity !== 'all') {
        filteredReferents = referentsData.filter(r => r.city === selectedCity);
      }
      
      // Structure des données pour les KPIs
      setPromosStats({
        total_visitors: promosData.summary?.total_visitors || 0,
        active_referents: filteredReferents.length || 0,
        avg_fidelisation: promosData.summary?.avg_fidelisation || 0,
        promos: promosData.promos || [],
        formation_pcnc: statsData.formation_pcnc || 0,
        formation_au_coeur_bible: statsData.formation_au_coeur_bible || 0,
        formation_star: statsData.formation_star || 0
      });
      
      // Construire les données de fidélisation pour chaque référent
      const fidelisationByReferent = filteredReferents.map(referent => {
        const referentMonth = referent.assigned_month;
        const promoData = promosData.promos?.find(p => p.month === referentMonth);
        
        return {
          referent_name: referent.username,
          city: referent.city,
          assigned_month: referentMonth,
          total_visitors: promoData?.total_visitors || 0,
          monthly_average: promoData?.fidelisation || 0
        };
      });
      
      setPromosFidelisation(fidelisationByReferent);
    } catch (error) {
      console.error('Error loading promos data:', error);
    }
  };

  const loadFIData = async () => {
    try {
      // Filtrer par ville si une ville spécifique est sélectionnée
      const cityFilter = selectedCity !== 'all' ? selectedCity : null;
      
      const fiData = await getFIDetailed(cityFilter);
      
      // Group data by ville
      const statsByCity = {};
      
      // Group secteurs by ville
      fiData.secteurs?.forEach(secteur => {
        const ville = secteur.ville;
        if (!statsByCity[ville]) {
          statsByCity[ville] = {
            ville: ville,
            nombre_secteurs: 0,
            nombre_fi: 0,
            nombre_membres: 0,
            fidelisation: 0,
            details_secteurs: []
          };
        }
        
        statsByCity[ville].nombre_secteurs += 1;
        statsByCity[ville].nombre_fi += secteur.nombre_fi;
        statsByCity[ville].nombre_membres += secteur.nombre_membres;
        
        // Add secteur details
        const secteurFiList = fiData.fi_fidelisation?.filter(fi => fi.secteur_id === secteur.secteur_id) || [];
        const secteurFidelisation = secteurFiList.length > 0
          ? secteurFiList.reduce((sum, fi) => sum + fi.fidelisation, 0) / secteurFiList.length
          : 0;
        
        statsByCity[ville].details_secteurs.push({
          nom: secteur.secteur_nom,
          nombre_fi: secteur.nombre_fi,
          nombre_membres: secteur.nombre_membres,
          fidelisation: secteurFidelisation
        });
      });
      
      // Calculate average fidelisation for each ville
      Object.keys(statsByCity).forEach(ville => {
        const villeFI = fiData.fi_fidelisation?.filter(fi => fi.ville === ville) || [];
        if (villeFI.length > 0) {
          statsByCity[ville].fidelisation = villeFI.reduce((sum, fi) => sum + fi.fidelisation, 0) / villeFI.length;
        }
      });
      
      setFiStats(Object.values(statsByCity));
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
                      const cityPromos = promosStats?.promos || [];
                      
                      // Calculate total visitors for this city by summing promos that have referents in this city
                      const cityMonths = cityReferents.map(r => r.assigned_month);
                      const cityVisitors = cityPromos
                        .filter(p => cityMonths.includes(p.month))
                        .reduce((sum, p) => sum + (p.total_visitors || 0), 0);
                      
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedCity === 'all' ? 'Toutes les villes' : selectedCity}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">FI Totales</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalFIStats?.fi || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Familles d'Impact actives</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Membres Totaux</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalFIStats?.membres || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Membres actifs</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fidélisation Moyenne</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalFIStats?.fidelisation?.toFixed(1) || 0}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Présences jeudis</p>
                </CardContent>
              </Card>
            </div>

            {/* Stats détaillées par ville */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Vue Détaillée par Ville</span>
                  <span className="text-sm font-normal text-gray-500">
                    {fiStats?.length || 0} villes
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fiStats && fiStats.length > 0 ? (
                  <div className="space-y-6">
                    {fiStats.map((cityData, index) => (
                      <div key={index} className="border-2 border-indigo-100 rounded-lg p-4">
                        {/* En-tête ville */}
                        <div className="flex justify-between items-center mb-4 pb-3 border-b">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{cityData.ville}</h3>
                            <p className="text-sm text-gray-500">
                              {cityData.nombre_secteurs} secteurs • {cityData.nombre_fi} FI • {cityData.nombre_membres} membres
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-indigo-600">{cityData.fidelisation?.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">Fidélisation</p>
                          </div>
                        </div>

                        {/* KPIs ville */}
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <p className="text-sm text-gray-600">Secteurs</p>
                            <p className="text-2xl font-bold text-blue-600">{cityData.nombre_secteurs}</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3 text-center">
                            <p className="text-sm text-gray-600">FI</p>
                            <p className="text-2xl font-bold text-purple-600">{cityData.nombre_fi}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3 text-center">
                            <p className="text-sm text-gray-600">Membres</p>
                            <p className="text-2xl font-bold text-green-600">{cityData.nombre_membres}</p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-3 text-center">
                            <p className="text-sm text-gray-600">Moy./FI</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {cityData.nombre_fi > 0 ? Math.round(cityData.nombre_membres / cityData.nombre_fi) : 0}
                            </p>
                          </div>
                        </div>

                        {/* Détails secteurs si disponibles */}
                        {cityData.details_secteurs && cityData.details_secteurs.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-gray-700 mb-2">Détails par Secteur :</h4>
                            <div className="space-y-2">
                              {cityData.details_secteurs.map((secteur, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <span className="font-medium">{secteur.nom}</span>
                                  <div className="flex space-x-4 text-sm">
                                    <span>{secteur.nombre_fi} FI</span>
                                    <span>{secteur.nombre_membres} membres</span>
                                    <span className="font-bold text-indigo-600">{secteur.fidelisation?.toFixed(1)}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Aucune donnée disponible</p>
                )}
              </CardContent>
            </Card>

            {/* Tableau récapitulatif toutes FI */}
            {selectedCity === 'all' && (
              <Card>
                <CardHeader>
                  <CardTitle>Toutes les Familles d'Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secteurs</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">FI</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Membres</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Moy./FI</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fidélisation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {fiStats?.map((city, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{city.ville}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{city.nombre_secteurs}</td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                {city.nombre_fi}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                {city.nombre_membres}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-medium">
                              {city.nombre_fi > 0 ? Math.round(city.nombre_membres / city.nombre_fi) : 0}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className="text-lg font-bold text-indigo-600">
                                {city.fidelisation?.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPasteurPage;