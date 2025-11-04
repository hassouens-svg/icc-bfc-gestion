import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Shield, ArrowLeft } from 'lucide-react';
import { login } from '../utils/api';
import { toast } from 'sonner';

const AccesSpecifiquesPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    // Vérifier que c'est bien pasteur ou superadmin
    if (username !== 'pasteur' && username !== 'superadmin') {
      toast.error('Accès non autorisé. Réservé au Pasteur et Super Admin uniquement.');
      return;
    }

    setLoading(true);
    try {
      // Login avec ville par défaut "Dijon" (requis par l'API)
      await login(username, password, 'Dijon', null);
      toast.success('Connexion réussie!');
      
      // Rediriger vers la page de sélection de département
      navigate('/select-department');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 p-4">
      <div className="w-full max-w-4xl">
        <Button 
          onClick={() => navigate('/')} 
          variant="ghost" 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Accès Spécifiques
          </h1>
          <p className="text-xl text-gray-600">
            Tableau de bord réservé au Pasteur et au Super Administrateur
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pasteur Card */}
          <Card 
            className="cursor-pointer hover:scale-105 transition-all duration-300 bg-white shadow-2xl hover:shadow-orange-500/20 border-0 group"
            onClick={() => handleLogin('pasteur')}
          >
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-3">
                Pasteur
              </h3>
              <p className="text-gray-600 mb-6">
                Accès complet multi-villes pour vue d'ensemble
              </p>
              <div className="bg-orange-50 p-4 rounded-lg text-sm text-left">
                <p className="font-semibold mb-2">Identifiants :</p>
                <p className="font-mono text-orange-700">Utilisateur: pasteur</p>
                <p className="font-mono text-orange-700">Mot de passe: pasteur123</p>
              </div>
              <Button className="w-full mt-4 bg-orange-600 hover:bg-orange-700">
                Se connecter
              </Button>
            </CardContent>
          </Card>

          {/* Super Admin Card */}
          <Card 
            className="cursor-pointer hover:scale-105 transition-all duration-300 bg-white shadow-2xl hover:shadow-red-500/20 border-0 group"
            onClick={() => handleLogin('super_admin')}
          >
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-3">
                Super Administrateur
              </h3>
              <p className="text-gray-600 mb-6">
                Contrôle total absolu sur toute l'application
              </p>
              <div className="bg-red-50 p-4 rounded-lg text-sm text-left">
                <p className="font-semibold mb-2">Identifiants :</p>
                <p className="font-mono text-red-700">Utilisateur: superadmin</p>
                <p className="font-mono text-red-700">Mot de passe: superadmin123</p>
              </div>
              <Button className="w-full mt-4 bg-red-600 hover:bg-red-700">
                Se connecter
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            ⚠️ Ces accès sont strictement confidentiels et réservés au personnel autorisé
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccesSpecifiquesPage;
