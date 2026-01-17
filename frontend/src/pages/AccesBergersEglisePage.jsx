import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Church, ArrowLeft } from 'lucide-react';
import { login, getCities } from '../utils/api';
import { toast } from 'sonner';

const AccesBergersEglisePage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(true);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const citiesData = await getCities();
        setCities(citiesData);
      } catch (error) {
        console.log('Error in AccesBergersEglisePage.useEffect');
        toast.error('Erreur lors du chargement des villes');
      } finally {
        setLoadingCities(false);
      }
    };
    loadCities();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password || !city) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const result = await login(username, password, city);
      
      // Vérifier que c'est bien un responsable d'église
      if (result.user.role !== 'responsable_eglise') {
        toast.error('Accès réservé aux Responsables d\'Église uniquement');
        setLoading(false);
        return;
      }
      
      toast.success('Connexion réussie!');
      
      // Définir un département par défaut (promotions) pour la navigation
      localStorage.setItem('selected_department', 'promotions');
      
      // Rediriger directement vers le dashboard complet
      navigate('/dashboard-superadmin-complet');
    } catch (error) {
      console.log('Error in AccesBergersEglisePage.handleLogin');
      toast.error(error.response?.data?.detail || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 p-4">
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
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Church className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Accès Bergers d'Église
            </CardTitle>
            <p className="text-gray-600">
              Responsables d'Église - Gestion complète de votre ville
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="city">Votre Ville *</Label>
                <Select value={city} onValueChange={setCity} disabled={loadingCities}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur *</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Votre identifiant"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                />
              </div>

              <div className="bg-purple-50 p-3 rounded-lg text-sm">
                <p className="text-purple-700 text-center">
                  🏛️ <strong>Accès réservé aux Responsables d'Église</strong>
                </p>
                <p className="text-purple-600 text-center text-xs mt-1">
                  Vous aurez accès à toutes les données de votre ville
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                disabled={loading || loadingCities}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccesBergersEglisePage;
