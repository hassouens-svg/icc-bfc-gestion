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
      
      // Rediriger selon le rôle
      if (data.user.role === 'super_admin') {
        navigate('/dashboard-superadmin');
      } else if (data.user.role === 'pasteur') {
        navigate('/dashboard-pasteur');
      } else {
        navigate('/select-department');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        <Button 
          onClick={() => navigate('/')} 
          variant="ghost" 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Accès Spécifiques
            </CardTitle>
            <p className="text-gray-600">
              Réservé au Pasteur et au Super Administrateur
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="pasteur ou superadmin"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  autoComplete="current-password"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p className="text-blue-700 text-center">
                  💡 <strong>Accès réservé au Pasteur et au Super Administrateur</strong>
                </p>
                <p className="text-blue-600 text-center text-xs mt-1">Veuillez utiliser vos identifiants officiels</p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700" 
                disabled={loading}
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                ⚠️ Accès strictement confidentiel et réservé au personnel autorisé
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccesSpecifiquesPage;
