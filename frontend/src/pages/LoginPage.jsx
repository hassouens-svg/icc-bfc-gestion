import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, isAuthenticated } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Récupérer l'URL de retour depuis le state
  const returnTo = location.state?.returnTo;

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(returnTo || '/dashboard');
    }
  }, [navigate, returnTo]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      // La ville est déjà attribuée au compte, pas besoin de la sélectionner
      const result = await login(username, password, 'auto', null);
      
      toast.success('Connexion réussie!');
      
      // Clear session storage
      sessionStorage.removeItem('selectedCity');
      sessionStorage.removeItem('selectedDepartment');
      
      // PRIORITY 1: Use returnTo from location state if exists
      if (returnTo) {
        navigate(returnTo);
        return;
      }
      
      // Check if there's a redirect destination stored
      const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      
      // PRIORITY 2: Use redirectAfterLogin if it exists
      if (redirectAfterLogin) {
        navigate(redirectAfterLogin);
        return;
      }
      
      // Default navigation based on role
      const role = result.user.role;
      
      if (role === 'super_admin') {
        navigate('/select-account');
      } else if (role === 'pasteur') {
        navigate('/select-account');
      } else if (role === 'superviseur_promos') {
        navigate('/dashboard-superviseur-promos');
      } else if (role === 'responsable_eglise') {
        navigate('/dashboard');
      } else if (role === 'berger' || role === 'promotions') {
        navigate('/dashboard');
      } else if (role === 'accueil') {
        navigate('/dashboard');
      } else if (role === 'star' || role === 'respo_departement') {
        navigate('/ministere-stars/dashboard');
      } else {
        navigate('/dashboard');
      }
      
    } catch (error) {
      toast.error(error.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <img 
              src="https://customer-assets.emergentagent.com/job_dijon-icc-hub/artifacts/foeikpvk_IMG_2590.png" 
              alt="ICC Logo" 
              className="h-24 w-24 object-contain rounded-full"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-indigo-600">
            ICC BFC-ITALIE Connect
          </CardTitle>
          <CardDescription>Département de l'accueil, de l'intégration et des bergeries</CardDescription>
          <CardDescription className="text-xs mt-1">Gestion des nouveaux arrivants et nouveaux convertis</CardDescription>
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
                placeholder="Entrez votre nom d'utilisateur"
                data-testid="username-input"
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
                data-testid="password-input"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
              data-testid="login-button"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button 
              variant="link" 
              className="text-sm text-gray-500"
              onClick={() => navigate('/')}
            >
              ← Retour à l'accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
