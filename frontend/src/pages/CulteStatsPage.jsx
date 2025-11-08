import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  createCulteStats, 
  getCulteStats, 
  getCulteStatsSummary,
  updateCulteStats,
  deleteCulteStats,
  getUser 
} from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Calendar,
  Users,
  Star,
  Plus,
  Edit2,
  Trash2,
  Filter,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const CulteStatsPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState([]);
  const [summary, setSummary] = useState(null);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState('');
  const [culte1Adultes, setCulte1Adultes] = useState(0);
  const [culte1Enfants, setCulte1Enfants] = useState(0);
  const [culte1Stars, setCulte1Stars] = useState(0);
  const [culte2Adultes, setCulte2Adultes] = useState(0);
  const [culte2Enfants, setCulte2Enfants] = useState(0);
  const [culte2Stars, setCulte2Stars] = useState(0);
  const [ejpAdultes, setEjpAdultes] = useState(0);
  const [ejpEnfants, setEjpEnfants] = useState(0);
  const [ejpStars, setEjpStars] = useState(0);
  
  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Edit mode
  const [editingId, setEditingId] = useState(null);
  const [editAdultes, setEditAdultes] = useState(0);
  const [editEnfants, setEditEnfants] = useState(0);
  const [editStars, setEditStars] = useState(0);

  useEffect(() => {
    if (!user || !['accueil', 'super_admin'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    // Charger les données seulement si nécessaire
    const timer = setTimeout(() => {
      loadData();
    }, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, summaryData] = await Promise.all([
        getCulteStats(),
        getCulteStatsSummary()
      ]);
      setStats(statsData || []);
      setSummary(summaryData || { summary: [], global_stats: { total_dimanches: 0, avg_fideles_per_dimanche: 0, avg_stars_per_dimanche: 0, avg_total_per_dimanche: 0 } });
    } catch (error) {
      console.error('Error loading data:', error);
      // Ne pas afficher d'erreur si c'est juste qu'il n'y a pas encore de données
      setStats([]);
      setSummary({ summary: [], global_stats: { total_dimanches: 0, avg_fideles_per_dimanche: 0, avg_stars_per_dimanche: 0, avg_total_per_dimanche: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast.error('Veuillez sélectionner une date');
      return;
    }
    
    setLoading(true);
    try {
      // Create stats for each culte
      const promises = [];
      
      const culte1Total = parseInt(culte1Adultes) + parseInt(culte1Enfants);
      if (culte1Total > 0 || culte1Stars > 0) {
        promises.push(createCulteStats({
          date: selectedDate,
          ville: user.city,
          type_culte: 'Culte 1',
          nombre_fideles: culte1Total,
          nombre_adultes: parseInt(culte1Adultes),
          nombre_enfants: parseInt(culte1Enfants),
          nombre_stars: parseInt(culte1Stars)
        }));
      }
      
      const culte2Total = parseInt(culte2Adultes) + parseInt(culte2Enfants);
      if (culte2Total > 0 || culte2Stars > 0) {
        promises.push(createCulteStats({
          date: selectedDate,
          ville: user.city,
          type_culte: 'Culte 2',
          nombre_fideles: culte2Total,
          nombre_adultes: parseInt(culte2Adultes),
          nombre_enfants: parseInt(culte2Enfants),
          nombre_stars: parseInt(culte2Stars)
        }));
      }
      
      const ejpTotal = parseInt(ejpAdultes) + parseInt(ejpEnfants);
      if (ejpTotal > 0 || ejpStars > 0) {
        promises.push(createCulteStats({
          date: selectedDate,
          ville: user.city,
          type_culte: 'EJP',
          nombre_fideles: ejpTotal,
          nombre_adultes: parseInt(ejpAdultes),
          nombre_enfants: parseInt(ejpEnfants),
          nombre_stars: parseInt(ejpStars)
        }));
      }
      
      await Promise.all(promises);
      
      toast.success('Statistiques enregistrées avec succès!');
      
      // Reset form
      setSelectedDate('');
      setCulte1Adultes(0);
      setCulte1Enfants(0);
      setCulte1Stars(0);
      setCulte2Adultes(0);
      setCulte2Enfants(0);
      setCulte2Stars(0);
      setEjpAdultes(0);
      setEjpEnfants(0);
      setEjpStars(0);
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error saving stats:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (statId, adultes, enfants, stars) => {
    setLoading(true);
    try {
      const totalFideles = parseInt(adultes) + parseInt(enfants);
      await updateCulteStats(statId, {
        nombre_fideles: totalFideles,
        nombre_adultes: parseInt(adultes),
        nombre_enfants: parseInt(enfants),
        nombre_stars: parseInt(stars)
      });
      
      toast.success('Statistique mise à jour!');
      setEditingId(null);
      await loadData();
    } catch (error) {
      console.error('Error updating stat:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (statId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette statistique?')) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteCulteStats(statId);
      toast.success('Statistique supprimée!');
      await loadData();
    } catch (error) {
      console.error('Error deleting stat:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  // Filter stats for table
  const filteredStats = stats.filter(stat => {
    if (filterDate && stat.date !== filterDate) return false;
    if (filterType !== 'all' && stat.type_culte !== filterType) return false;
    return true;
  });

  // Group stats by date for summary table
  const statsByDate = {};
  filteredStats.forEach(stat => {
    if (!statsByDate[stat.date]) {
      statsByDate[stat.date] = {
        date: stat.date,
        culte_1: { fideles: 0, stars: 0 },
        culte_2: { fideles: 0, stars: 0 },
        ejp: { fideles: 0, stars: 0 },
        total_fideles: 0,
        total_stars: 0,
        total: 0
      };
    }
    
    const culteKey = stat.type_culte === 'Culte 1' ? 'culte_1' : 
                     stat.type_culte === 'Culte 2' ? 'culte_2' : 'ejp';
    
    statsByDate[stat.date][culteKey].fideles = stat.nombre_fideles;
    statsByDate[stat.date][culteKey].stars = stat.nombre_stars;
    statsByDate[stat.date].total_fideles += stat.nombre_fideles;
    statsByDate[stat.date].total_stars += stat.nombre_stars;
    statsByDate[stat.date].total = statsByDate[stat.date].total_fideles + statsByDate[stat.date].total_stars;
  });

  const summaryTableData = Object.values(statsByDate).sort((a, b) => b.date.localeCompare(a.date));

  if (loading && !stats.length) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
          <p className="text-sm text-gray-400">Cela peut prendre quelques secondes</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Statistiques des Cultes</h2>
            <p className="text-gray-500 mt-1">
              Ville: {user?.city} | Accueil & Intégration
            </p>
          </div>
        </div>

        {/* Global Summary KPIs */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Dimanches</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.global_stats.total_dimanches}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moy. Fidèles/Dimanche</CardTitle>
                <Users className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">
                  {summary.global_stats.avg_fideles_per_dimanche}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moy. STARS/Dimanche</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {summary.global_stats.avg_stars_per_dimanche}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moy. Total/Dimanche</CardTitle>
                <BarChart3 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {summary.global_stats.avg_total_per_dimanche}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Form to Add New Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Ajouter les Statistiques d'un Dimanche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date du Dimanche</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Culte 1 */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-indigo-600">Culte 1</h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Adultes</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded px-3 py-2"
                      value={culte1Adultes}
                      onChange={(e) => setCulte1Adultes(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enfants</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded px-3 py-2"
                      value={culte1Enfants}
                      onChange={(e) => setCulte1Enfants(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">STARS</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded px-3 py-2"
                      value={culte1Stars}
                      onChange={(e) => setCulte1Stars(e.target.value)}
                    />
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">Fidèles: {parseInt(culte1Adultes || 0) + parseInt(culte1Enfants || 0)}</p>
                    <p className="text-sm font-medium text-indigo-600">Total: {parseInt(culte1Adultes || 0) + parseInt(culte1Enfants || 0) + parseInt(culte1Stars || 0)}</p>
                  </div>
                </div>

                {/* Culte 2 */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-purple-600">Culte 2</h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Adultes</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded px-3 py-2"
                      value={culte2Adultes}
                      onChange={(e) => setCulte2Adultes(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enfants</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded px-3 py-2"
                      value={culte2Enfants}
                      onChange={(e) => setCulte2Enfants(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">STARS</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded px-3 py-2"
                      value={culte2Stars}
                      onChange={(e) => setCulte2Stars(e.target.value)}
                    />
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">Fidèles: {parseInt(culte2Adultes || 0) + parseInt(culte2Enfants || 0)}</p>
                    <p className="text-sm font-medium text-purple-600">Total: {parseInt(culte2Adultes || 0) + parseInt(culte2Enfants || 0) + parseInt(culte2Stars || 0)}</p>
                  </div>
                </div>

                {/* EJP */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-green-600">Culte EJP</h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Adultes</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded px-3 py-2"
                      value={ejpAdultes}
                      onChange={(e) => setEjpAdultes(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enfants</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded px-3 py-2"
                      value={ejpEnfants}
                      onChange={(e) => setEjpEnfants(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">STARS</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded px-3 py-2"
                      value={ejpStars}
                      onChange={(e) => setEjpStars(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Total: {parseInt(ejpFideles) + parseInt(ejpStars)}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Total Général du Dimanche: {
                    parseInt(culte1Fideles) + parseInt(culte1Stars) +
                    parseInt(culte2Fideles) + parseInt(culte2Stars) +
                    parseInt(ejpFideles) + parseInt(ejpStars)
                  }
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Enregistrement...' : 'Enregistrer les Statistiques'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtrer les Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de Culte</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les cultes</SelectItem>
                    <SelectItem value="Culte 1">Culte 1</SelectItem>
                    <SelectItem value="Culte 2">Culte 2</SelectItem>
                    <SelectItem value="EJP">EJP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setFilterDate('');
                setFilterType('all');
              }}
            >
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>

        {/* Detailed Stats Table with Edit/Delete */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Toutes les Statistiques (Détaillées)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Type de Culte</th>
                    <th className="text-center py-3 px-4">Fidèles</th>
                    <th className="text-center py-3 px-4">STARS</th>
                    <th className="text-center py-3 px-4">Total</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStats.map((stat) => {
                    const isEditing = editingId === stat.id;
                    
                    return (
                      <tr key={stat.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{stat.date}</td>
                        <td className="py-3 px-4 font-medium">{stat.type_culte}</td>
                        <td className="text-center py-3 px-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editFideles}
                              onChange={(e) => setEditFideles(e.target.value)}
                              className="w-20 px-2 py-1 border rounded text-center"
                              min="0"
                            />
                          ) : (
                            stat.nombre_fideles
                          )}
                        </td>
                        <td className="text-center py-3 px-4 text-yellow-600">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editStars}
                              onChange={(e) => setEditStars(e.target.value)}
                              className="w-20 px-2 py-1 border rounded text-center"
                              min="0"
                            />
                          ) : (
                            stat.nombre_stars
                          )}
                        </td>
                        <td className="text-center py-3 px-4 font-bold text-green-600">
                          {isEditing ? (
                            parseInt(editFideles || 0) + parseInt(editStars || 0)
                          ) : (
                            stat.nombre_fideles + stat.nombre_stars
                          )}
                        </td>
                        <td className="text-right py-3 px-4">
                          {isEditing ? (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => {
                                  handleUpdate(stat.id, editFideles, editStars);
                                }}
                                disabled={loading}
                              >
                                Enregistrer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(null)}
                                disabled={loading}
                              >
                                Annuler
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(stat.id);
                                  setEditFideles(stat.nombre_fideles);
                                  setEditStars(stat.nombre_stars);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(stat.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredStats.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Aucune statistique trouvée
              </p>
            )}
          </CardContent>
        </Card>

        {/* Summary Table by Date */}
        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif par Dimanche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-center py-3 px-4">Culte 1</th>
                    <th className="text-center py-3 px-4">Culte 2</th>
                    <th className="text-center py-3 px-4">EJP</th>
                    <th className="text-center py-3 px-4">Total Fidèles</th>
                    <th className="text-center py-3 px-4">Total STARS</th>
                    <th className="text-center py-3 px-4">Total Général</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryTableData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{row.date}</td>
                      <td className="text-center py-3 px-4">
                        <div className="text-sm">
                          <div>F: {row.culte_1.fideles}</div>
                          <div className="text-yellow-600">S: {row.culte_1.stars}</div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="text-sm">
                          <div>F: {row.culte_2.fideles}</div>
                          <div className="text-yellow-600">S: {row.culte_2.stars}</div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="text-sm">
                          <div>F: {row.ejp.fideles}</div>
                          <div className="text-yellow-600">S: {row.ejp.stars}</div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 font-bold text-indigo-600">
                        {row.total_fideles}
                      </td>
                      <td className="text-center py-3 px-4 font-bold text-yellow-600">
                        {row.total_stars}
                      </td>
                      <td className="text-center py-3 px-4 font-bold text-green-600">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {summaryTableData.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Aucune statistique trouvée
              </p>
            )}
          </CardContent>
        </Card>

        {/* Evolution Chart */}
        {summary && summary.summary.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Cultes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={summary.summary.slice(0, 20).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total_fideles" stroke="#6366f1" strokeWidth={2} name="Fidèles" />
                  <Line type="monotone" dataKey="total_stars" stroke="#eab308" strokeWidth={2} name="STARS" />
                  <Line type="monotone" dataKey="total_general" stroke="#10b981" strokeWidth={2} name="Total" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default CulteStatsPage;
