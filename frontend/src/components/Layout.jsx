import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getUser, getNotifications, markNotificationRead } from '../utils/api';
import { Button } from './ui/button';
import { Home, Users, UserPlus, MapPin, BarChart3, LogOut, UserX, TrendingUp, Table, Heart, Shield, Bell, Database } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    logout();
  };

  // Charger les notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const notifs = await getNotifications();
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      } catch (error) {
        // Silent fail
      }
    };
    
    loadNotifications();
    // Recharger toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? {...n, read: true} : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      // Silent fail
    }
  };

  // Déterminer le département actif depuis localStorage
  const activeDepartment = localStorage.getItem('selected_department');

  const navItems = [
    // PROMOTIONS - visible uniquement si département promotions ou rôles promos
    { path: '/dashboard', label: 'Dashboard Promotions', icon: Home, roles: ['referent', 'promotions', 'berger'], department: 'promotions' },
    { path: '/dashboard-superviseur-promos', label: 'Dashboard Superviseur', icon: BarChart3, roles: ['superviseur_promos'], department: 'promotions' },
    { path: '/visitors', label: 'Nouveaux Arrivants', icon: Users, roles: ['superviseur_promos', 'referent', 'accueil', 'promotions', 'berger'], department: 'promotions' },
    { path: '/visitors-table', label: 'Vue Tableau', icon: Table, roles: ['superviseur_promos', 'referent', 'promotions', 'berger'], department: 'promotions' },
    { path: '/referents', label: 'Bergers', icon: UserPlus, roles: ['superviseur_promos', 'promotions', 'berger'], department: 'promotions' },
    { path: '/analytics', label: 'Analytics Promos', icon: BarChart3, roles: ['superviseur_promos', 'promotions', 'berger'], department: 'promotions' },
    { path: '/stopped-visitors', label: 'Suivi Arrêté', icon: UserX, roles: ['superviseur_promos', 'promotions', 'berger'], department: 'promotions' },
    
    // FAMILLES D'IMPACT - visible uniquement si département FI ou rôles FI
    { path: '/familles-impact/dashboard-pilote', label: 'Tableau de Bord Pilote', icon: Home, roles: ['pilote_fi'], department: 'familles-impact' },
    { path: '/familles-impact/presences-table', label: 'Vue Tableau Présences', icon: Table, roles: ['pilote_fi'], department: 'familles-impact' },
    { path: '/familles-impact/dashboard-responsable-secteur', label: 'Dashboard Secteur', icon: Home, roles: ['responsable_secteur'], department: 'familles-impact' },
    { path: '/familles-impact/dashboard-superviseur', label: 'Dashboard Superviseur FI', icon: BarChart3, roles: ['superviseur_fi'], department: 'familles-impact' },
    { path: '/familles-impact', label: 'Familles d\'Impact', icon: Heart, roles: ['superviseur_fi', 'responsable_secteur'], department: 'familles-impact' },
    { path: '/familles-impact/affectation', label: 'Affectation FI', icon: UserPlus, roles: ['superviseur_fi'], department: 'familles-impact' },
    { path: '/familles-impact/secteurs', label: 'Gérer Secteurs', icon: MapPin, roles: ['superviseur_fi'], department: 'familles-impact' },
    { path: '/familles-impact/gerer-fi', label: 'Gérer FI', icon: Heart, roles: ['superviseur_fi'], department: 'familles-impact' },
    
    // ACCUEIL & INTÉGRATION
    { path: '/culte-stats', label: 'Statistiques des Cultes', icon: BarChart3, roles: ['accueil', 'super_admin'], department: 'promotions' },
    
    // ÉVANGÉLISATION
    { path: '/evangelisation', label: "Dynamique d'Évangélisation", icon: Heart, roles: ['responsable_evangelisation'], department: 'evangelisation' },
    
    // COMMUNES - Villes UNIQUEMENT pour super_admin et pasteur (pas superviseur_promos)
    { path: '/cities', label: 'Villes', icon: MapPin, roles: ['super_admin', 'pasteur'], department: null },
    
    // SUPER ADMIN / PASTEUR / RESPONSABLE D'ÉGLISE - toujours visibles
    { path: '/dashboard-superadmin-complet', label: 'Dashboard Super Admin', icon: Home, roles: ['super_admin'], department: null },
    { path: '/dashboard-pasteur', label: 'Dashboard Pasteur', icon: Home, roles: ['pasteur'], department: null },
    { path: '/dashboard-pasteur', label: 'Dashboard', icon: Home, roles: ['responsable_eglise'], department: null },
    { path: '/gestion-acces', label: 'Gestion des Accès', icon: Shield, roles: ['super_admin', 'responsable_eglise'], department: null },
    { path: '/affectation-pilotes-fi', label: 'Attribution Pilotes FI', icon: UserPlus, roles: ['responsable_secteur', 'superviseur_fi', 'super_admin'], department: 'familles-impact' },
    { path: '/admin-data', label: 'Gestion des Données', icon: Database, roles: ['super_admin'], department: null },
    { path: '/notifications', label: 'Notifications Push', icon: Bell, roles: ['super_admin', 'pasteur'], department: null },
    
    // AFFECTATIONS SUPERVISEUR FI
    { path: '/affectation-responsables-secteur', label: 'Attribution Responsables Secteurs', icon: UserPlus, roles: ['super_admin', 'superviseur_fi'], department: null },
  ];

  const filteredNavItems = navItems.filter(item => {
    // Vérifier le rôle
    if (!item.roles.includes(user?.role)) return false;
    
    // Pour super_admin, pasteur et responsable_eglise, filtrer selon le département actif
    if (['super_admin', 'pasteur', 'responsable_eglise'].includes(user?.role)) {
      if (item.department === null) return true; // Items communs toujours visibles
      return item.department === activeDepartment;
    }
    
    // Pour les autres rôles, filtrer selon leur département
    if (item.department === null) return true; // Items communs
    
    // Rôles Promos voient uniquement items Promos
    if (['superviseur_promos', 'referent', 'promotions', 'accueil'].includes(user?.role)) {
      return item.department === 'promotions';
    }
    
    // Rôles FI voient uniquement items FI
    if (['superviseur_fi', 'pilote_fi', 'responsable_secteur'].includes(user?.role)) {
      return item.department === 'familles-impact';
    }
    
    // Rôle Évangélisation voit uniquement items Évangélisation
    if (user?.role === 'responsable_evangelisation') {
      return item.department === 'evangelisation';
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">ICC BFC-ITALIE {user?.city}</h1>
            <p className="text-sm text-gray-500">
              {user?.username} ({user?.role === 'superviseur_promos' ? 'Superviseur Promotions' : 
                user?.role === 'superviseur_fi' ? 'Superviseur FI' :
                user?.role === 'super_admin' ? 'Super Administrateur' :
                user?.role === 'pasteur' ? 'Pasteur' :
                user?.role === 'responsable_eglise' ? 'Responsable d\'Église' :
                user?.role === 'accueil' ? 'Accueil et Intégration' :
                user?.role === 'promotions' ? 'Promotions' : 
                user?.role === 'pilote_fi' ? 'Pilote FI' :
                user?.role === 'responsable_secteur' ? 'Responsable Secteur' :
                'Berger'})
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm mb-2">Notifications</h3>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucune notification</p>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2 rounded border text-sm ${!notif.read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
                        onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                        style={{ cursor: !notif.read ? 'pointer' : 'default' }}
                      >
                        <p className="text-xs text-gray-500 mb-1">
                          {new Date(notif.created_at).toLocaleString('fr-FR')}
                        </p>
                        <p>{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {localStorage.getItem('is_impersonating') === 'true' && (
              <Button 
                onClick={() => {
                  const originalUser = JSON.parse(localStorage.getItem('original_user'));
                  localStorage.setItem('user', JSON.stringify(originalUser));
                  localStorage.removeItem('original_user');
                  localStorage.removeItem('is_impersonating');
                  navigate('/gestion-acces');
                  window.location.reload();
                }} 
                variant="outline"
                className="bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
              >
                <UserX className="h-4 w-4 mr-2" />
                Revenir à mon compte
              </Button>
            )}
            <Button onClick={handleLogout} variant="outline" data-testid="logout-button">
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
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
