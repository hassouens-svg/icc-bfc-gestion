import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { MapPin, Lock, LogIn, ArrowLeft, Users } from 'lucide-react';
import { toast } from 'sonner';
import { login } from '../utils/api';

const BergeriesLoginPage = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(true);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cities/public`);
      if (response.ok) {
        const citiesData = await response.json();
        const cityNames = citiesData.map(city => typeof city === 'string' ? city : city.name);
        setCities(cityNames.filter(Boolean));
      } else {
        setCities(['Dijon', 'Paris', 'Lyon']);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      setCities(['Dijon', 'Paris', 'Lyon']);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!selectedCity) {
      toast.error('Veuillez sélectionner une ville');
      return;
    }
    
    if (!username || !password) {
      toast.error('Veuillez entrer vos identifiants');
      return;
    }

    setLoading(true);
    try {
      const data = await login(username, password);
      
      // Vérifier que l'utilisateur a le bon rôle
      const allowedRoles = ['berger', 'responsable_promo', 'responsable_promos', 'superviseur_promos', 'promotions', 'referent', 'super_admin', 'pasteur'];
      if (!allowedRoles.includes(data.user.role)) {
        toast.error('Accès non autorisé pour ce rôle');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return;
      }
      
      // Stocker les infos
      localStorage.setItem('selected_department', 'promotions');
      
      toast.success('Connexion réussie!');
      
      // Rediriger vers la sélection de bergerie
      navigate(`/bergeries-select?ville=${encodeURIComponent(selectedCity)}`);
      
    } catch (error) {
      toast.error(error.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCities) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="p-4">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-4">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">🌿 Bergeries</h1>
            <p className="text-gray-600 mt-2">Espace Bergers & Responsables de Promo</p>
          </div>

          {/* Login Card */}
          <Card className="shadow-xl border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-center">Connexion</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Sélection de la ville */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    Ville
                  </Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Identifiant */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-purple-600" />
                    Identifiant
                  </Label>
                  <Input
                    type="text"
                    placeholder="Votre identifiant"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>

                {/* Mot de passe */}
                <div className="space-y-2">
                  <Label>Mot de passe</Label>
                  <Input
                    type="password"
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                {/* Bouton de connexion */}
                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Accès réservé aux bergers et responsables de promotion
          </p>
        </div>
      </div>

      {/* Bannière 2026 */}
      <div className="p-4">
        <div className="max-w-md mx-auto bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-center text-white shadow-xl">
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            🎯 2026, année du discipolat
          </h2>
          <p className="text-sm md:text-base font-medium opacity-95">
            Objectif <span className="text-yellow-300 font-bold text-lg">1000</span> disciples affermis du Christ
            <br />
            en Bourgogne Franche-Comté en 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default BergeriesLoginPage;
