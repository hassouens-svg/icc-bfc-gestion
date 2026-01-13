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
      // Load all users to get berger and referent list
      const allUsers = await getReferents();
      const resposPromo = allUsers.filter(u => (u.role === 'berger' || u.role === 'referent') && u.city === user.city);
      setResponsablesPromo(resposPromo);
      
      // Load ALL visitors (including stopped ones)
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/visitors?include_stopped=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Clone response to avoid "body stream already read" error
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
    
    // Créer les 12 promos par défaut (Janvier à Décembre)
    const promoGroups = {};
    const allMonths = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    
    allMonths.forEach(monthNum => {
      const monthName = getMonthName(monthNum);
      promoGroups[monthNum] = {
        promo_name: `Promo ${monthName}`,
        month_name: monthName,
        month_num: monthNum,
        years: {},
        bergers: [] // Liste des bergers assignés
      };
    });
    
    // Assigner les bergers aux promos correspondantes
    resposPromo.forEach(respo => {
      if (respo.assigned_month) {
        const monthStr = String(respo.assigned_month);
        const monthPart = monthStr.split('-')[1];
        if (promoGroups[monthPart]) {
          // Mettre à jour le nom de la promo si défini
          if (respo.promo_name) {
            promoGroups[monthPart].promo_name = respo.promo_name;
          }
          // Ajouter le berger à la liste
          if (!promoGroups[monthPart].bergers.find(b => b.id === respo.id)) {
            promoGroups[monthPart].bergers.push({
              id: respo.id,
              name: `${respo.prenom || ''} ${respo.nom || respo.username}`.trim()
            });
          }
        }
      }
    });
    
    // Compter les visiteurs par mois
    visitorsData.forEach(visitor => {
      if (!visitor.assigned_month) return;
      
      // Extract month and year parts - assurer que c'est une string
      const monthStr = String(visitor.assigned_month);
      const [year, monthPart] = monthStr.split('-');
      
      if (!promoGroups[monthPart]) return;
      
      // Initialize year if not exists
      if (!promoGroups[monthPart].years[year]) {
        promoGroups[monthPart].years[year] = {
          nouveaux_arrivants: 0,
          nouveaux_convertis: 0,
          en_cours: 0,
          suivi_arrete: 0
        };
      }
      
      // Count stats for this year
      if (visitor.types?.includes('Nouveau Arrivant')) {
        promoGroups[monthPart].years[year].nouveaux_arrivants++;
      }
      if (visitor.types?.includes('Nouveau Converti')) {
        promoGroups[monthPart].years[year].nouveaux_convertis++;
      }
      
      if (visitor.tracking_stopped) {
        promoGroups[monthPart].years[year].suivi_arrete++;
      } else {
        promoGroups[monthPart].years[year].en_cours++;
      }
    });

    // Convert to array (already sorted by month number)
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Superviseur Bergeries</h1>
            <p className="text-gray-500 mt-1">Vue d'ensemble de toutes les bergeries - {user.city}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/bergeries?ville=' + encodeURIComponent(user.city))}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Toutes les Bergeries
            </button>
            <button
              onClick={() => navigate('/berger-presences')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Marquer Présence
            </button>
            <button
              onClick={() => navigate('/berger-presences/historique')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Vue Tableau Présence
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Nombre de Responsables de Bergerie */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Bergers</p>
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
              Liste des Promotions (12 mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4">Nom de la Promo</th>
                    <th className="text-left py-3 px-4">Bergers</th>
                    <th className="text-center py-3 px-4">Nbre Suivis</th>
                    <th className="text-center py-3 px-4">NA</th>
                    <th className="text-center py-3 px-4">NC</th>
                    <th className="text-center py-3 px-4">En Cours</th>
                    <th className="text-center py-3 px-4">Arrêtés</th>
                  </tr>
                </thead>
                <tbody>
                  {promoStats.map((stat, index) => {
                    // Sort years in descending order (most recent first)
                    const sortedYears = Object.keys(stat.years).sort((a, b) => b - a);
                    const hasData = sortedYears.length > 0;
                    
                    // Calculer le total des suivis
                    const totalSuivis = sortedYears.reduce((acc, year) => {
                      return acc + (stat.years[year].en_cours || 0) + (stat.years[year].suivi_arrete || 0);
                    }, 0);
                    
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          <div className="font-semibold text-indigo-600">{stat.promo_name}</div>
                          <div className="text-xs text-gray-400">{stat.month_name}</div>
                        </td>
                        
                        {/* Bergers */}
                        <td className="py-3 px-4">
                          {stat.bergers && stat.bergers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {stat.bergers.map((berger, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                  {berger.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Non assigné</span>
                          )}
                        </td>
                        
                        {/* Total Suivis */}
                        <td className="text-center py-3 px-4">
                          <span className="font-bold text-lg">{totalSuivis || '-'}</span>
                        </td>
                        
                        {/* Nouveaux Arrivants with years */}
                        <td className="text-center py-3 px-4">
                          {hasData ? (
                            <div className="flex flex-col gap-1">
                              {sortedYears.map(year => (
                                <div key={year} className="text-sm">
                                  <span className="text-xs text-gray-500">{year}:</span>{' '}
                                  <span className="font-semibold">{stat.years[year].nouveaux_arrivants}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* Nouveaux Convertis with years */}
                        <td className="text-center py-3 px-4">
                          {hasData ? (
                            <div className="flex flex-col gap-1">
                              {sortedYears.map(year => (
                                <div key={year} className="text-sm">
                                  <span className="text-xs text-gray-500">{year}:</span>{' '}
                                  <span className="font-semibold">{stat.years[year].nouveaux_convertis}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* En Cours with years */}
                        <td className="text-center py-3 px-4">
                          {hasData ? (
                            <div className="flex flex-col gap-1">
                              {sortedYears.map(year => (
                                <div key={year} className="text-sm">
                                  <span className="text-xs text-gray-500">{year}:</span>{' '}
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                    {stat.years[year].en_cours}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* Suivi Arrêté with years */}
                        <td className="text-center py-3 px-4">
                          {hasData ? (
                            <div className="flex flex-col gap-1">
                              {sortedYears.map(year => (
                                <div key={year} className="text-sm">
                                  <span className="text-xs text-gray-500">{year}:</span>{' '}
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                    {stat.years[year].suivi_arrete}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
