import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getPromotionsDetailed,
  getFIDetailed,
  getReferents,
  getStats,
  getUser,
  getMembresFI
} from '../utils/api';
import Layout from '../components/Layout';
import { toast } from 'sonner';
import { useCities } from '../contexts/CitiesContext';

const DashboardPasteurPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  const [selectedDepartment, setSelectedDepartment] = useState('promotions');
  const [selectedCity, setSelectedCity] = useState('all');
  const [loading, setLoading] = useState(false);
  
  // Use shared cities from Context
  const { cities } = useCities();
  
  // Promos data
  const [promosData, setPromosData] = useState({ summary: {}, promos: [] });
  const [referentsData, setReferentsData] = useState([]);
  
  // FI stats
  const [fiStats, setFiStats] = useState(null);
  
  // Use refs to prevent race conditions
  const abortControllerRef = useRef(null);
  const loadingTimeoutRef = useRef(null);

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
      if (selectedDepartment === 'promotions') {
        await loadPromosData();
      } else {
        await loadFIData();
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
        return;
      }
      toast.error('Erreur lors du chargement');
    } finally {
      // Set loading to false immediately
      setLoading(false);
    }
  }, [selectedCity, selectedDepartment]);

  useEffect(() => {
    if (!user || user.role !== 'pasteur') {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, selectedDepartment]); // FIXED: Removed circular dependency

  const loadPromosData = async () => {
    try {
      // Filtrer par ville si une ville spécifique est sélectionnée
      const cityFilter = selectedCity !== 'all' ? selectedCity : null;
      
      const results = await Promise.allSettled([
        getPromotionsDetailed(cityFilter),
        getReferents(),
        getStats() // Pour récupérer les KPIs formations
      ]);
      
      const promosData = results[0].status === 'fulfilled' ? results[0].value : { summary: {}, promos: [] };
      const referentsData = results[1].status === 'fulfilled' ? results[1].value : [];
      const statsData = results[2].status === 'fulfilled' ? results[2].value : {};

      setPromosData(promosData);
      setReferentsData(referentsData);

      // Extract formation stats
      setFiStats({
        au_coeur_bible: statsData.au_coeur_bible || 0,
        formation_star: statsData.formation_star || 0
      });
    } catch (error) {
      console.error('Error loading promos:', error);
    }
  };

  const loadFIData = async () => {
    try {
      const cityFilter = selectedCity !== 'all' ? selectedCity : null;
      
      const results = await Promise.allSettled([
        getFIDetailed(cityFilter),
        getMembresFI()
      ]);
      
      if (results[0].status === 'fulfilled') {
        setFiStats(results[0].value);
      } else {
        console.error('Error loading FI detailed:', results[0].reason);
        setFiStats(null);
      }
    } catch (error) {
      console.error('Error loading FI:', error);
      setFiStats(null);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard Pasteur</h1>
          <p className="text-gray-500">Vue globale de l'activité</p>
        </div>

        {/* Department Selector */}
        <div className="mb-6 flex gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Département</label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="promotions">Bergeries</SelectItem>
                <SelectItem value="fi">Familles Impact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ville</label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement...</p>
            </div>
          </div>
        ) : selectedDepartment === 'promotions' ? (
          <div className="space-y-6">
            {/* Bergeries Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Visiteurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {promosData?.summary?.total_visiteurs || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nouveaux Arrivants</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {promosData?.summary?.nouveaux_arrivants || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nouveaux Convertis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {promosData?.summary?.nouveaux_convertis || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Référents */}
            <Card>
              <CardHeader>
                <CardTitle>Référents ({referentsData.filter(ref => selectedCity === 'all' || ref.city === selectedCity).length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {referentsData
                    .filter(ref => selectedCity === 'all' || ref.city === selectedCity)
                    .map((ref, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded flex justify-between">
                      <span className="font-medium">{ref.firstname} {ref.lastname}</span>
                      <span className="text-gray-500">{ref.assigned_month}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* FI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Au Coeur de la Bible</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {fiStats?.au_coeur_bible || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Formation STAR</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {fiStats?.formation_star || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPasteurPage;