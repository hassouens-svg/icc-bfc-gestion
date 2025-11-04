import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStatsPasteur, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, MapPin, TrendingUp, Percent } from 'lucide-react';
import { toast } from 'sonner';

const DashboardPasteurPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !['pasteur', 'super_admin'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    loadStats();
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      const data = await getStatsPasteur();
      setStats(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
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

  const totalStats = stats?.stats_by_city?.reduce((acc, city) => {
    acc.secteurs += city.nombre_secteurs;
    acc.fi += city.nombre_fi;
    acc.membres += city.nombre_membres;
    return acc;
  }, { secteurs: 0, fi: 0, membres: 0 });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tableau de Bord - Pasteur</h2>
          <p className="text-gray-500 mt-1">Vue d'ensemble multi-villes</p>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Secteurs Totaux</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats?.secteurs || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">FI Totales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats?.fi || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membres Totaux</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats?.membres || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Stats par ville */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques par Ville</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.stats_by_city?.map((city, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-bold">{city.ville}</h3>
                    <div className="flex items-center space-x-2">
                      <Percent className="h-4 w-4 text-gray-400" />
                      <span className="text-lg font-semibold">{city.fidelisation}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Secteurs</p>
                      <p className="text-2xl font-bold">{city.nombre_secteurs}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Familles d'Impact</p>
                      <p className="text-2xl font-bold">{city.nombre_fi}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Membres</p>
                      <p className="text-2xl font-bold">{city.nombre_membres}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DashboardPasteurPage;