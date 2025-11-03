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
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
    
    // Initialize data and load cities
    const loadData = async () => {
      try {
        await initData();
        const citiesData = await getCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Error loading cities:', error);
      }
    };
    loadData();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!city || !username || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await login(username, password, city, department || null);
      toast.success('Connexion réussie!');
      navigate('/dashboard');
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
          <CardTitle className="text-3xl font-bold text-indigo-600">ICC Dijon Connect</CardTitle>
          <CardDescription>Connexion au système de suivi</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ville / City</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger data-testid="city-select">
                  <SelectValue placeholder="Sélectionnez votre ville" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.name} data-testid={`city-option-${c.name}`}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="department">Département (optionnel)</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger data-testid="department-select">
                  <SelectValue placeholder="Sélectionnez un département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accueil">Accueil et Intégration</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Laissez vide pour utiliser votre rôle par défaut</p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              data-testid="login-button"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>

            <div className="text-center pt-4">
              <a 
                href="/register" 
                className="text-sm text-indigo-600 hover:underline"
                data-testid="register-link"
              >
                Nouveau visiteur? S'inscrire ici
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
