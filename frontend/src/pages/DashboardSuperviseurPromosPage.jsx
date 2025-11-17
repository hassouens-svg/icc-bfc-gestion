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
      // Load all users to get responsable_promo list
      const allUsers = await getReferents();
      const resposPromo = allUsers.filter(u => u.role === 'responsable_promo' && u.city === user.city);
      setResponsablesPromo(resposPromo);
      
      // Load visitors
      const visitorsData = await getVisitors();
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
    // Create a map of assigned_month to promo_name and responsable
    const monthToPromo = {};
    resposPromo.forEach(respo => {
      if (respo.assigned_month) {
        // Extract month part (MM from YYYY-MM)
        const monthPart = respo.assigned_month.split('-')[1];
        monthToPromo[monthPart] = {
          promo_name: respo.promo_name || respo.assigned_month,
          responsable: respo.username,
          assigned_month: respo.assigned_month
        };
      }
    });
    
    // Group visitors by their month
    const promoGroups = {};
    
    visitorsData.forEach(visitor => {
      if (!visitor.assigned_month) return;
      
      // Extract month part from visitor's assigned_month
      const monthPart = visitor.assigned_month.split('-')[1];
      const promoInfo = monthToPromo[monthPart];
      const promoKey = promoInfo ? promoInfo.promo_name : visitor.assigned_month;
      
      if (!promoGroups[promoKey]) {
        promoGroups[promoKey] = {
          promo_name: promoKey,
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

    const stats = Object.values(promoGroups);
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
