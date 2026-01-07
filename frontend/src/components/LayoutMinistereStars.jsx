import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getUser } from '../utils/api';
import { Button } from './ui/button';
import { LogOut, ArrowLeft, Star, MapPin, Home } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useCities } from '../contexts/CitiesContext';
import { useSelectedCity } from '../contexts/SelectedCityContext';

const LayoutMinistereStars = ({ children, ville }) => {
  const navigate = useNavigate();
  const user = getUser();
  const { cities } = useCities();
  const { selectedCity, setSelectedCity } = useSelectedCity();
  
  // Mode public si pas d'utilisateur connecté
  const isPublicMode = !user;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Permissions : pasteur/superadmin peuvent sélectionner n'importe quelle ville
  // respo_departement aussi
  // responsable_eglise voit seulement sa ville
  // star voit seulement sa ville ou le filtre global
  const canSelectCity = !isPublicMode && ['super_admin', 'pasteur', 'respo_departement'].includes(user?.role);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header spécifique Ministère STARS */}
      <header className="bg-gradient-to-r from-yellow-500 to-orange-600 shadow-lg border-b border-orange-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo et titre */}
            <div className="flex items-center gap-4">
              <Star className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-xl font-bold text-white">Ministère des STARS</h1>
                {isPublicMode && ville && (
                  <p className="text-sm text-white/80">{ville} - Accès Public</p>
                )}
              </div>
              
              {/* Sélecteur de ville - pour ceux qui peuvent sélectionner */}
              {canSelectCity && (
                <Select value={selectedCity || 'all'} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-[160px] bg-white/20 border-white/30 text-white hover:bg-white/30">
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Ville" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌍 Toutes les villes</SelectItem>
                    {cities.filter(c => c.name && c.name.trim() !== '').sort((a, b) => a.name.localeCompare(b.name)).map((city) => (
                      <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Affichage ville en mode public */}
              {isPublicMode && ville && (
                <div className="px-3 py-1.5 bg-white/20 rounded-lg text-white text-sm border border-white/30 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {ville}
                </div>
              )}
              
              {/* Affichage ville pour responsable_eglise (fixe sur sa ville) */}
              {!isPublicMode && user?.role === 'responsable_eglise' && (
                <div className="px-3 py-1.5 bg-white/20 rounded-lg text-white text-sm border border-white/30 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {user?.city}
                </div>
              )}
              
              {/* Affichage pour star (lecture seule mais peut voir le filtre) */}
              {!isPublicMode && user?.role === 'star' && (
                <div className="px-3 py-1.5 bg-white/20 rounded-lg text-white text-sm border border-white/30 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {selectedCity && selectedCity !== 'all' ? selectedCity : 'Toutes les villes'}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => navigate('/')} 
                variant="outline"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                title="Retour à l'accueil"
              >
                <Home className="h-4 w-4 mr-2" />
                Accueil
              </Button>

              {isPublicMode ? (
                <Button 
                  onClick={() => navigate('/select-ville-stars')} 
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Changer de ville
                </Button>
              ) : (
                <>
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
                </>
              )}
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
