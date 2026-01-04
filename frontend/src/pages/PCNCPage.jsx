import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, GraduationCap, Clock } from 'lucide-react';

const PCNCPage = () => {
  const navigate = useNavigate();

  const classes = [
    {
      id: '001',
      title: 'Classe 001',
      description: 'Fondements de la foi',
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: '101',
      title: 'Classe 101',
      description: 'Maturité spirituelle',
      color: 'from-green-400 to-green-600'
    },
    {
      id: '201',
      title: 'Classe 201',
      description: 'Ministère et service',
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 'rtt',
      title: 'RTT',
      description: 'Rencontre Transformatrice de la Trinité',
      color: 'from-orange-400 to-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <GraduationCap className="h-10 w-10 text-teal-600" />
              <h1 className="text-4xl font-bold text-gray-900">PCNC</h1>
            </div>
            <p className="text-xl text-gray-600">Parcours de Croissance de la Nouvelle Création</p>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((classe) => (
            <Card 
              key={classe.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/pcnc/${classe.id}`)}
            >
              <div className={`h-2 bg-gradient-to-r ${classe.color}`}></div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-2xl">{classe.title}</span>
                  <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">À venir</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{classe.description}</p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-500 italic">Contenu en cours de préparation...</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <Card className="mt-8 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg text-teal-800">
                📚 Le PCNC est un parcours structuré pour accompagner chaque croyant dans sa croissance spirituelle.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Les contenus des différentes classes seront bientôt disponibles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PCNCPage;
