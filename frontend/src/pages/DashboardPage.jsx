import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStats, getUser, exportExcel } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, UserPlus, TrendingUp, Download } from 'lucide-react';
import { toast } from 'sonner';

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadStats();
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportExcel();
      toast.success('Export Excel réussi!');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">Tableau de bord</h2>
            <p className="text-gray-500 mt-1">Vue d'ensemble de votre activité</p>
          </div>
          {(user?.role === 'admin' || user?.role === 'promotions') && (
            <Button onClick={handleExport} data-testid="export-excel-button">
              <Download className="h-4 w-4 mr-2" />
              Exporter Excel
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visiteurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-visitors">
                {stats?.total_visitors || 0}
              </div>
              <p className="text-xs text-muted-foreground">Visiteurs actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Référents</CardTitle>
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
                onClick={() => navigate('/visitors')}
                data-testid="quick-action-visitors"
              >
                <Users className="h-6 w-6 mr-2" />
                Voir les visiteurs
              </Button>
              {(user?.role === 'admin' || user?.role === 'promotions') && (
                <>
                  <Button 
                    variant="outline" 
                    className="h-20"
                    onClick={() => navigate('/referents')}
                    data-testid="quick-action-referents"
                  >
                    <UserPlus className="h-6 w-6 mr-2" />
                    Gérer les référents
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20"
                    onClick={() => navigate('/analytics')}
                    data-testid="quick-action-analytics"
                  >
                    <BarChart3 className="h-6 w-6 mr-2" />
                    Voir les analytics
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity by Month */}
        {stats?.by_month && stats.by_month.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Visiteurs par mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.by_month.slice(-6).reverse().map((item) => (
                  <div key={item._id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium">{item._id}</span>
                    <span className="text-gray-600">{item.count} visiteurs</span>
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
              <CardTitle>Par type de visiteur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.by_type.map((item) => (
                  <div key={item._id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium">{item._id}</span>
                    <span className="text-gray-600">{item.count} visiteurs</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
