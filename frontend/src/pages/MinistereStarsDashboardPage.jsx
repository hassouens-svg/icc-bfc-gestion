import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import LayoutMinistereStars from '../components/LayoutMinistereStars';
import { getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Users, TrendingUp, Star, Calendar, Eye, UserCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useSelectedCity } from '../contexts/SelectedCityContext';

const MinistereStarsDashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { ville: villeParam } = useParams(); // Support pour /ministere-stars/:ville
  const user = getUser();
  const { selectedCity } = useSelectedCity();
  const [stats, setStats] = useState(null);
  const [multiDeptStars, setMultiDeptStars] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Ville depuis URL param, query param ou contexte
  const villeFromUrl = villeParam || searchParams.get('ville');
  const isPublicMode = !!villeFromUrl && !user;
  
  // États pour le dialog "Stars en service"
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [showWeekDetailDialog, setShowWeekDetailDialog] = useState(false);
  const [serviceOverview, setServiceOverview] = useState([]);
  const [selectedWeekDetail, setSelectedWeekDetail] = useState(null);
  const [weekStats, setWeekStats] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const departements = [
    'MLA',
    'Accueil',
    'Soins pastoraux',
    'Régie',
    'Sono',
    'Sainte cène',
    'Impact junior',
    'Navette',
    'Prière',
    'Protocole',
    'Sécurité',
    'Communication',
    'Coordination',
    'Ministère des promotions',
    'Formation',
    'Finance',
    'Ministère des femmes (bureau)',
    'Ministère des hommes (bureau)',
    'Impact santé',
    'Évènementiel/Restauration',
    'Modération'
  ];

  const typesCulte = ['Culte 1', 'Culte 2', 'EJP', 'Tous les cultes', 'Événements spéciaux'];
  const years = [2025, 2026, 2027, 2028, 2029, 2030];

  // Permissions: pasteur/superadmin = tout, responsable_eglise = sa ville, respo_departement = tout, star = lecture
  // En mode public, on autorise l'accès en lecture seule
  const canView = isPublicMode || (user?.role && ['super_admin', 'pasteur', 'responsable_eglise', 'respo_departement', 'star'].includes(user.role));

  // Déterminer la ville effective pour le filtrage
  const getEffectiveCity = () => {
    // Mode public : ville depuis URL
    if (isPublicMode) {
      return villeFromUrl;
    }
    if (user?.role === 'responsable_eglise') {
      return user.city;
    }
    if (['super_admin', 'pasteur', 'respo_departement'].includes(user?.role)) {
      return selectedCity && selectedCity !== 'all' ? selectedCity : null;
    }
    return null;
  };

  useEffect(() => {
    if (!canView) {
      navigate('/');
      return;
    }
    loadData();
  }, [selectedCity, villeFromUrl]);

  const loadData = async () => {
    try {
      const effectiveCity = getEffectiveCity();
      const villeParam = effectiveCity ? `?ville=${encodeURIComponent(effectiveCity)}` : '';
      
      // En mode public, utiliser les endpoints publics
      const headers = isPublicMode ? {} : { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      const baseUrl = isPublicMode ? '/api/stars/public' : '/api/stars';
      
      const [statsRes, multiRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}${baseUrl}/stats/overview${villeParam}`, { headers }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}${baseUrl}/multi-departements${villeParam}`, { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (multiRes.ok) setMultiDeptStars(await multiRes.json());
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const openServiceDialog = async () => {
    setShowServiceDialog(true);
    loadServiceOverview(selectedYear);
  };

  const loadServiceOverview = async (year) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/service-overview/${year}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await response.json();
      setServiceOverview(data || []);
    } catch (error) {
      console.error('Error loading service overview:', error);
      setServiceOverview([]);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(parseInt(year));
    loadServiceOverview(parseInt(year));
  };

  const openWeekDetail = async (week) => {
    setSelectedWeekDetail(week);
    setShowWeekDetailDialog(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/service-stats/${week}/${selectedYear}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await response.json();
      setWeekStats(data);
    } catch (error) {
      console.error('Error loading week stats:', error);
      setWeekStats(null);
    }
  };

  if (loading) {
    return (
      <LayoutMinistereStars>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </LayoutMinistereStars>
    );
  }

  // Affichage de la ville effective
  const effectiveCity = getEffectiveCity();
  const cityDisplay = user?.role === 'responsable_eglise' ? user.city : (selectedCity && selectedCity !== 'all' ? selectedCity : null);

  return (
    <LayoutMinistereStars>
      <div className="space-y-6 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="h-8 w-8 text-yellow-500" />
              Ministère des STARS
            </h1>
            <p className="text-gray-500 mt-1">
              Dashboard de suivi des stars
              {cityDisplay && (
                <span className="ml-2 text-indigo-600 font-medium">({cityDisplay})</span>
              )}
              {user?.role === 'star' && (
                <span className="ml-2 text-amber-600 flex items-center gap-1 inline-flex">
                  <Eye className="h-4 w-4" /> Mode lecture seule
                </span>
              )}
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Total Stars</p>
                  <h3 className="text-3xl font-bold mt-2">{stats?.total || 0}</h3>
                </div>
                <Users className="h-12 w-12 text-orange-200 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Stars Actives</p>
                  <h3 className="text-3xl font-bold mt-2">{stats?.actifs || 0}</h3>
                </div>
                <TrendingUp className="h-12 w-12 text-green-200 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Non Actives</p>
                  <h3 className="text-3xl font-bold mt-2">{stats?.non_actifs || 0}</h3>
                </div>
                <Calendar className="h-12 w-12 text-red-200 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Bouton Stars en service */}
          <Card 
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-all"
            onClick={openServiceDialog}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Stars en service</p>
                  <h3 className="text-lg font-bold mt-2">📅 Voir par semaine</h3>
                </div>
                <UserCheck className="h-12 w-12 text-purple-200 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lien recensement */}
        <Card>
          <CardHeader>
            <CardTitle>🔗 Lien de Recensement Public</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Partagez ce lien pour permettre aux stars de s'enregistrer</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/recensement-stars`}
                  className="flex-1 px-3 py-2 border rounded-md bg-gray-50"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/recensement-stars`);
                    toast.success('Lien copié !');
                  }}
                >
                  Copier
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des départements */}
        <Card>
          <CardHeader>
            <CardTitle>📂 Départements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {departements.map((dept, idx) => (
                <Button
                  key={idx}
                  onClick={() => navigate(`/ministere-stars/departement/${encodeURIComponent(dept)}`)}
                  variant="outline"
                  className="h-auto py-4 justify-between"
                >
                  <span className="font-medium">{dept}</span>
                  <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    {stats?.par_departement?.[dept] || 0}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stars multi-départements */}
        <Card>
          <CardHeader>
            <CardTitle>👥 Stars servant dans plusieurs ministères</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Prénom</th>
                    <th className="text-left py-2 px-4">Nom</th>
                    <th className="text-left py-2 px-4">Départements</th>
                    <th className="text-center py-2 px-4">Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  {multiDeptStars.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-500">
                        Aucune star dans plusieurs ministères
                      </td>
                    </tr>
                  ) : (
                    multiDeptStars.map((star, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{star.prenom}</td>
                        <td className="py-3 px-4">{star.nom}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {star.departements.map((dept, i) => (
                              <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {dept}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="font-bold text-orange-600">{star.departements.length}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog - Sélection des semaines (Stars en service) avec année */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-600" />
                📅 Stars en service par semaine
              </span>
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 mb-4">
              Sélectionnez une semaine pour voir les KPIs de stars en service (tous départements confondus) :
            </p>
            <div className="grid grid-cols-8 md:grid-cols-13 gap-2">
              {Array.from({ length: 52 }, (_, i) => i + 1).map(week => {
                const weekData = serviceOverview.find(w => w.semaine === week);
                const hasPlanning = weekData?.has_planning;
                const totalStars = weekData?.total_stars_en_service || 0;
                
                return (
                  <div key={week} className="relative">
                    <Button
                      onClick={() => openWeekDetail(week)}
                      variant={hasPlanning ? "default" : "outline"}
                      className={`w-12 h-12 text-sm flex flex-col p-0 ${
                        hasPlanning ? 'bg-purple-600 hover:bg-purple-700' : ''
                      }`}
                      title={`Semaine ${week}: ${totalStars} stars en service`}
                    >
                      <span className="text-xs font-bold">{week}</span>
                      {hasPlanning && (
                        <span className="text-[10px] opacity-75">{totalStars}</span>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 bg-purple-600 rounded"></span> 
                Planning existant (nombre = stars en service)
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border rounded"></span> 
                Pas de planning
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Détail d'une semaine */}
      <Dialog open={showWeekDetailDialog} onOpenChange={setShowWeekDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              📊 Stars en service - Semaine {selectedWeekDetail} / {selectedYear}
            </DialogTitle>
          </DialogHeader>
          
          {weekStats ? (
            <div className="space-y-4">
              {/* KPI Total */}
              <Card className="bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-700 font-medium">Total Stars en service cette semaine</p>
                      <p className="text-4xl font-bold text-purple-800 mt-1">
                        {weekStats.total_stars_en_service}
                      </p>
                    </div>
                    <UserCheck className="h-16 w-16 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              {/* KPIs par type de culte - COMPACTS */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">📊 Stars par type de culte</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {typesCulte.map(type => {
                      const typeData = weekStats.par_type_culte?.[type] || { count: 0, membres: [] };
                      return (
                        <div key={type} className="bg-gray-50 border rounded px-3 py-2 text-center min-w-[90px]">
                          <p className="text-[10px] text-gray-600 font-medium truncate" title={type}>{type}</p>
                          <p className="text-xl font-bold text-purple-700">{typeData.count}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Départements avec planning */}
              {weekStats.departements_avec_planning?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">📂 Départements avec planning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {weekStats.departements_avec_planning.map((dept, idx) => (
                        <span 
                          key={idx} 
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-blue-200"
                          onClick={() => {
                            setShowWeekDetailDialog(false);
                            setShowServiceDialog(false);
                            navigate(`/ministere-stars/departement/${encodeURIComponent(dept)}`);
                          }}
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Liste des membres en service */}
              {weekStats.membres_en_service?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">👥 Membres en service ({weekStats.membres_en_service.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {weekStats.membres_en_service.sort().map((nom, idx) => (
                        <span key={idx} className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                          {nom}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {weekStats.total_stars_en_service === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune star planifiée pour cette semaine</p>
                  <p className="text-sm mt-2">Créez des plannings dans les différents départements</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowWeekDetailDialog(false)} className="flex-1">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </LayoutMinistereStars>
  );
};

export default MinistereStarsDashboardPage;
