import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser, getVisitors, getReferents } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, TrendingUp, BarChart3, GraduationCap } from 'lucide-react';

const DashboardSuperviseurPromosPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [visitors, setVisitors] = useState([]);
  const [responsablesPromo, setResponsablesPromo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoStats, setPromoStats] = useState([]);
  const [formationStats, setFormationStats] = useState({ pcnc: 0, bible: 0, star: 0 });

  useEffect(() => {
    if (!user || user.role !== 'superviseur_promos') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      // Load all users to get responsable_promo and referent list
      const allUsers = await getReferents();
      const resposPromo = allUsers.filter(u => (u.role === 'responsable_promo' || u.role === 'referent') && u.city === user.city);
      setResponsablesPromo(resposPromo);
      
      // Load ALL visitors (including stopped ones)
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/visitors?include_stopped=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const visitorsData = await response.json();
      const cityVisitors = visitorsData.filter(v => v.city === user.city);
      setVisitors(cityVisitors);
      
      // Calculate stats
      calculatePromoStats(cityVisitors, resposPromo);
      calculateFormationStats(cityVisitors);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePromoStats = (visitorsData, resposPromo) => {
    // Fonction pour convertir le mois numérique en nom
    const getMonthName = (monthNum) => {
      const months = {
        '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
        '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
        '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
      };
      return months[monthNum] || monthNum;
    };
    
    // Create a map of assigned_month to promo_name and responsable
    const monthToPromo = {};
    resposPromo.forEach(respo => {
      if (respo.assigned_month) {
        // Extract month part (MM from YYYY-MM)
        const monthPart = respo.assigned_month.split('-')[1];
        const monthName = getMonthName(monthPart);
        monthToPromo[monthPart] = {
          promo_name: respo.promo_name || respo.assigned_month,
          month_name: monthName,
          responsable: respo.username,
          assigned_month: respo.assigned_month
        };
      }
    });
    
    // Group visitors by promo name AND year
    const promoGroups = {};
    
    visitorsData.forEach(visitor => {
      if (!visitor.assigned_month) return;
      
      // Extract month and year parts from visitor's assigned_month
      const [year, monthPart] = visitor.assigned_month.split('-');
      const promoInfo = monthToPromo[monthPart];
      
      // Create promo key with month name: "Promo Pasteure Mode-Août"
      let promoBaseName = promoInfo?.promo_name || visitor.assigned_month;
      if (promoInfo && promoInfo.month_name && !promoBaseName.includes(promoInfo.month_name)) {
        promoBaseName = `${promoBaseName}-${promoInfo.month_name}`;
      }
      
      // Create unique key by promo name + year
      const promoKey = `${promoBaseName}_${year}`;
      
      if (!promoGroups[promoKey]) {
        promoGroups[promoKey] = {
          promo_name: promoBaseName,
          year: year,
          responsable: promoInfo ? promoInfo.responsable : 'Non assigné',
          nouveaux_arrivants: 0,
          nouveaux_convertis: 0,
          en_cours: 0,
          suivi_arrete: 0
        };
      }
      
      // Count NA and NC
      if (visitor.types?.includes('Nouveau Arrivant')) {
        promoGroups[promoKey].nouveaux_arrivants++;
      }
      if (visitor.types?.includes('Nouveau Converti')) {
        promoGroups[promoKey].nouveaux_convertis++;
      }
      
      // Count suivi status
      if (visitor.tracking_stopped) {
        promoGroups[promoKey].suivi_arrete++;
      } else {
        promoGroups[promoKey].en_cours++;
      }
    });

    // Convert to array and sort by year (desc) then promo name
    const stats = Object.values(promoGroups).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year; // Plus récent en premier
      return a.promo_name.localeCompare(b.promo_name);
    });
    setPromoStats(stats);
  };
  
  const calculateFormationStats = (visitorsData) => {
    const stats = {
      pcnc: 0,
      bible: 0,
      star: 0
    };
    
    visitorsData.forEach(visitor => {
      if (visitor.formation_pcnc) stats.pcnc++;
      if (visitor.formation_au_coeur_bible) stats.bible++;
      if (visitor.formation_star) stats.star++;
    });
    
    setFormationStats(stats);
  };

  // No filters needed in this dashboard

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Superviseur Promotions</h1>
          <p className="text-gray-500 mt-1">Vue d'ensemble de toutes les promotions - {user.city}</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Nombre de Responsables de Promo */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Responsables de Promo</p>
                  <h3 className="text-3xl font-bold mt-2">{responsablesPromo.length}</h3>
                  <p className="text-purple-100 text-xs mt-1">Comptes créés</p>
                </div>
                <Users className="h-12 w-12 text-purple-200 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Formation PCNC */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Formation PCNC</p>
                  <h3 className="text-3xl font-bold mt-2">{formationStats.pcnc}</h3>
                  <p className="text-blue-100 text-xs mt-1">Membres formés</p>
                </div>
                <GraduationCap className="h-12 w-12 text-blue-200 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Formation Au Cœur de la Bible */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Au Cœur de la Bible</p>
                  <h3 className="text-3xl font-bold mt-2">{formationStats.bible}</h3>
                  <p className="text-green-100 text-xs mt-1">Membres formés</p>
                </div>
                <GraduationCap className="h-12 w-12 text-green-200 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Formation STAR */}
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Formation STAR</p>
                  <h3 className="text-3xl font-bold mt-2">{formationStats.star}</h3>
                  <p className="text-amber-100 text-xs mt-1">Membres formés</p>
                </div>
                <GraduationCap className="h-12 w-12 text-amber-200 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des Promotions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Liste des Promotions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nom de la Promo</th>
                    <th className="text-center py-3 px-4">Année</th>
                    <th className="text-center py-3 px-4">Nouveaux Arrivants (NA)</th>
                    <th className="text-center py-3 px-4">Nouveaux Convertis (NC)</th>
                    <th className="text-center py-3 px-4">En Cours de Suivi</th>
                    <th className="text-center py-3 px-4">Suivi Arrêté</th>
                  </tr>
                </thead>
                <tbody>
                  {promoStats.length > 0 ? (
                    promoStats.map((stat, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{stat.promo_name}</td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                            {stat.year}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">{stat.nouveaux_arrivants}</td>
                        <td className="text-center py-3 px-4">{stat.nouveaux_convertis}</td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                            {stat.en_cours}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                            {stat.suivi_arrete}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-500">
                        Aucune promotion trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DashboardSuperviseurPromosPage;
