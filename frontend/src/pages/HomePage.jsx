import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Users, TrendingUp, UserCheck, Shield, Church, Heart } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  const handleDepartmentChoice = (deptId) => {
    // Handle special access pages
    if (deptId === 'acces-specifiques') {
      navigate('/acces-specifiques');
      return;
    }
    
    if (deptId === 'acces-bergers-eglise') {
      navigate('/acces-bergers-eglise');
      return;
    }

    // Plus besoin de sélectionner la ville ici - elle sera sélectionnée au login
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Veuillez vous connecter');
      navigate('/login');
      return;
    }

    // Store the selected role in localStorage
    localStorage.setItem('selected_role', deptId);
    
    // Navigate based on department
    if (deptId === 'accueil') {
      navigate('/visitors');
    } else if (deptId === 'promotions') {
      navigate('/dashboard');
    } else if (deptId === 'familles-impact') {
      navigate('/familles-impact');
    } else if (deptId === 'evangelisation') {
      navigate('/evangelisation');
    }
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
    },
    {
      id: 'familles-impact',
      title: 'Familles d\'Impact',
      description: 'Gestion des cellules de prière et suivi des membres',
      icon: Users,
      color: 'from-green-400 to-green-600'
    },
    {
      id: 'acces-specifiques',
      title: 'Accès Spécifiques',
      description: 'Tableau de bord Pasteur et Super Admin',
      icon: Shield,
      color: 'from-red-400 to-red-600'
    },
    {
      id: 'acces-bergers-eglise',
      title: 'Accès Bergers d\'Église',
      description: 'Responsables d\'Église - Gestion complète de votre ville',
      icon: Shield,
      color: 'from-purple-400 to-pink-600'
    },
    {
      id: 'evangelisation',
      title: 'Dynamique d\'Évangélisation',
      description: 'Enregistrement des activités d\'évangélisation de l\'église et des familles d\'impact',
      icon: Heart,
      color: 'from-red-400 to-pink-600'
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
            ICC BFC-ITALIE
          </h1>
          <p className="text-lg text-blue-100 mb-2">Impact Centre Chrétien - Bourgogne-Franche-Comté et Italie</p>
          <div className="max-w-2xl mx-auto">
            <p className="text-2xl text-blue-100 font-medium mb-2">
              Département de l'accueil, de l'intégration et des promotions
            </p>
            <p className="text-base text-blue-200/80">
              Gestion des nouveaux arrivants et nouveaux convertis
            </p>
          </div>
        </div>

        {/* Department Cards */}
        <div className="w-full animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <h2 className="text-3xl font-semibold text-white text-center mb-8">
            Choisissez votre département
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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

        {/* My Events Church Section */}
        <div className="mt-12 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
          <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="text-5xl">📅</div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                My Events Church
              </h3>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Gérez vos projets d'église, organisez des événements et communiquez avec votre communauté via email et SMS en masse.
              </p>
              <Button
                onClick={() => navigate('/events-management')}
                size="lg"
                className="bg-white text-purple-700 hover:bg-gray-100 font-semibold px-8 py-6 text-lg shadow-lg"
              >
                Accéder à My Events Church →
              </Button>
              <p className="text-xs text-white/70 mt-4">
                Accès réservé : Pasteur, Super Admin, Responsable d'Église, Gestion Projet
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Copyright */}
        <footer className="mt-20 pb-8 text-center animate-fade-in border-t border-white/10 pt-8" style={{animationDelay: '0.6s'}}>
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Church className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">ICC BFC-ITALIE</span>
            </div>
            
            <p className="text-white/80 text-base leading-relaxed px-4">
              Cette application web a été développée par <strong className="text-white">Impact Centre Chrétien - Campus de Dijon</strong> dans le but de gérer efficacement les différents départements qui s'y trouvent ainsi que toutes les églises sous la supervision du <strong className="text-white">Pasteur Narcisse HAMY</strong>.
            </p>
            
            <div className="flex items-center justify-center space-x-6 text-white/60 text-sm mt-6">
              <span>© {new Date().getFullYear()} ICC Dijon</span>
              <span>•</span>
              <span>Tous droits réservés</span>
            </div>
          </div>
        </footer>
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