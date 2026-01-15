import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Music, Calendar, Star } from 'lucide-react';

const EJPPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
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
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Star className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">EJP</h1>
          <p className="text-gray-600 mt-2">Église des Jeunes Prodiges</p>
        </div>

        {/* Cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Carte Cultes */}
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all hover:border-pink-400 hover:bg-pink-50 group"
            onClick={() => navigate('/ejp/cultes')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-pink-700 transition-colors">
                <Music className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Cultes</CardTitle>
              <p className="text-sm text-gray-500">Audios des cultes EJP</p>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full bg-pink-600 hover:bg-pink-700">
                Accéder
              </Button>
            </CardContent>
          </Card>

          {/* Carte Planning Exhortation */}
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all hover:border-rose-400 hover:bg-rose-50 group"
            onClick={() => navigate('/ejp/planning-exhortation')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-rose-700 transition-colors">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Planning Exhortation</CardTitle>
              <p className="text-sm text-gray-500">Programmation des exhortateurs</p>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full bg-rose-600 hover:bg-rose-700">
                Accéder
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EJPPage;
