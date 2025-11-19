import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { UserCheck, TrendingUp, Users, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { logout, getUser } from '../utils/api';

const SelectDepartmentPage = () => {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
  };

  if (!user || !['pasteur', 'super_admin', 'responsable_eglise'].includes(user.role)) {
    navigate('/dashboard');
    return null;
  }

  const handleDepartmentChoice = (deptId) => {
    // Store the selected department
    localStorage.setItem('selected_department', deptId);
    
    // La ville a déjà été sélectionnée au login, rediriger directement vers le dashboard
    navigate('/dashboard-superadmin-complet');
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
      description: 'Suivi complet des nouveaux arrivants et nouveaux convertis',
      icon: TrendingUp,
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 'familles-impact',
      title: 'Familles d\'Impact',
      description: 'Gestion des cellules de prière et suivi des membres',
      icon: Users,
      color: 'from-green-400 to-green-600'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              {user.role === 'pasteur' ? 'Tableau de Bord Pasteur' : 'Tableau de Bord Super Administrateur'}
            </h1>
            <p className="text-gray-600 mt-2">
              Bienvenue {user.username} - Accès multi-villes
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">
            Choisissez votre département
          </h2>
          <p className="text-gray-600">
            Vous avez accès à tous les départements et toutes les villes
          </p>
        </div>

        {/* Department Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {departments.map((dept) => {
            const Icon = dept.icon;
            return (
              <Card
                key={dept.id}
                className="cursor-pointer hover:scale-105 transition-all duration-300 bg-white shadow-2xl hover:shadow-blue-500/20 border-0 group"
                onClick={() => handleDepartmentChoice(dept.id)}
              >
                <CardContent className="p-8 text-center">
                  <div className={`w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${dept.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    {dept.title}
                  </h3>
                  <p className="text-gray-600">
                    {dept.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            💡 Vous pouvez accéder aux dashboards spécifiques directement depuis le menu de navigation
          </p>
        </div>
      </div>
    </div>
  );
};

export default SelectDepartmentPage;
