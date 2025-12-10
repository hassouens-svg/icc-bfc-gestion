import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

const MinistereStarsLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '', city: '' });
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [showCitySelect, setShowCitySelect] = useState(false);
  const [tempUser, setTempUser] = useState(null);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cities`);
      const data = await response.json();
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.username, formData.password);
      
      if (!['super_admin', 'pasteur', 'responsable_eglise', 'ministere_stars'].includes(result.user.role)) {
        toast.error('Accès refusé - Rôle non autorisé');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }

      // Si c'est responsable_eglise ou ministere_stars, demander la ville
      if (['responsable_eglise', 'ministere_stars'].includes(result.user.role)) {
        setTempUser(result.user);
        setShowCitySelect(true);
        setLoading(false);
        return;
      }

      // Pour superadmin et pasteur, connexion directe
      toast.success('Connexion réussie !');
      navigate('/ministere-stars/dashboard');
    } catch (error) {
      toast.error('Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city) => {
    if (tempUser) {
      // Mettre à jour l'utilisateur avec la ville sélectionnée
      const updatedUser = { ...tempUser, city };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Connexion réussie !');
      navigate('/ministere-stars/dashboard');
    }
  };

  if (showCitySelect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">🏙️</div>
            <CardTitle className="text-2xl font-bold text-orange-600">Sélectionnez votre ville</CardTitle>
            <CardDescription>Choisissez la ville pour laquelle vous souhaitez voir les données</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cities.map((city, idx) => (
                <Button
                  key={idx}
                  onClick={() => handleCitySelect(city.name)}
                  variant="outline"
                  className="w-full h-auto py-4 text-lg hover:bg-orange-50 hover:border-orange-300"
                >
                  {city.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">⭐</div>
          <CardTitle className="text-3xl font-bold text-orange-600">Ministère des STARS</CardTitle>
          <CardDescription>Suivi et bien-être des stars de l'église</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
            
            {/* Sélection ville - visible pour tous */}
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <select
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="">Sélectionnez votre ville</option>
                {cities.map((city, idx) => (
                  <option key={idx} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/')}>
              Retour à l'accueil
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MinistereStarsLoginPage;
