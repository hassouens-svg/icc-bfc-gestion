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
      title: 'Accueil',
      description: 'Consultation de la liste des visiteurs',
      icon: UserCheck,
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'integration',
      title: 'Intégration',
      description: 'Gestion et suivi des nouveaux arrivants',
      icon: Users,
      color: 'from-indigo-400 to-indigo-600'
    },
    {
      id: 'promotions',
      title: 'Promotions',
      description: 'Accès complet à toutes les fonctionnalités',
      icon: TrendingUp,
      color: 'from-purple-400 to-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8">
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
        <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">
          ICC Connect
        </h1>
        <p className="text-xl text-blue-100 drop-shadow">
          Département de l'accueil, de l'intégration et des promotions
        </p>
        <p className="text-sm text-blue-200 mt-2">
          Gestion des nouveaux arrivants et nouveaux convertis
        </p>
      </div>

      {/* City Selection */}
      <Card className="w-full max-w-md mb-6 bg-white/95 backdrop-blur">
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
      <div className="w-full max-w-5xl">
        <h2 className="text-2xl font-semibold text-white text-center mb-6 drop-shadow">
          Choisissez votre département
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <p className="text-blue-100 mb-2">Nouveau visiteur?</p>
        <Button
          variant="outline"
          className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur"
          onClick={() => navigate('/register')}
          data-testid="register-link-home"
        >
          S'inscrire ici
        </Button>
      </div>
    </div>
  );
};

export default HomePage;
