import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { getCities, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MapPin, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const SelectVillePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = getUser();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Récupérer le département depuis l'état de navigation ou les query params
  const department = location.state?.department || 'promotions';
  const redirectTo = searchParams.get('redirect'); // "bergeries" si redirection vers bergeries

  useEffect(() => {
    // Permettre l'accès à la sélection de ville sans connexion pour les bergeries
    if (redirectTo === 'bergeries') {
      loadCities();
      return;
    }
    
    if (!user || user.role !== 'super_admin') {
      navigate('/dashboard');
      return;
    }
    loadCities();
  }, [user, navigate, redirectTo]);

  const loadCities = async () => {
    try {
      const citiesData = await getCities();
      console.log('Cities loaded:', citiesData); // Debug
      if (citiesData && Array.isArray(citiesData)) {
        setCities(citiesData);
      } else {
        console.error('Invalid cities data:', citiesData);
        toast.error('Format de données invalide');
        setCities([]);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      toast.error('Erreur lors du chargement des villes');
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (cityName) => {
    // Stocker la ville sélectionnée
    localStorage.setItem('selected_city_view', cityName);
    localStorage.setItem('selected_department', department);
    
    // Si redirection vers bergeries
    if (redirectTo === 'bergeries') {
      navigate(`/bergeries?ville=${encodeURIComponent(cityName)}`);
      return;
    }
    
    // Pour superadmin et pasteur, montrer les options de gestion
    if (user && ['super_admin', 'pasteur'].includes(user.role)) {
      navigate('/select-account', { state: { fromCity: cityName, department } });
      return;
    }
    
    // Pour les autres rôles, rediriger directement
    if (user && user.role === 'responsable_eglise') {
      navigate('/dashboard-superadmin-complet');
    } else if (department === 'familles-impact') {
      navigate('/familles-impact/dashboard-superviseur');
    } else {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-4xl">
        <Button 
          onClick={() => navigate('/select-department')} 
          variant="ghost" 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux départements
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Choisissez une ville
          </h1>
          <p className="text-gray-600">
            Département : <span className="font-semibold">
              {department === 'familles-impact' ? 'Familles d\'Impact' : 
               department === 'promotions' ? 'Promotions' : 
               'Accueil et Intégration'}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Option "Toutes les villes" pour Super Admin uniquement */}
          {user?.role === 'super_admin' && (
            <Card
              className="cursor-pointer hover:scale-105 transition-all duration-300 bg-gradient-to-br from-indigo-600 to-purple-700 shadow-lg hover:shadow-indigo-500/50 border-0 group"
              onClick={() => handleCitySelect('all')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <MapPin className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Toutes les villes
                </h3>
                <p className="text-indigo-100 text-sm mt-2">Vue globale</p>
              </CardContent>
            </Card>
          )}
          
          {[...cities]
            .sort((a, b) => {
              const nameA = a?.name || '';
              const nameB = b?.name || '';
              return nameA.localeCompare(nameB);
            })
            .map((city) => (
              <Card
                key={city.id}
                className="cursor-pointer hover:scale-105 transition-all duration-300 bg-white shadow-lg hover:shadow-indigo-500/20 border-0 group"
                onClick={() => handleCitySelect(city.name)}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <MapPin className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {city.name}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    ({city.country || 'France'})
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>

        {cities.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-2">Aucune ville disponible</p>
            <p className="text-xs text-gray-400">
              Si ce message persiste, veuillez contacter l'administrateur.
            </p>
          </Card>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            💡 Sélectionnez une ville pour voir ses statistiques et données
          </p>
        </div>
      </div>
    </div>
  );
};

export default SelectVillePage;
