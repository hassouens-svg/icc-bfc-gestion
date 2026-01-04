import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PublicBergerieLayout from '../components/PublicBergerieLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Users, UserPlus, TrendingUp, Download, BarChart3, Calendar, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '../components/ui/checkbox';

// Fonction pour obtenir le nom de la bergerie avec le mois
const getBergerieName = (monthNum) => {
  if (!monthNum) return 'Ma Bergerie';
  
  const monthNames = {
    '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
    '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
    '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
  };
  
  return `Bergerie ${monthNames[monthNum] || monthNum}`;
};

const PublicBergerieDashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const ville = searchParams.get('ville') || '';
  const monthNum = searchParams.get('month') || '01';
  
  // Get guest context from localStorage
  const guestContextStr = localStorage.getItem('guest_bergerie_context');
  const guestContext = guestContextStr ? JSON.parse(guestContextStr) : null;
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if no guest context and no params
    if (!guestContext && (!ville || !monthNum)) {
      navigate('/bergeries');
      return;
    }
    
    // Create guest context if needed
    if (!guestContext && ville && monthNum) {
      const monthNames = {
        '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
        '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
        '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
      };
      
      localStorage.setItem('guest_bergerie_context', JSON.stringify({
        ville,
        month_num: monthNum,
        month_name: monthNames[monthNum] || monthNum,
        nom: getBergerieName(monthNum)
      }));
      localStorage.setItem('selected_department', 'promotions');
    }
    
    loadStats();
  }, [ville, monthNum]);

  const loadStats = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/reproduction/${encodeURIComponent(ville || guestContext?.ville)}/${monthNum || guestContext?.month_num}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const visitorsData = data.visitors || [];
        const totalVisitors = visitorsData.filter(v => !v.tracking_stopped).length;
        const formationPcnc = visitorsData.filter(v => v.formation_pcnc).length;
        const formationBible = visitorsData.filter(v => v.formation_au_coeur_bible).length;
        const formationStar = visitorsData.filter(v => v.formation_star).length;
        
        const byType = {};
        visitorsData.forEach(v => {
          const types = v.types || [v.visitor_type || 'Non défini'];
          types.forEach(type => {
            byType[type] = (byType[type] || 0) + 1;
          });
        });
        
        const byChannel = {};
        visitorsData.forEach(v => {
          const channel = v.arrival_channel || 'Non défini';
          byChannel[channel] = (byChannel[channel] || 0) + 1;
        });

        const byMonth = {};
        visitorsData.forEach(v => {
          if (v.visit_date) {
            const monthKey = v.visit_date.substring(0, 7);
            byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
          }
        });
        
        setStats({
          total_visitors: totalVisitors,
          total_referents: data.total_bergers || 1,
          formation_pcnc: formationPcnc,
          formation_au_coeur_bible: formationBible,
          formation_star: formationStar,
          by_type: Object.entries(byType).map(([_id, count]) => ({ _id, count })),
          by_channel: Object.entries(byChannel).map(([_id, count]) => ({ _id, count })),
          by_month: Object.entries(byMonth).map(([_id, count]) => ({ _id, count })).sort((a, b) => a._id.localeCompare(b._id))
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const currentGuestContext = guestContext || {
    ville,
    month_num: monthNum,
    month_name: getBergerieName(monthNum).replace('Bergerie ', ''),
    nom: getBergerieName(monthNum)
  };

  if (loading) {
    return (
      <PublicBergerieLayout guestContext={currentGuestContext}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PublicBergerieLayout>
    );
  }

  return (
    <PublicBergerieLayout guestContext={currentGuestContext}>
      <div className="space-y-6">
        {/* Navigation rapide pour mobile */}
        <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 md:hidden bg-white sticky top-0 z-50 pt-2 border-b">
          <Button 
            variant="default" 
            size="sm"
            className="flex-shrink-0 bg-indigo-600"
          >
            Dashboard
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-shrink-0"
            onClick={() => navigate(`/bergerie/visitors?ville=${encodeURIComponent(ville)}&month=${monthNum}`)}
          >
            Nouveaux
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-shrink-0"
            onClick={() => navigate(`/bergerie/visitors-table?ville=${encodeURIComponent(ville)}&month=${monthNum}`)}
          >
            Vue Tableau
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-shrink-0"
            onClick={() => navigate(`/bergerie/suivi-disciples?ville=${encodeURIComponent(ville)}&month=${monthNum}`)}
          >
            Disciples
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-shrink-0 bg-green-50 text-green-700 border-green-200"
            onClick={() => navigate(`/bergerie/reproduction?ville=${encodeURIComponent(ville)}&month=${monthNum}`)}
          >
            Reproduction
          </Button>
        </div>

        {/* Verset biblique pour les Bergers */}
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📖</div>
              <div>
                <p className="text-sm font-semibold text-purple-800 mb-2">Jérémie 3:15</p>
                <p className="text-base italic text-gray-700 leading-relaxed">
                  "Je vous donnerai des bergers selon mon cœur, qui vous paîtront avec intelligence et avec sagesse."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">
                Dashboard {getBergerieName(monthNum)}
              </h2>
            </div>
            <p className="text-gray-500 mt-1">{ville} • Vue d'ensemble de l'activité</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => navigate(`/bergerie/marquer-presences?ville=${encodeURIComponent(ville)}&month=${monthNum}`)} 
              className="bg-green-600 hover:bg-green-700"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Marquer les Présences
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Nouveaux Arrivants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-visitors">
                {stats?.total_visitors || 0}
              </div>
              <p className="text-xs text-muted-foreground">Nouveaux Arrivants actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bergers</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-referents">
                {stats?.total_referents || 0}
              </div>
              <p className="text-xs text-muted-foreground">Membres de l'équipe</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canaux</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-channels">
                {stats?.by_channel?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Sources d'arrivée</p>
            </CardContent>
          </Card>
        </div>

        {/* KPIs Formations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              KPIs Formations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-blue-50">
                <p className="text-sm text-gray-600">Formation PCNC</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.formation_pcnc || 0}</p>
                <p className="text-xs text-gray-500 mt-1">personnes formées</p>
              </div>
              <div className="p-4 border rounded-lg bg-green-50">
                <p className="text-sm text-gray-600">Au Cœur de la Bible</p>
                <p className="text-3xl font-bold text-green-600">{stats?.formation_au_coeur_bible || 0}</p>
                <p className="text-xs text-gray-500 mt-1">personnes formées</p>
              </div>
              <div className="p-4 border rounded-lg bg-purple-50">
                <p className="text-sm text-gray-600">Formation STAR</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.formation_star || 0}</p>
                <p className="text-xs text-gray-500 mt-1">personnes devenues stars</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20"
                onClick={() => navigate(`/bergerie/visitors?ville=${encodeURIComponent(ville)}&month=${monthNum}`)}
                data-testid="quick-action-visitors"
              >
                <Users className="h-6 w-6 mr-2" />
                Voir les nouveaux arrivants
              </Button>
              <Button 
                variant="outline" 
                className="h-20"
                onClick={() => navigate(`/bergerie/visitors-table?ville=${encodeURIComponent(ville)}&month=${monthNum}`)}
              >
                <BarChart3 className="h-6 w-6 mr-2" />
                Vue Tableau
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity by Month */}
        {stats?.by_month && stats.by_month.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Nouveaux Arrivants par mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.by_month.slice(-6).reverse().map((item) => (
                  <div key={item._id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium">{item._id}</span>
                    <span className="text-gray-600">{item.count} nouveaux arrivants</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* By Type */}
        {stats?.by_type && stats.by_type.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Par type de nouveaux arrivants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.by_type.map((item) => (
                  <div key={item._id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium">{item._id}</span>
                    <span className="text-gray-600">{item.count} personnes</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PublicBergerieLayout>
  );
};

export default PublicBergerieDashboardPage;
