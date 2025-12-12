import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutMinistereStars from '../components/LayoutMinistereStars';
import { getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, TrendingUp, Star, Calendar, MapPin, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useSelectedCity } from '../contexts/SelectedCityContext';
import { useCities } from '../contexts/CitiesContext';

const MinistereStarsDashboardPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const { selectedCity, setSelectedCity } = useSelectedCity();
  const { cities } = useCities();
  const [stats, setStats] = useState(null);
  const [multiDeptStars, setMultiDeptStars] = useState([]);
  const [loading, setLoading] = useState(true);

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
    'Évènementiel/Restauration'
  ];

  // Vérifier les permissions
  const canView = user?.role && ['super_admin', 'pasteur', 'responsable_eglise', 'ministere_stars', 'respo_departement', 'star'].includes(user.role);
  const canSelectCity = user?.role && ['super_admin', 'pasteur'].includes(user.role);

  useEffect(() => {
    if (!user || !canView) {
      navigate('/');
      return;
    }
    loadData();
  }, [selectedCity]);

  const loadData = async () => {
    try {
      // Ajouter le filtre ville si sélectionné
      const villeParam = selectedCity && selectedCity !== 'all' ? `?ville=${encodeURIComponent(selectedCity)}` : '';
      
      const [statsRes, multiRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stars/stats/overview${villeParam}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stars/multi-departements${villeParam}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      setStats(await statsRes.json());
      setMultiDeptStars(await multiRes.json());
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
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

  return (
    <LayoutMinistereStars>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="h-8 w-8 text-yellow-500" />
            Ministère des STARS
          </h1>
          <p className="text-gray-500 mt-1">Dashboard de suivi des stars</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </LayoutMinistereStars>
  );
};

export default MinistereStarsDashboardPage;
