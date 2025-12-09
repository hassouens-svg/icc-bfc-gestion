import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Heart, Users, Sparkles, TrendingUp, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const VueEvangelisationPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState([]);
  const [selectedCity, setSelectedCity] = useState('all');
  const [cities, setCities] = useState([]);
  const [dateRange, setDateRange] = useState('month'); // 'week', 'month', 'year'

  useEffect(() => {
    if (!user || !['pasteur', 'super_admin'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    
    loadCities();
    loadStats();
  }, [user, navigate, selectedCity, dateRange]);

  const loadCities = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cities`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/evangelisation/stats?city=${selectedCity}&range=${dateRange}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }
      
      const data = await response.json();
      setStatsData(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
      setStatsData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (type) => {
    if (!statsData || statsData.length === 0) return {
      gagneurs_ame: 0,
      personnes_receptives: 0,
      priere_salut: 0,
      contacts_pris: 0,
      ames_invitees: 0,
      miracles: 0
    };

    return statsData.reduce((acc, stat) => {
      const data = stat[type] || {};
      return {
        gagneurs_ame: acc.gagneurs_ame + (data.nombre_gagneurs_ame || 0),
        personnes_receptives: acc.personnes_receptives + (data.nombre_personnes_receptives || 0),
        priere_salut: acc.priere_salut + (data.nombre_priere_salut || 0),
        contacts_pris: acc.contacts_pris + (data.nombre_contacts_pris || 0),
        ames_invitees: acc.ames_invitees + (data.nombre_ames_invitees || 0),
        miracles: acc.miracles + (data.nombre_miracles || 0)
      };
    }, {
      gagneurs_ame: 0,
      personnes_receptives: 0,
      priere_salut: 0,
      contacts_pris: 0,
      ames_invitees: 0,
      miracles: 0
    });
  };

  const egliseStats = calculateTotals('eglise');
  const fiStats = calculateTotals('familles_impact');

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-4xl font-bold flex items-center gap-2 text-gray-900 mb-2">
            <Heart className="h-10 w-10 text-red-600" />
            Vue Évangélisation
          </h1>
          <p className="text-gray-600">Statistiques en lecture seule</p>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Ville
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">Toutes les villes</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.name}>{city.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Période
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="year">Cette année</option>
                  <option value="all">Tout le temps</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={loadStats}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Statistiques Église */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Église
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-gray-700">👥 Gagneurs d'âme</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {egliseStats.gagneurs_ame}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-gray-700">💝 Personnes réceptives</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {egliseStats.personnes_receptives}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-gray-700">🙏 Prières de salut</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {egliseStats.priere_salut}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-gray-700">📞 Contacts pris</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {egliseStats.contacts_pris}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-gray-700">✉️ Âmes invitées</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {egliseStats.ames_invitees}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-gray-700">✨ Miracles</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {egliseStats.miracles}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques Familles d'Impact */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-6 w-6" />
                  Familles d'Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium text-gray-700">👥 Gagneurs d'âme</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {fiStats.gagneurs_ame}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium text-gray-700">💝 Personnes réceptives</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {fiStats.personnes_receptives}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium text-gray-700">🙏 Prières de salut</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {fiStats.priere_salut}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium text-gray-700">📞 Contacts pris</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {fiStats.contacts_pris}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium text-gray-700">✉️ Âmes invitées</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {fiStats.ames_invitees}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium text-gray-700">✨ Miracles</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {fiStats.miracles}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Totaux combinés */}
        {!loading && (
          <Card className="mt-6 shadow-lg border-2 border-red-200">
            <CardHeader className="bg-gradient-to-r from-red-600 to-pink-600 text-white">
              <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
                <Sparkles className="h-7 w-7" />
                TOTAUX GLOBAUX
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {egliseStats.gagneurs_ame + fiStats.gagneurs_ame}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Gagneurs d'âme</div>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {egliseStats.personnes_receptives + fiStats.personnes_receptives}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Personnes réceptives</div>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {egliseStats.priere_salut + fiStats.priere_salut}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Prières de salut</div>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {egliseStats.contacts_pris + fiStats.contacts_pris}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Contacts pris</div>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {egliseStats.ames_invitees + fiStats.ames_invitees}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Âmes invitées</div>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {egliseStats.miracles + fiStats.miracles}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Miracles</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          ℹ️ Cette page est en lecture seule. Pour saisir de nouvelles données, contactez le responsable d'évangélisation.
        </div>
      </div>
    </Layout>
  );
};

export default VueEvangelisationPage;
