import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { MapPin, Users, ArrowLeft, Calendar, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const SelectBergeriePublicPage = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [bergeries, setBergeries] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingBergeries, setLoadingBergeries] = useState(false);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      loadBergeries(selectedCity);
    }
  }, [selectedCity]);

  const loadCities = async () => {
    try {
      // Appel direct sans authentification
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cities/public`);
      if (response.ok) {
        const citiesData = await response.json();
        // Extraire juste les noms de ville (les cities sont des objets avec name)
        const cityNames = citiesData.map(city => typeof city === 'string' ? city : city.name);
        setCities(cityNames.filter(Boolean));
      } else {
        // Fallback: utiliser des villes par défaut
        setCities(['Dijon', 'Paris', 'Lyon']);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      // Fallback
      setCities(['Dijon', 'Paris', 'Lyon']);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadBergeries = async (city) => {
    setLoadingBergeries(true);
    try {
      // Utiliser l'endpoint public
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/list-public/${encodeURIComponent(city)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setBergeries(data);
      } else {
        throw new Error('Erreur');
      }
    } catch (error) {
      console.error('Error loading bergeries:', error);
      toast.error('Erreur lors du chargement des bergeries');
      setBergeries([]);
    } finally {
      setLoadingBergeries(false);
    }
  };

  const handleSelectBergerie = (bergerie) => {
    // Sauvegarder le contexte invité pour les pages publiques
    const guestContext = {
      month_num: bergerie.month_num,
      month_name: bergerie.month_name,
      nom: `Bergerie ${bergerie.month_name}`,
      ville: selectedCity
    };
    
    localStorage.setItem('guest_bergerie_context', JSON.stringify(guestContext));
    localStorage.setItem('selected_department', 'promotions');
    
    // Naviguer vers le nouveau dashboard public
    navigate(`/bergerie/dashboard?ville=${encodeURIComponent(selectedCity)}&month=${bergerie.month_num}`);
  };

  if (loadingCities) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🌿 Bergeries</h1>
            <p className="text-gray-600">Sélectionnez votre ville puis votre bergerie</p>
          </div>
        </div>

        {/* Sélection de la ville */}
        <Card className="mb-8 max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              Étape 1 : Choisissez votre ville
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Liste des bergeries */}
        {selectedCity && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-800">
              📋 Bergeries de {selectedCity}
            </h2>
            
            {loadingBergeries ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {bergeries.map((bergerie) => (
                  <Card 
                    key={bergerie.month_num}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-purple-400 hover:-translate-y-1 group"
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
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <ChevronRight className="h-5 w-5 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message si aucune ville sélectionnée */}
        {!selectedCity && (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p>Sélectionnez une ville pour voir les bergeries disponibles</p>
          </div>
        )}

        {/* Bannière 2026 - Objectif Disciples */}
        <div className="mt-12 mb-8">
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-center text-white shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🎯 2026, année du discipolat
            </h2>
            <p className="text-lg md:text-xl font-medium opacity-95 leading-relaxed">
              Objectif <span className="text-yellow-300 font-bold text-2xl md:text-3xl">1000</span> disciples affermis du Christ
              <br />
              en Bourgogne Franche-Comté en 2026
            </p>
            <div className="mt-6 flex justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-2">
                <span className="text-sm font-medium">🙏 Ensemble, faisons des disciples !</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectBergeriePublicPage;
