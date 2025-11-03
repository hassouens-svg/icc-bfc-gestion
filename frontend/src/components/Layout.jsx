import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getUser } from '../utils/api';
import { Button } from './ui/button';
import { Home, Users, UserPlus, MapPin, BarChart3, LogOut, UserX } from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'referent', 'promotions'] },
    { path: '/visitors', label: 'Visiteurs', icon: Users, roles: ['admin', 'referent', 'accueil', 'integration', 'promotions'] },
    { path: '/referents', label: 'Référents', icon: UserPlus, roles: ['admin', 'promotions'] },
    { path: '/cities', label: 'Villes', icon: MapPin, roles: ['admin', 'promotions'] },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'promotions'] },
    { path: '/stopped-visitors', label: 'Suivi Arrêté', icon: UserX, roles: ['admin', 'promotions'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">ICC {user?.city}</h1>
            <p className="text-sm text-gray-500">
              {user?.username} ({user?.role === 'admin' ? 'Administrateur' : 
                user?.role === 'accueil' ? 'Accueil' :
                user?.role === 'integration' ? 'Intégration' :
                user?.role === 'promotions' ? 'Promotions' : 'Référent'})
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline" data-testid="logout-button">
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  data-testid={`nav-${item.path.replace('/', '')}`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
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

export default Layout;
