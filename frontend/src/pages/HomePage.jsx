import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCities } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, TrendingUp, UserCheck } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    const loadCities = async () => {
      try {
        const citiesData = await getCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Error loading cities:', error);
      }
    };
    loadCities();
  }, []);

  const handleDepartmentChoice = (department) => {
    if (!selectedCity) {
      alert('Veuillez sélectionner une ville');
      return;
    }
    // Store the selected department in sessionStorage
    sessionStorage.setItem('selectedDepartment', department);
    sessionStorage.setItem('selectedCity', selectedCity);
    navigate('/login');
  };

  const departments = [
    {
      id: 'accueil',
      title: 'Accueil et Intégration',
      description: 'Consultation de la liste des nouveaux arrivants',
      icon: UserCheck,
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'promotions',
      title: 'Promotions',
      description: 'Suivi complet des visiteurs avec les référents',
      icon: TrendingUp,
      color: 'from-purple-400 to-purple-600'
    }
  ];

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage: 'url(https://customer-assets.emergentagent.com/job_dijon-icc-hub/artifacts/44copvry_IMG_2598.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-40 h-40 rounded-full bg-white border-8 border-white shadow-2xl flex items-center justify-center">
            <img
              src="https://customer-assets.emergentagent.com/job_dijon-icc-hub/artifacts/foeikpvk_IMG_2590.png"
              alt="ICC Logo"
              className="w-32 h-32 object-contain"
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-3 drop-shadow-2xl">
            ICC
          </h1>
          <p className="text-xl text-white drop-shadow-lg font-medium">
            Département de l'accueil, de l'intégration et des promotions
          </p>
          <p className="text-sm text-white/90 mt-2 drop-shadow">
            Gestion des nouveaux arrivants et nouveaux convertis
          </p>
        </div>

        {/* City Selection */}
        <Card className="w-full max-w-md mb-6 bg-white/95 backdrop-blur mx-auto shadow-2xl">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sélectionnez votre ville</label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full" data-testid="home-city-select">
                  <SelectValue placeholder="Choisir une ville..." />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Department Cards */}
        <div className="w-full">
          <h2 className="text-2xl font-semibold text-white text-center mb-6 drop-shadow-lg">
            Choisissez votre département
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {departments.map((dept) => {
              const Icon = dept.icon;
              return (
                <Card
                  key={dept.id}
                  className="cursor-pointer hover:scale-105 transition-all duration-300 bg-white/95 backdrop-blur shadow-xl hover:shadow-2xl"
                  onClick={() => handleDepartmentChoice(dept.id)}
                  data-testid={`dept-card-${dept.id}`}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${dept.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {dept.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {dept.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center">
          <p className="text-white drop-shadow mb-2">Nouveau visiteur?</p>
          <Button
            variant="outline"
            className="bg-white/20 hover:bg-white/30 text-white border-white/50 backdrop-blur"
            onClick={() => navigate('/register')}
            data-testid="register-link-home"
          >
            S'inscrire ici
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
