import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getUser } from '../utils/api';
import { Button } from './ui/button';
import { LogOut, ArrowLeft, Star } from 'lucide-react';

const LayoutMinistereStars = ({ children, onCityChange }) => {
  const navigate = useNavigate();
  const user = getUser();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(user?.city || 'all');

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cities`);
      const data = await response.json();
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    // Mettre à jour l'utilisateur avec la nouvelle ville
    const updatedUser = { ...user, city };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Notifier le parent (dashboard) du changement
    if (onCityChange) {
      onCityChange(city);
    }
    
    // Recharger la page pour appliquer les changements
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header spécifique Ministère STARS */}
      <header className="bg-gradient-to-r from-yellow-500 to-orange-600 shadow-lg border-b border-orange-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo et titre */}
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-xl font-bold text-white">Ministère des STARS</h1>
                <p className="text-xs text-orange-100">{user?.city || 'Toutes les villes'}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => navigate(-1)} 
                variant="outline"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              <Button 
                onClick={handleLogout} 
                variant="outline"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} ICC BFC-ITALIE - Ministère des STARS</p>
      </footer>
    </div>
  );
};

export default LayoutMinistereStars;
