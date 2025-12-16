import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Users, TrendingUp, UserCheck, Shield, Church, Heart, Star, Book } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const [anniversaires, setAnniversaires] = React.useState([]);
  const [evenements, setEvenements] = React.useState([]);

  React.useEffect(() => {
    const loadAnniversaires = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stars/anniversaires`);
        const data = await response.json();
        console.log('🎂 Anniversaires chargés:', data);
        setAnniversaires(data);
        
        if (data && data.length > 0) {
          data.forEach((anniv, idx) => {
            setTimeout(() => {
              if (anniv.days_until === 0) {
                toast.info(`🎂 Aujourd'hui : Anniversaire de ${anniv.prenom}, ${anniv.ville || ''} (${anniv.date})`, {
                  duration: 5000,
                  position: 'top-center',
                });
              } else {
                toast(`🎂 Dans ${anniv.days_until} jour${anniv.days_until > 1 ? 's' : ''} : Anniversaire de ${anniv.prenom}, ${anniv.ville || ''} (${anniv.date})`, {
                  duration: 4000,
                  position: 'top-center',
                });
              }
            }, idx * 1000);
          });
        }
      } catch (error) {
        console.error('Erreur chargement anniversaires', error);
      }
    };

    const loadEvenements = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/upcoming`);
        const data = await response.json();
        console.log('🎉 Événements à venir chargés:', data);
        setEvenements(data);
        
        // Calculer le délai initial après les anniversaires
        const anniversaireDelay = anniversaires.length > 0 ? anniversaires.length * 1000 + 500 : 500;
        
        if (data && data.length > 0) {
          data.forEach((event, idx) => {
            setTimeout(() => {
              const emoji = event.days_until === 0 ? '🎊' : '🎉';
              const daysText = event.days_until === 0 
                ? "Aujourd'hui" 
                : event.days_until === 1 
                  ? "Demain" 
                  : `Dans ${event.days_until} jours`;
              
              toast.success(
                `${emoji} ${event.ville}: ${event.titre} - ${daysText} 🎊`, 
                {
                  duration: 5000,
                  position: 'top-center',
                }
              );
            }, anniversaireDelay + (idx * 1200));
          });
        }
      } catch (error) {
        console.error('Erreur chargement événements', error);
      }
    };

    loadAnniversaires();
    // Charger les événements après un court délai pour laisser les anniversaires se charger
    setTimeout(loadEvenements, 500);
  }, []);

  const handleDepartmentChoice = (deptId) => {
    if (deptId === 'acces-specifiques') {
      navigate('/acces-specifiques');
      return;
    }
    
    if (deptId === 'acces-bergers-eglise') {
      navigate('/acces-bergers-eglise');
      return;
    }

    if (deptId === 'ministere-stars') {
      navigate('/ministere-stars-login');
      return;
    }

    if (deptId === 'pain-du-jour') {
      navigate('/pain-du-jour');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Veuillez vous connecter');
      navigate('/login');
      return;
    }

    localStorage.setItem('selected_role', deptId);
    
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
      title: 'Bergeries',
      subtitle: '(promotions)',
      description: 'Suivi complet des nouveaux arrivants et nouveaux convertis avec les bergers',
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
      description: 'Enregistrement des activités d\'évangélisation',
      icon: Heart,
      color: 'from-red-400 to-pink-600'
    },
    {
      id: 'ministere-stars',
      title: 'Ministère des STARS',
      description: 'Suivi et bien-être des stars de l\'église',
      icon: Star,
      color: 'from-yellow-400 to-orange-500'
    },
    {
      id: 'pain-du-jour',
      title: 'Le Pain du Jour',
      description: 'Enseignements, prières prophétiques et versets quotidiens',
      icon: Book,
      color: 'from-amber-400 to-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient circles for background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl">
        {/* Logo */}
        <div className="flex justify-center mb-6 animate-fade-in">
          <div className="w-40 h-40 rounded-full bg-white shadow-2xl flex items-center justify-center border-8 border-white/20 backdrop-blur-sm">
            <img
              src="https://customer-assets.emergentagent.com/job_dijon-icc-hub/artifacts/foeikpvk_IMG_2590.png"
              alt="ICC Logo"
              className="w-32 h-32 object-contain rounded-full"
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-10 animate-fade-in-up">
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
            ICC BFC-ITALIE
          </h1>
          <p className="text-lg text-blue-100">Impact Centre Chrétien - Bourgogne-Franche-Comté et Italie</p>
        </div>

        {/* Department Cards */}
        <div className="w-full animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <h2 className="text-2xl font-semibold text-white text-center mb-6">
            Choisissez votre département
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {departments.map((dept) => {
              const Icon = dept.icon;
              return (
                <Card
                  key={dept.id}
                  className="cursor-pointer hover:scale-105 transition-all duration-300 bg-white/95 backdrop-blur-xl shadow-xl hover:shadow-blue-500/20 border-0 group"
                  onClick={() => handleDepartmentChoice(dept.id)}
                  data-testid={`dept-card-${dept.id}`}
                >
                  <CardContent className="p-5 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${dept.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      {dept.title}
                    </h3>
                    {dept.subtitle && (
                      <p className="text-xs text-gray-500 mb-2 italic">
                        {dept.subtitle}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {dept.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-10 text-center animate-fade-in" style={{animationDelay: '0.4s'}}>
          <p className="text-white/90 mb-3">Nouveau à l'église ?</p>
          <Button
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-xl px-6 py-4 text-base font-medium shadow-lg"
            onClick={() => navigate('/register')}
            data-testid="register-link-home"
          >
            S'inscrire ici
          </Button>
        </div>

        {/* My Events Church Section */}
        <div className="mt-8 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
          <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 border-0 shadow-2xl">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="text-4xl">📅</div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                My Events Church
              </h3>
              <p className="text-white/90 mb-4 max-w-2xl mx-auto text-sm">
                Gérez vos projets d'église, organisez des événements et communiquez avec votre communauté.
              </p>
              <Button
                onClick={() => navigate('/events-login')}
                size="lg"
                className="bg-white text-purple-700 hover:bg-gray-100 font-semibold px-6 py-4 shadow-lg"
              >
                Accéder à My Events Church →
              </Button>
              <p className="text-xs text-white/70 mt-3">
                Accès réservé : Pasteur, Super Admin, Responsable d'Église, Gestion Projet
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Copyright */}
        <footer className="mt-12 pb-6 text-center animate-fade-in border-t border-white/10 pt-6" style={{animationDelay: '0.6s'}}>
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Church className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ICC BFC-ITALIE</span>
            </div>
            
            <p className="text-white/80 text-sm leading-relaxed px-4">
              Cette application a été développée par <strong className="text-white">Impact Centre Chrétien - Campus de Dijon</strong> pour la gestion des différents départements sous la supervision du <strong className="text-white">Pasteur Narcisse HAMY</strong>.
            </p>
            
            <div className="flex items-center justify-center space-x-6 text-white/60 text-xs mt-4">
              <span>© {new Date().getFullYear()}</span>
              <span>•</span>
              <span>ICC BFC-ITALIE</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
