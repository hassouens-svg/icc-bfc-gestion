import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { MapPin, ArrowLeft, Church } from 'lucide-react';

const SelectVilleBergersPage = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCities();
  }, []);

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
      setCities(['Dijon', 'Paris', 'Lyon']);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = () => {
    if (!selectedCity) return;
    localStorage.setItem('selected_city', selectedCity);
    navigate(`/acces-bergers-eglise/dashboard?ville=${encodeURIComponent(selectedCity)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto pt-20">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Button>
        
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Church className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Accès Bergers Église</CardTitle>
            <p className="text-gray-500 mt-2">Sélectionnez votre ville</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une ville" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {city}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleCitySelect}
              disabled={!selectedCity}
            >
              Accéder
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SelectVilleBergersPage;
