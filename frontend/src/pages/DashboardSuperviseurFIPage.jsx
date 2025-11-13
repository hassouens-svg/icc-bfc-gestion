import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStatsSuperviseurFI, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, TrendingUp, MapPin, Percent, UserCheck, UserX, UserPlus, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getSecteurs, getFamillesImpact, getMembresFI, getPresencesFI } from '../utils/api';
import { toast } from 'sonner';

const DashboardSuperviseurFIPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !['superviseur_fi', 'admin', 'super_admin', 'pasteur', 'responsable_eglise'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    loadStats();
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      // Pour super_admin et pasteur, utiliser la ville sélectionnée
      const selectedCity = localStorage.getItem('selected_city_view');
      const ville = ['super_admin', 'pasteur'].includes(user.role) && selectedCity ? selectedCity : user.city;
      
      const data = await getStatsSuperviseurFI(ville);
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

  const evolutionData = stats?.evolution_membres ? 
    Object.entries(stats.evolution_membres).map(([month, count]) => ({
      mois: month,
      membres: count
    })) : [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tableau de Bord - Superviseur FI</h2>
          <p className="text-gray-500 mt-1">
            {['super_admin', 'pasteur'].includes(user.role) && localStorage.getItem('selected_city_view') 
              ? localStorage.getItem('selected_city_view') 
              : user.city}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Secteurs</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.nombre_secteurs || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Familles d'Impact</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.nombre_fi_total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membres Totaux</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.nombre_membres_total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fidélisation Globale</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.fidelisation_globale || 0}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution du nombre de membres</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="membres" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Secteurs Details */}
        <Card>
          <CardHeader>
            <CardTitle>Détails par Secteur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.secteurs_details?.map((secteur, index) => (
                <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{secteur.secteur.nom}</p>
                    <p className="text-sm text-gray-500">{secteur.secteur.ville}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{secteur.nombre_fi}</p>
                    <p className="text-sm text-gray-500">Familles d'Impact</p>
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

export default DashboardSuperviseurFIPage;