import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowLeft, Target, Users, Heart, BookOpen, Shield, Star, Home, ChevronDown, ChevronUp } from 'lucide-react';

// Données OKR Bergerie ROYALTY
const OKR_DATA = [
  {
    id: 1,
    objectif: "Attirer les âmes",
    icon: Users,
    color: "bg-blue-500",
    resultats: [
      {
        cible: 18,
        actions: ["Intercession pour les âmes", "Sorties d'évangélisation", "Communication par RS", "Communion fraternelle"]
      },
      {
        cible: 18,
        actions: ["Challenge «ramène ton pote» dans la bergerie", "Journée Gospel en extérieur", "Activités, jeux"]
      },
      {
        cible: 18,
        actions: ["Communion fraternelle", "FIJ", "Intercession", "Repérage pendant les cultes"]
      }
    ]
  },
  {
    id: 2,
    objectif: "Faire revenir les éloignés ou perdues",
    icon: Heart,
    color: "bg-red-500",
    resultats: [
      {
        cible: null,
        actions: ["Intercession", "Sorties d'évangélisation", "Communication par RS", "Communion fraternelle"]
      },
      {
        cible: null,
        actions: ["Challenge «ramène ton pote» dans la bergerie", "Journée Gospel en extérieur", "Activités, jeux"]
      },
      {
        cible: null,
        actions: ["Communion fraternelle", "FIJ", "Intercession", "Repérage pendant les cultes"]
      }
    ]
  },
  {
    id: 3,
    objectif: "Fidéliser les âmes",
    icon: Star,
    color: "bg-yellow-500",
    resultats: [
      {
        cible: 18,
        actions: ["Agapés, sorties bowling, casting, jeux,.. 1/mois", "Co-voiturage pour venir et rentrer des programmes", "Phonning", "Intérêt et être en mesure de répondre aux besoins de la personne", "Temps de prière"]
      },
      {
        cible: 18,
        actions: ["Phonning", "Visites", "Attribution de tuteurs dans la bergerie", "Entraide (hébergement, administration, social,…)"]
      },
      {
        cible: 18,
        actions: ["Covoiturage", "Phonning", "Intercession", "Temps de prières pour les sujets de chacun"]
      }
    ]
  },
  {
    id: 4,
    objectif: "Édifier, construire, guérir et transformer les vies",
    icon: BookOpen,
    color: "bg-green-500",
    resultats: [
      {
        cible: 18,
        actions: ["Enseignements des apôtres et pasteurs", "Le pain du Jour", "Impact X", "Smart ICC", "ICC TV", "Commande au matin", "Livres"]
      },
      {
        cible: 18,
        actions: ["Enseignements des apôtres et pasteurs", "Le pain du Jour", "Impact X", "Smart ICC", "ICC TV", "Commande au matin", "Livres"]
      },
      {
        cible: 18,
        actions: ["Enseignements des apôtres et pasteurs", "Le pain du Jour", "Impact X", "Smart ICC", "ICC TV", "Commande au matin", "Livres"]
      }
    ]
  },
  {
    id: 5,
    objectif: "Déployer les âmes embrasées qui sentent l'appel brûlant en eux",
    icon: Target,
    color: "bg-orange-500",
    resultats: [
      {
        cible: null,
        actions: ["Responsabiliser les embrasés sur certaines tâches dans la bergerie et les confier le suivi des nouvelles âmes"]
      },
      {
        cible: null,
        actions: ["Responsabiliser les embrasés sur certaines tâches dans la bergerie et les confier le suivi des nouvelles âmes"]
      },
      {
        cible: null,
        actions: ["Responsabiliser les embrasés sur certaines tâches dans la bergerie et les confier le suivi des nouvelles âmes"]
      }
    ]
  },
  {
    id: 6,
    objectif: "Connecter les brebis (pour qu'ils se rencontrent pour mariage, affaires etc)",
    icon: Heart,
    color: "bg-pink-500",
    resultats: [
      {
        cible: 18,
        actions: ["Atelier spécial mariage", "Création d'un registre des célibataires dans la bergerie", "Temps de prière pour le mariage", "Gala des célibataires intra et inter bergeries"]
      },
      {
        cible: 18,
        actions: ["Atelier spécial mariage", "Création d'un registre des célibataires dans la bergerie", "Temps de prière pour le mariage", "Gala des célibataires intra et inter bergeries"]
      },
      {
        cible: 18,
        actions: ["Gala des célibataires", "Ateliers pour les célibataires", "Temps Dating"]
      }
    ]
  },
  {
    id: 7,
    objectif: "Préparer à briller nos membres (Briller pour influencer et faire des disciples)",
    icon: Star,
    color: "bg-amber-500",
    resultats: [
      { cible: 18, actions: [] },
      { cible: 18, actions: [] },
      { cible: 18, actions: [] }
    ]
  },
  {
    id: 8,
    objectif: "Assister les nécessiteux et ne laisser personne sur le carreau",
    icon: Heart,
    color: "bg-purple-500",
    resultats: [
      {
        cible: null,
        actions: ["Création d'une caisse sociale et d'une banque sociale dans la bergerie"]
      },
      {
        cible: null,
        actions: ["Création d'une caisse sociale et d'une banque sociale dans la bergerie"]
      },
      {
        cible: null,
        actions: ["Création d'une caisse sociale et d'une banque sociale dans la bergerie"]
      }
    ]
  },
  {
    id: 9,
    objectif: "Mettre en place un niveau plus accru de protection des âmes, une détection plus rapide des abus et des signalements des dangers, des loups ravisseurs",
    icon: Shield,
    color: "bg-red-600",
    resultats: [
      {
        cible: null,
        actions: ["CSA - Cellule de signalisation des abus"]
      },
      {
        cible: null,
        actions: ["CSA - Cellule de signalisation des abus"]
      },
      {
        cible: null,
        actions: ["CSA - Cellule de signalisation des abus"]
      }
    ]
  },
  {
    id: 10,
    objectif: "Évaluer chaque semaine et chaque mois le niveau d'engagement et de progrès de chaque responsable leader piliers",
    icon: Target,
    color: "bg-indigo-500",
    resultats: [
      {
        cible: null,
        actions: ["Formulaire d'évaluation anonyme où les âmes peuvent juger les bergers de chaque bergerie"]
      },
      {
        cible: null,
        actions: ["Formulaire d'évaluation anonyme où les âmes peuvent juger les bergers de chaque bergerie"]
      },
      {
        cible: null,
        actions: ["Formulaire d'évaluation anonyme où les âmes peuvent juger les bergers de chaque bergerie"]
      }
    ]
  },
  {
    id: 11,
    objectif: "Identifier qui sont véritablement les disciples",
    icon: Users,
    color: "bg-teal-500",
    resultats: [
      { cible: null, actions: [] },
      { cible: null, actions: [] },
      { cible: null, actions: [] }
    ]
  },
  {
    id: 12,
    objectif: "Transformer chaque nouveau converti en disciple affermi dans les 3 premiers mois de sa conversion. Faire en sorte qu'il demeure bien enraciné bien entouré et dans le Christ",
    icon: BookOpen,
    color: "bg-emerald-500",
    resultats: [
      {
        cible: 18,
        actions: ["Enseignements des apôtres et pasteurs", "Le pain du Jour", "Impact X", "Smart ICC", "ICC TV", "Commande au matin", "Livres"]
      },
      {
        cible: 18,
        actions: ["Enseignements des apôtres et pasteurs", "Le pain du Jour", "Impact X", "Smart ICC", "ICC TV", "Commande au matin", "Livres"]
      },
      {
        cible: 18,
        actions: ["Enseignements des apôtres et pasteurs", "Le pain du Jour", "Impact X", "Smart ICC", "ICC TV", "Commande au matin", "Livres"]
      }
    ]
  },
  {
    id: 13,
    objectif: "Remplir les cultes",
    icon: Home,
    color: "bg-blue-600",
    resultats: [
      {
        cible: "70%",
        actions: ["Phonning", "Co-voiturage"]
      },
      {
        cible: "70%",
        actions: ["Phonning", "Co-voiturage"]
      },
      {
        cible: "70%",
        actions: ["Phonning", "Co-voiturage"]
      }
    ]
  },
  {
    id: 14,
    objectif: "Mettre en place un système de défense de la e-réputation d'ICC",
    icon: Shield,
    color: "bg-gray-600",
    resultats: [
      { cible: null, actions: [] },
      { cible: null, actions: [] },
      { cible: null, actions: [] }
    ]
  },
  {
    id: 15,
    objectif: "Multiplier par 3 le nombre de FI",
    icon: Target,
    color: "bg-cyan-500",
    resultats: [
      { cible: 2, actions: [] },
      { cible: 2, actions: [] },
      { cible: 2, actions: [] }
    ]
  }
];

