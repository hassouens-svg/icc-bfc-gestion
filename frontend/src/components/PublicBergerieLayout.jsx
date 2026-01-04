import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Home, Users, Table, UserPlus, TrendingUp, Calendar, ArrowLeft, Eye, LogOut } from 'lucide-react';

/**
 * PublicBergerieLayout - Layout identique à Layout.jsx mais pour le mode invité (public)
 * Affiche exactement la même interface que pour un berger connecté
 */
const PublicBergerieLayout = ({ children, guestContext }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const ville = guestContext?.ville || '';
  const monthNum = guestContext?.month_num || '01';
  const monthName = guestContext?.month_name || '';
  const bergerieName = guestContext?.nom || `Bergerie ${monthName}`;

  const handleExit = () => {
    localStorage.removeItem('guest_bergerie_context');
    navigate('/bergeries');
  };

  // Navigation items - identique à Layout.jsx pour le rôle berger
  const navItems = [
    { path: '/bergerie/dashboard', label: 'Dashboard Bergerie', icon: Home },
    { path: '/bergerie/visitors', label: 'Nouveaux Arrivants', icon: Users },
    { path: '/bergerie/visitors-table', label: 'Vue Tableau', icon: Table },
    { path: '/bergerie/suivi-disciples', label: 'Suivi Disciples', icon: UserPlus },
    { path: '/bergerie/reproduction', label: 'Reproduction', icon: TrendingUp },
  ];

  // Build URL with query params
  const buildUrl = (basePath) => {
    return `${basePath}?ville=${encodeURIComponent(ville)}&month=${monthNum}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - identique à Layout.jsx */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-indigo-600">ICC BFC-ITALIE {ville}</h1>
              <p className="text-xs sm:text-sm text-gray-500">
                {bergerieName} (Accès Public)
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Badge mode public */}
            <div className="flex items-center gap-1 text-purple-700 bg-purple-100 px-2 py-1 rounded-full mr-2">
              <Eye className="h-3 w-3" />
              <span className="text-xs font-medium hidden sm:inline">Mode Public</span>
            </div>

            {/* Bouton Accueil */}
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
              size="sm"
              className="hover:bg-indigo-50 text-indigo-600 border-indigo-200"
              title="Retour à l'accueil"
            >
              <Home className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Accueil</span>
            </Button>

            {/* Bouton Retour aux bergeries */}
            <Button 
              onClick={() => navigate('/bergeries')} 
              variant="outline"
              size="sm"
              className="hover:bg-gray-100"
              title="Retour à la sélection"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Bergeries</span>
            </Button>

            {/* Bouton Quitter mode public */}
            <Button 
              onClick={handleExit} 
              variant="outline" 
              size="sm"
              className="hover:bg-red-50 text-red-600 border-red-200"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Quitter</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation - identique à Layout.jsx */}
      <nav className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex space-x-2 sm:space-x-8 overflow-x-auto scrollbar-hide py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const fullPath = buildUrl(item.path);
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(fullPath)}
                  className={`flex items-center px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default PublicBergerieLayout;
