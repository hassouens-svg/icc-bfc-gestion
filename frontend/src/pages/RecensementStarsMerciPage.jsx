import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { CheckCircle, Star, Home } from 'lucide-react';

const RecensementStarsMerciPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardContent className="pt-12 pb-8 px-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <CheckCircle className="h-20 w-20 text-green-500" />
              <Star className="h-8 w-8 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Merci pour votre inscription ! ⭐
          </h1>
          
          <p className="text-gray-600 mb-8 text-lg">
            Vous êtes maintenant inscrit(e) dans le ministère des Stars. 
            Que Dieu vous bénisse pour votre engagement et votre service !
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <p className="text-green-700 text-sm">
              📋 Votre inscription a été enregistrée avec succès. 
              Le responsable de votre département vous contactera prochainement.
            </p>
          </div>
          
          <Button 
            onClick={() => navigate('/')} 
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Home className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecensementStarsMerciPage;