const StrategiesBergeriePage = () => {
  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/bergeries')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Stratégies Bergerie</h1>
                <p className="text-sm text-gray-500">OKR - Objectifs et Résultats Clés (à atteindre d'ici 4 mois)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Titre */}
        <Card className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0">
          <CardContent className="py-6">
            <h2 className="text-2xl font-bold text-center">
              Stratégies pour Attirer et Fidéliser les Âmes
            </h2>
            <p className="text-center text-purple-100 mt-2">
              Bergerie ROYALTY - OKR ICC
            </p>
          </CardContent>
        </Card>

        {/* Tableau responsive */}
        <div className="space-y-4">
          {OKR_DATA.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedRows[item.id];
            const hasActions = item.resultats.some(r => r.actions && r.actions.length > 0);
            
            return (
              <Card key={item.id} className="overflow-hidden">
                <div 
                  className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 ${hasActions ? '' : 'opacity-70'}`}
                  onClick={() => hasActions && toggleRow(item.id)}
                >
                  <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center text-white flex-shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-500">#{item.id}</span>
                      <h3 className="font-semibold text-gray-900">{item.objectif}</h3>
                    </div>
                    {/* Afficher les cibles */}
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {item.resultats.map((r, idx) => (
                        r.cible && (
                          <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            RC{idx + 1}: {r.cible}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                  {hasActions && (
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  )}
                </div>
                
                {/* Détails expandables */}
                {isExpanded && hasActions && (
                  <div className="border-t bg-gray-50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {item.resultats.map((resultat, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-4 border">
                          <h4 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs">
                              {idx + 1}
                            </span>
                            Résultat Clé {idx + 1}
                            {resultat.cible && (
                              <span className="ml-auto text-sm bg-purple-600 text-white px-2 py-0.5 rounded">
                                Cible: {resultat.cible}
                              </span>
                            )}
                          </h4>
                          {resultat.actions && resultat.actions.length > 0 ? (
                            <ul className="space-y-1">
                              {resultat.actions.map((action, actionIdx) => (
                                <li key={actionIdx} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-purple-500 mt-1">•</span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-400 italic">Aucune action définie</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Légende */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <h4 className="font-semibold mb-2">Légende</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <span><strong>RC</strong> = Résultat Clé</span>
              <span><strong>18</strong> = Objectif de 18 personnes</span>
              <span><strong>70%</strong> = Taux de participation visé</span>
              <span><strong>FI</strong> = Famille d'Impact</span>
              <span><strong>RS</strong> = Réseaux Sociaux</span>
              <span><strong>FIJ</strong> = Famille d'Impact Jeunes</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StrategiesBergeriePage;
