import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { MapPin, Users, Heart, BookOpen } from 'lucide-react';

const IntroductionFIPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mb-6 shadow-lg">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Bienvenue dans la famille ! 🎉
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Votre inscription a été prise en compte avec succès !
            </p>
          </div>

          {/* Main Content Card */}
          <Card className="p-8 md:p-12 shadow-2xl border-0 bg-white/80 backdrop-blur">
            {/* Section Titre */}
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-indigo-900 mb-4">
                Qu'est-ce qu'une Famille d'Impact ? 🏠
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto rounded-full"></div>
            </div>

            {/* Texte explicatif */}
            <div className="mb-12 bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl border-2 border-indigo-100">
              <p className="text-lg leading-relaxed text-gray-700 text-center max-w-4xl mx-auto">
                Les <strong className="text-indigo-700">Familles d'Impact</strong> sont des <strong>églises de maisons</strong>, 
                des <strong>cellules de prière</strong> où les frères et sœurs de la même église se réunissent les <strong>jeudis soirs</strong> pour 
                revenir sur la prédication du dimanche, méditer et prier ensemble et les uns pour les autres, grandir dans la 
                relation avec Dieu et faire la communion fraternelle ensemble.
              </p>
              <div className="mt-6 flex justify-center">
                <div className="inline-flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-md">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-700">Jeudis soirs • Prière • Communion</span>
                </div>
              </div>
            </div>

            {/* Section Avantages */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
                Le parfait tremplin pour :
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-blue-900 mb-2">S'intégrer</h4>
                  <p className="text-sm text-blue-700">Rejoindre facilement la communauté</p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-purple-900 mb-2">Se faire des amis</h4>
                  <p className="text-sm text-purple-700">Créer des liens en Christ</p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-green-900 mb-2">Être entouré</h4>
                  <p className="text-sm text-green-700">Grandir spirituellement ensemble</p>
                </div>
              </div>
            </div>

            {/* Photos Grid */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
                Découvrez nos Familles d'Impact en action 📸
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:scale-105">
                  <img 
                    src="https://customer-assets.emergentagent.com/job_pastoral-dash/artifacts/1rnle3pu_5888b9ed-10e8-4640-a899-930623b2e50e.jpeg" 
                    alt="Famille d'Impact - Célébration"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:scale-105">
                  <img 
                    src="https://customer-assets.emergentagent.com/job_pastoral-dash/artifacts/03v1wsbs_2a236726-720b-4658-ab7b-83406d67058c.jpeg" 
                    alt="Famille d'Impact - Réunion de prière"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:scale-105">
                  <img 
                    src="https://customer-assets.emergentagent.com/job_pastoral-dash/artifacts/etnlwufa_3d903a17-020a-431a-9b19-edf394f0c1f9.jpeg" 
                    alt="Famille d'Impact - Famille avec enfants"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:scale-105">
                  <img 
                    src="https://customer-assets.emergentagent.com/job_pastoral-dash/artifacts/5x6egk7n_27658ef1-3ba9-45c1-8886-63e35f64a8b0.jpeg" 
                    alt="Famille d'Impact - Communion fraternelle"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <button
                onClick={() => navigate('/trouver-ma-fi')}
                className="group relative inline-flex items-center justify-center px-12 py-6 text-xl font-bold text-white bg-gradient-to-r from-green-500 via-emerald-600 to-green-600 rounded-2xl shadow-2xl hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <MapPin className="w-8 h-8 mr-3 relative z-10 animate-bounce" />
                <span className="relative z-10">
                  Retrouve la Famille d'Impact la plus proche de chez toi !
                </span>
              </button>
              <p className="mt-6 text-sm text-gray-500">
                📍 Localise en quelques clics la FI la plus proche de ton domicile
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="mt-12 pt-8 border-t flex justify-center space-x-4">
              <Button 
                onClick={() => navigate('/')} 
                variant="outline"
                className="text-gray-600"
              >
                Retour à l'accueil
              </Button>
              <Button 
                onClick={() => navigate('/login')} 
                variant="outline"
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                Se connecter
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IntroductionFIPage;
