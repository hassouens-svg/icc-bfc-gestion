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
        // Silent fail - cities will be empty
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
      description: 'Suivi complet des nouveaux arrivants et nouveaux convertiss avec les responsable de promoss',
      icon: TrendingUp,
      color: 'from-purple-400 to-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="w-48 h-48 rounded-full bg-white shadow-2xl flex items-center justify-center border-8 border-white/20 backdrop-blur-sm">
            <img
              src="https://customer-assets.emergentagent.com/job_dijon-icc-hub/artifacts/foeikpvk_IMG_2590.png"
              alt="ICC Logo"
              className="w-40 h-40 object-contain rounded-full"
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Impact Centre Chrétien
          </h1>
          <div className="max-w-2xl mx-auto">
            <p className="text-2xl text-blue-100 font-medium mb-2">
              Département de l'accueil, de l'intégration et des promotions
            </p>
            <p className="text-base text-blue-200/80">
              Gestion des nouveaux arrivants et nouveaux convertis
            </p>
          </div>
        </div>

        {/* City Selection */}
        <Card className="w-full max-w-md mb-8 bg-white/10 backdrop-blur-xl border-white/20 mx-auto shadow-2xl">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white/90">Sélectionnez votre ville</label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full bg-white/10 border-white/30 text-white backdrop-blur" data-testid="home-city-select">
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
        <div className="w-full animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <h2 className="text-3xl font-semibold text-white text-center mb-8">
            Choisissez votre département
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {departments.map((dept) => {
              const Icon = dept.icon;
              return (
                <Card
                  key={dept.id}
                  className="cursor-pointer hover:scale-105 transition-all duration-300 bg-white/95 backdrop-blur-xl shadow-2xl hover:shadow-blue-500/20 border-0 group"
                  onClick={() => handleDepartmentChoice(dept.id)}
                  data-testid={`dept-card-${dept.id}`}
                >
                  <CardContent className="p-8 text-center">
                    <div className={`w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${dept.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 mb-3">
                      {dept.title}
                    </h3>
                    <p className="text-base text-gray-600 leading-relaxed">
                      {dept.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-16 text-center animate-fade-in" style={{animationDelay: '0.4s'}}>
          <p className="text-white/90 mb-3 text-lg">Nouveau nouveaux arrivants et nouveaux convertis?</p>
          <Button
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-xl px-8 py-6 text-lg font-medium shadow-lg"
            onClick={() => navigate('/register')}
            data-testid="register-link-home"
          >
            S'inscrire ici
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
