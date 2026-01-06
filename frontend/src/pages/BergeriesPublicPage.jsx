import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { MapPin, Calendar, Users, ArrowLeft, Lock } from 'lucide-react';
import { toast } from 'sonner';

const monthNames = {
  '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
  '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
  '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
};

const BergeriesPublicPage = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [bergeries, setBergeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(true);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      loadBergeries();
    }
  }, [selectedCity]);

  const loadCities = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cities/public`);
      if (response.ok) {
        const citiesData = await response.json();
        const cityNames = citiesData.map(city => typeof city === 'string' ? city : city.name);
        setCities(cityNames.filter(Boolean));
      } else {
        setCities(['Dijon', 'Paris', 'Lyon']);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      setCities(['Dijon', 'Paris', 'Lyon']);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadBergeries = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/list-public/${encodeURIComponent(selectedCity)}`
      );
      if (response.ok) {
        const data = await response.json();
        setBergeries(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des bergeries');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBergerie = (bergerie) => {
    // Stocker la bergerie sélectionnée pour après connexion
    sessionStorage.setItem('selectedBergerie', JSON.stringify({
      month_num: bergerie.month_num,
      month_name: bergerie.month_name,
      nom: `Bergerie ${bergerie.month_name}`,
      ville: selectedCity
    }));
    sessionStorage.setItem('redirectAfterLogin', '/bergeries-dashboard');
    sessionStorage.setItem('selectedCity', selectedCity);
    
    // Rediriger vers la page de connexion
    navigate('/login');
  };

  if (loadingCities) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="p-4">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Button>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-4">
            <Users className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">🌿 Bergeries</h1>
          <p className="text-gray-600 mt-2">Sélectionnez votre ville puis votre bergerie</p>
        </div>

        {/* City Selector */}
        <div className="max-w-md mx-auto mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  Choisissez votre ville
                </label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez une ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bergeries Grid */}
        {selectedCity && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">
              Bergeries de {selectedCity}
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {bergeries.map((bergerie) => (
                  <Card 
                    key={bergerie.month_num}
                    className="cursor-pointer hover:shadow-lg transition-all hover:border-purple-400 hover:bg-purple-50 group"
                    onClick={() => handleSelectBergerie(bergerie)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        Bergerie {bergerie.month_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>{bergerie.total_personnes} personne(s)</span>
                        </div>
                        
                        {bergerie.bergers && bergerie.bergers.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Berger(s): {bergerie.bergers.map(b => b.username).join(', ')}
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full mt-4 bg-purple-600 hover:bg-purple-700 group-hover:bg-purple-700"
                        size="sm"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Accéder
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Message si aucune ville sélectionnée */}
        {!selectedCity && (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p>Sélectionnez une ville pour voir les bergeries disponibles</p>
          </div>
        )}

        {/* Bannière 2026 */}
        <div className="mt-12">
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-center text-white shadow-xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              🎯 2026, année du discipolat
            </h2>
            <p className="text-sm md:text-base font-medium opacity-95">
              Objectif <span className="text-yellow-300 font-bold text-xl">1000</span> disciples affermis du Christ
              en Bourgogne Franche-Comté en 2026
            </p>
            <p className="text-sm mt-2 opacity-80">🙏 La BFC pour Christ</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BergeriesPublicPage;
