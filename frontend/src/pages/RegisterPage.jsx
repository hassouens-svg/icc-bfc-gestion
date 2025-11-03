import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerVisitor, getCities } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    city: '',
    types: [],
    phone: '',
    email: '',
    address: '',
    arrival_channel: '',
    visit_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const visitorTypes = [
    'Nouveau Arrivant',
    'Nouveau Converti',
    'De Passage'
  ];

  const arrivalChannels = [
    'Evangelisation',
    'Réseaux sociaux',
    'Invitation par un membre (hors evangelisation)',
    'Par soi même'
  ];

  useEffect(() => {
    const loadCities = async () => {
      try {
        const citiesData = await getCities();
        setCities(citiesData);
      } catch (error) {
        // Silent fail
      }
    };
    loadCities();
  }, []);

  const handleTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.firstname || !formData.lastname || !formData.city || 
        formData.types.length === 0 || !formData.arrival_channel || !formData.phone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      await registerVisitor(formData);
      toast.success('Inscription réussie! Merci de votre visite.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_dijon-icc-hub/artifacts/foeikpvk_IMG_2590.png" 
              alt="ICC Logo" 
              className="h-20 w-20 object-contain rounded-full"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-teal-600">Bienvenue à ICC!</CardTitle>
          <CardDescription>Département de l'accueil, de l'intégration et des promotions</CardDescription>
          <CardDescription className="text-xs mt-1">Formulaire d'inscription pour nouveaux visiteurs</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">Prénom *</Label>
                <Input
                  id="firstname"
                  value={formData.firstname}
                  onChange={(e) => setFormData({...formData, firstname: e.target.value})}
                  placeholder="Votre prénom"
                  data-testid="firstname-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastname">Nom *</Label>
                <Input
                  id="lastname"
                  value={formData.lastname}
                  onChange={(e) => setFormData({...formData, lastname: e.target.value})}
                  placeholder="Votre nom"
                  data-testid="lastname-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville ICC *</Label>
              <Select value={formData.city} onValueChange={(value) => setFormData({...formData, city: value})}>
                <SelectTrigger data-testid="register-city-select">
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
              <Label>Type de visiteur *</Label>
              <div className="space-y-2">
                {visitorTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={formData.types.includes(type)}
                      onCheckedChange={() => handleTypeToggle(type)}
                      data-testid={`type-checkbox-${type}`}
                    />
                    <Label htmlFor={type} className="font-normal cursor-pointer">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Votre numéro de téléphone"
                  required
                  data-testid="phone-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (optionnel)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Votre email"
                  data-testid="email-input"
                />
              </div>
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse (optionnel)</Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Votre adresse complète"
                data-testid="address-input"
              />
            </div>
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="arrival_channel">Comment avez-vous connu ICC? *</Label>
              <Select value={formData.arrival_channel} onValueChange={(value) => setFormData({...formData, arrival_channel: value})}>
                <SelectTrigger data-testid="channel-select">
                  <SelectValue placeholder="Sélectionnez une option" />
                </SelectTrigger>
                <SelectContent>
                  {arrivalChannels.map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {channel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit_date">Date de visite *</Label>
              <Input
                id="visit_date"
                type="date"
                value={formData.visit_date}
                onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
                data-testid="visit-date-input"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              data-testid="register-submit-button"
            >
              {loading ? 'Inscription en cours...' : 'S\'inscrire'}
            </Button>

            <div className="text-center pt-4">
              <a 
                href="/login" 
                className="text-sm text-teal-600 hover:underline"
              >
                Retour à la connexion
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
