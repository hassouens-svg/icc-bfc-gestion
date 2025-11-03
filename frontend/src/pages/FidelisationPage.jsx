import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getReferentFidelisation, getAdminFidelisation, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const FidelisationPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [adminData, setAdminData] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      if (user.role === 'referent') {
        const result = await getReferentFidelisation();
        setData(result);
      } else if (user.role === 'admin' || user.role === 'promotions') {
        const result = await getAdminFidelisation();
        setAdminData(result);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    setLoading(true);
    try {
      const week = selectedWeek && selectedWeek !== 'all' ? parseInt(selectedWeek) : null;
      const month = selectedMonth && selectedMonth !== 'all' ? selectedMonth : null;
      const result = await getAdminFidelisation(week, month);
      setAdminData(result);
    } catch (error) {
      toast.error('Erreur lors du filtrage');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilter = async () => {
    setSelectedWeek('all');
    setSelectedMonth('all');
    setLoading(true);
    try {
      const result = await getAdminFidelisation();
      setAdminData(result);
    } catch (error) {
      toast.error('Erreur lors du chargement');
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

  // Referent View
  if (user.role === 'referent' && data) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900" data-testid="fidelisation-title">
              Taux de Fidélisation
            </h2>
            <p className="text-gray-500 mt-1">Votre mois: {user.assigned_month}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visiteurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.total_visitors}</div>
                <p className="text-xs text-muted-foreground">Assignés à votre mois</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux Mensuel</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">{data.monthly_average}%</div>
                <p className="text-xs text-muted-foreground">Moyenne du mois</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Semaines</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.weekly_rates.length}</div>
                <p className="text-xs text-muted-foreground">Dans le mois</p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Chart */}
          {data.weekly_rates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Taux de Fidélisation par Semaine</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.weekly_rates}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" label={{ value: 'Semaine', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Taux (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rate" fill="#6366f1" name="Taux de fidélisation (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Weekly Details */}
          <Card>
            <CardHeader>
              <CardTitle>Détails par Semaine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.weekly_rates.map((week) => (
                  <div key={week.week} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                    <div>
                      <p className="font-medium">Semaine {week.week}</p>
                      <p className="text-sm text-gray-500">
                        {week.presences} présences / {week.expected} attendues
                      </p>
                    </div>
                    <div className={`text-xl font-bold ${week.rate >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                      {week.rate}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Admin View
  if ((user.role === 'admin' || user.role === 'promotions') && adminData) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Taux de Fidélisation - Vue Globale</h2>
            <p className="text-gray-500 mt-1">Tous les référents de {user.city}</p>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Semaine</label>
                  <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les semaines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes</SelectItem>
                      {Array.from({length: 52}, (_, i) => i + 1).map(w => (
                        <SelectItem key={w} value={w.toString()}>Semaine {w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Mois</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les mois" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous</SelectItem>
                      <SelectItem value="2024-12">Décembre 2024</SelectItem>
                      <SelectItem value="2025-01">Janvier 2025</SelectItem>
                      <SelectItem value="2025-02">Février 2025</SelectItem>
                      <SelectItem value="2025-03">Mars 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end space-x-2">
                  <Button onClick={handleFilter} className="flex-1">Filtrer</Button>
                  <Button onClick={handleResetFilter} variant="outline">Réinitialiser</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referents List */}
          {adminData.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">Aucune donnée disponible</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {adminData.map((ref) => (
                <Card key={ref.referent_id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>{ref.referent_username}</CardTitle>
                        <p className="text-sm text-gray-500">Mois: {ref.assigned_month}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-600">{ref.monthly_average}%</p>
                        <p className="text-xs text-gray-500">Taux mensuel</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        <Users className="inline h-4 w-4 mr-1" />
                        {ref.total_visitors} visiteurs assignés
                      </p>
                    </div>
                    
                    {ref.weekly_rates.length > 0 && (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={ref.weekly_rates}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} name="Taux (%)" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Accès non autorisé</p>
      </div>
    </Layout>
  );
};

export default FidelisationPage;
