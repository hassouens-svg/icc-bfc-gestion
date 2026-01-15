import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, UserPlus, ArrowLeft, Target, BookOpen } from 'lucide-react';

const BergeriesChoixPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="p-4">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🌿 Bergeries</h1>
          <p className="text-gray-600 mt-2">Choisissez le type de bergerie</p>
        </div>

        {/* Bouton Stratégies */}
        <div className="mb-8">
          <Button 
            onClick={() => navigate('/bergeries/strategies')}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-lg shadow-lg"
          >
            <BookOpen className="h-6 w-6 mr-3" />
            Voir les différentes stratégies pour attirer et fidéliser les âmes
            <Target className="h-6 w-6 ml-3" />
          </Button>
        </div>

        {/* Choix des bergeries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bergerie (ex Promotion) */}
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all hover:border-purple-400 hover:bg-purple-50 group"
            onClick={() => navigate('/bergeries-promotions')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-700 transition-colors">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Bergerie</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Accéder
              </Button>
            </CardContent>
          </Card>

          {/* Bergerie (ex Groupes de disciples) */}
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all hover:border-green-400 hover:bg-green-50 group"
            onClick={() => navigate('/bergeries-disciples')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-700 transition-colors">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Bergerie</CardTitle>
              <p className="text-sm text-gray-500">(ex Groupes de Disciples)</p>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Accéder
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bannière 2026 */}
        <div className="mt-12">
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-center text-white shadow-xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              🎯 2026, année du discipolat
            </h2>
            <p className="text-sm md:text-base font-medium opacity-95">
              Objectif <span className="text-yellow-300 font-bold text-xl">1000</span> disciples affermis du Christ
              en Bourgogne Franche-Comté en 2026
            </p>
            <p className="text-sm mt-2 opacity-80">🙏 La BFC pour Christ</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BergeriesChoixPage;
