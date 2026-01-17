import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Users, Church, ArrowLeft, TrendingUp, UserCheck, Heart, 
  Calendar, Eye, BarChart3, Home
} from 'lucide-react';
import { toast } from 'sonner';

const BergersEglisePublicDashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ville = searchParams.get('ville') || '';
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_visitors: 0,
    total_bergeries: 0,
    total_fi: 0,
    total_stars: 0,
    total_evangelises: 0
  });
  const [bergeries, setBergeries] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!ville) {
      navigate('/select-ville-bergers');
      return;
    }
    loadData();
  }, [ville]);

  const loadData = async () => {
    try {
      // Charger les stats globales de la ville
      const [bergeriesRes, statsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/public/bergerie/list/${encodeURIComponent(ville)}`),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bergers-eglise/public/stats?ville=${encodeURIComponent(ville)}`)
      ]);

      if (bergeriesRes.ok) {
        const bergeriesData = await bergeriesRes.json();
        setBergeries(bergeriesData || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.log('Error in BergersEglisePublicDashboardPage.loadData');
      console.error('Erreur:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = {
    '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
    '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
    '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/select-ville-bergers')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Changer de ville
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Church className="h-8 w-8 text-blue-600" />
                Accès Bergers Église
              </h1>
              <p className="text-gray-500 mt-1">
                Gestion complète • <span className="text-blue-600 font-medium">{ville}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-blue-700 bg-blue-100 px-3 py-2 rounded-lg">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Accès public</span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Nouveaux Arrivants</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.total_visitors || 0}</h3>
                </div>
                <Users className="h-12 w-12 text-blue-200 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Bergeries</p>
                  <h3 className="text-3xl font-bold mt-2">{bergeries.length || 0}</h3>
                </div>
                <TrendingUp className="h-12 w-12 text-purple-200 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Familles d'Impact</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.total_fi || 0}</h3>
                </div>
                <Home className="h-12 w-12 text-green-200 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Stars</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.total_stars || 0}</h3>
                </div>
                <UserCheck className="h-12 w-12 text-orange-200 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="bergeries">Bergeries</TabsTrigger>
            <TabsTrigger value="actions">Actions Rapides</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">📖</div>
                  <div>
                    <p className="text-sm font-semibold text-indigo-800 mb-2">Ézéchiel 34:31</p>
                    <p className="text-base italic text-gray-700 leading-relaxed">
                      "Vous, mes brebis, brebis de mon pâturage, vous êtes des hommes; moi, je suis votre Dieu, dit le Seigneur, l'Éternel."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Statistiques de la ville
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span>Nouveaux arrivants (année)</span>
                      <span className="font-bold text-blue-600">{stats.total_visitors || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span>Familles d'Impact actives</span>
                      <span className="font-bold text-green-600">{stats.total_fi || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span>Stars en service</span>
                      <span className="font-bold text-orange-600">{stats.total_stars || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span>Personnes évangélisées</span>
                      <span className="font-bold text-purple-600">{stats.total_evangelises || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    Évangélisation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <div className="text-5xl font-bold text-purple-600 mb-2">
                      {stats.total_evangelises || 0}
                    </div>
                    <p className="text-gray-600">Personnes contactées cette année</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Via les Bergeries et Familles d'Impact
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bergeries Tab */}
          <TabsContent value="bergeries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Liste des Bergeries - {ville}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bergeries.length === 0 ? (
                    <p className="col-span-3 text-center text-gray-500 py-8">
                      Aucune bergerie trouvée pour cette ville
                    </p>
                  ) : (
                    bergeries.map((bergerie) => (
                      <Card 
                        key={bergerie.month}
                        className="cursor-pointer hover:shadow-lg transition-all hover:border-purple-300"
                        onClick={() => navigate(`/bergerie/dashboard?ville=${encodeURIComponent(ville)}&month=${bergerie.month}`)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-lg">Bergerie {monthNames[bergerie.month]}</p>
                              <p className="text-sm text-gray-500">
                                {bergerie.count || 0} nouveau(x) arrivant(s)
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-purple-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    className="h-24 text-lg bg-purple-600 hover:bg-purple-700"
                    onClick={() => navigate(`/bergeries`)}
                  >
                    <TrendingUp className="h-6 w-6 mr-2" />
                    Accéder aux Bergeries
                  </Button>
                  
                  <Button 
                    className="h-24 text-lg bg-orange-600 hover:bg-orange-700"
                    onClick={() => navigate(`/select-ville-stars`)}
                  >
                    <UserCheck className="h-6 w-6 mr-2" />
                    Ministère des Stars
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-24 text-lg"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/register`);
                      toast.success('Lien copié !');
                    }}
                  >
                    <Users className="h-6 w-6 mr-2" />
                    Copier lien d'inscription visiteurs
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-24 text-lg"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/recensement-stars`);
                      toast.success('Lien copié !');
                    }}
                  >
                    <Heart className="h-6 w-6 mr-2" />
                    Copier lien recensement Stars
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bouton retour accueil */}
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BergersEglisePublicDashboardPage;
