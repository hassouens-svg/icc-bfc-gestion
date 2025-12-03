import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getCities, initData, isAuthenticated } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
    
    // Get pre-selected city and department from home page
    const preSelectedCity = sessionStorage.getItem('selectedCity');
    const preSelectedDept = sessionStorage.getItem('selectedDepartment');
    
    if (preSelectedCity) {
      setCity(preSelectedCity);
    }
    
    // Load cities only, don't call initData
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
      // Pour pasteur et superadmin, pas besoin de ville - on va leur demander après
      // Pour les autres, on vérifie la ville
      let cityToUse = city;
      
      // Tentative de login pour vérifier le rôle
      const result = await login(username, password, cityToUse || 'temp', null);
      
      const isSpecialAccess = ['pasteur', 'super_admin'].includes(result.user.role);
      
      if (!isSpecialAccess && !city) {
        toast.error('Veuillez sélectionner une ville');
        setLoading(false);
        return;
      }
      
      toast.success('Connexion réussie!');
      
      // Clear session storage
      sessionStorage.removeItem('selectedCity');
      sessionStorage.removeItem('selectedDepartment');
      
      // Redirect pasteur/superadmin to account selection page
      if (isSpecialAccess) {
        navigate('/select-account');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_dijon-icc-hub/artifacts/foeikpvk_IMG_2590.png" 
              alt="ICC Logo" 
              className="h-24 w-24 object-contain rounded-full"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-indigo-600">
            ICC BFC-ITALIE {city ? `- ${city}` : ''} Connect
          </CardTitle>
          <CardDescription>Département de l'accueil, de l'intégration et des promotions</CardDescription>
          <CardDescription className="text-xs mt-1">Gestion des nouveaux arrivants et nouveaux convertis</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {username !== 'pasteur' && username !== 'superadmin' && (
              <div className="space-y-2">
                <Label htmlFor="city">Ville / City</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger data-testid="city-select">
                    <SelectValue placeholder="Sélectionnez votre ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...cities]
                      .sort((a, b) => {
                        const nameA = a?.name || '';
                        const nameB = b?.name || '';
                        return nameA.localeCompare(nameB);
                      })
                      .map((c) => (
                        <SelectItem key={c.id} value={c.name} data-testid={`city-option-${c.name}`}>
                          {c.name} ({c.country || 'France'})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {(username === 'pasteur' || username === 'superadmin') && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  ℹ️ Accès multi-villes - Pas besoin de sélectionner une ville
                </p>
              </div>
            )}

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
              className="w-full" 
              disabled={loading}
              data-testid="login-button"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>

            <div className="text-center pt-4 space-y-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm text-indigo-600 hover:underline block w-full"
              >
                ← Retour à l'accueil
              </button>
              <a 
                href="/register" 
                className="text-sm text-indigo-600 hover:underline block"
                data-testid="register-link"
              >
                Nouveau nouveaux arrivants et nouveaux convertis? S'inscrire ici
              </a>
              
              {/* Info My Events Church */}
              <div className="mt-4 pt-4 border-t">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl">📅</span>
                    <h4 className="font-semibold text-gray-800">My Events Church</h4>
                  </div>
                  <p className="text-xs text-center text-gray-600">
                    Connectez-vous pour accéder à la gestion de projets et communication
                  </p>
                  <p className="text-xs text-center text-gray-500 mt-1">
                    Accès réservé : Pasteur, Super Admin, Resp. Église, Gestion Projet
                  </p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
