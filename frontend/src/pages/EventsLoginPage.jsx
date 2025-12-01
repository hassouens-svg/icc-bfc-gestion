import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getCities, isAuthenticated, getUser } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Calendar, ArrowLeft } from 'lucide-react';

const EventsLoginPage = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Si déjà connecté, vérifier les permissions
    if (isAuthenticated()) {
      const user = getUser();
      const allowedRoles = ['super_admin', 'pasteur', 'responsable_eglise', 'gestion_projet'];
      if (allowedRoles.includes(user?.role)) {
        navigate('/events-management');
      } else {
        // Connecté mais pas autorisé - rester sur la page de login avec un message
        toast.error('Votre compte n\'a pas accès à My Events Church. Veuillez vous connecter avec un compte autorisé.');
      }
    }
    
    // Load cities
    const loadData = async () => {
      try {
        const citiesData = await getCities();
        setCities(citiesData);
      } catch (error) {
        // Silent fail
      }
    };
    loadData();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      // Pour super_admin et pasteur, on utilise une ville par défaut
      // Pour les autres rôles, la ville doit être sélectionnée
      let loginCity = city || 'Dijon'; // Ville sélectionnée ou Dijon par défaut
      
      const result = await login(username, password, loginCity, null);
      
      // Vérifier si l'utilisateur a les permissions pour My Events Church
      const allowedRoles = ['super_admin', 'pasteur', 'responsable_eglise', 'gestion_projet'];
      if (allowedRoles.includes(result.user.role)) {
        // Si le rôle n'est pas super_admin ou pasteur, vérifier que la ville a été sélectionnée
        if (!['super_admin', 'pasteur'].includes(result.user.role) && !city) {
          toast.error('Veuillez sélectionner votre ville');
          setLoading(false);
          return;
        }
        
        toast.success('Connexion réussie! Redirection...');
        // Redirection directe vers My Events Church
        navigate('/events-management');
      } else {
        // Déconnecter l'utilisateur s'il n'a pas les permissions
        localStorage.clear();
        toast.error('Accès refusé. Votre rôle n\'est pas autorisé pour My Events Church.');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-4 rounded-full">
              <Calendar className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
            My Events Church
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Gestion de projets et communication en masse
          </CardDescription>
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
                required
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
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" 
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>

            {/* Info box */}
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                ℹ️ Accès réservé
              </p>
              <p className="text-xs text-blue-800">
                Ce module est accessible aux rôles suivants :
              </p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• Pasteur</li>
                <li>• Super Administrateur</li>
                <li>• Responsable d'Église</li>
                <li>• Gestion Projet</li>
              </ul>
            </div>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm text-indigo-600 hover:underline flex items-center justify-center gap-2 w-full"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à l'accueil
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventsLoginPage;
