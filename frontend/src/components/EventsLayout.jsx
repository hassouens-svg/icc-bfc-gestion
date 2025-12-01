import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, List, Mail, BarChart3, LogOut, Menu, X, Home, MessageSquare, CheckCircle, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';

const EventsLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const menuItems = [
    { 
      path: '/events-management', 
      label: 'Accueil', 
      icon: Home 
    },
    { 
      path: '/events/planning', 
      label: 'Planning', 
      icon: Calendar 
    },
    { 
      path: '/events/projets', 
      label: 'Projets', 
      icon: List 
    },
    { 
      path: '/events/email', 
      label: '📧 Email', 
      icon: Mail 
    },
    { 
      path: '/events/sms', 
      label: '📱 SMS', 
      icon: MessageSquare 
    },
    { 
      path: '/events/rsvp-management', 
      label: '✉️ RSVP', 
      icon: CheckCircle 
    },
    { 
      path: '/events/stats', 
      label: 'Statistiques', 
      icon: BarChart3 
    }
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo et titre */}
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-xl font-bold text-white">My Events Church</h1>
                <p className="text-xs text-purple-100">Impact Centre Chrétien BFC-Italie</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-white text-purple-600 font-semibold'
                        : 'text-white hover:bg-purple-500'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
              
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white text-purple-600 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-purple-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-md ${
                      isActive(item.path)
                        ? 'bg-white text-purple-600 font-semibold'
                        : 'text-white hover:bg-purple-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-white hover:bg-purple-600"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Impact Centre Chrétien BFC-Italie - My Events Church
          </p>
        </div>
      </footer>
    </div>
  );
};

export default EventsLayout;
