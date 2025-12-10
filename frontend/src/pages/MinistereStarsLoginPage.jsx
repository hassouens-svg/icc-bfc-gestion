import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

const MinistereStarsLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.username, formData.password);
      
      if (!['super_admin', 'pasteur', 'responsable_eglise', 'ministere_stars'].includes(result.user.role)) {
        toast.error('Accès refusé - Rôle non autorisé');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return;
      }

      toast.success('Connexion réussie !');
      navigate('/ministere-stars/dashboard');
    } catch (error) {
      toast.error('Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

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
