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
    age_range: '',
    visit_date: new Date().toISOString().split('T')[0],
    ejp: false,
  });
  const [loading, setLoading] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(null); // null, true, ou false

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

  const ageRanges = [
    '13-18 ans',
    '18-25 ans',
    '25-35 ans',
    '35-50 ans',
    '+50 ans'
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

    if (gdprConsent !== true) {
      toast.error('Veuillez accepter le consentement pour l\'utilisation de vos données');
      return;
    }

    setLoading(true);
    try {
      // Nettoyer les données : si email est vide, envoyer null
      const dataToSend = {
        ...formData,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null
      };
      
      const result = await registerVisitor(dataToSend);
      console.log('Registration successful:', result);
      toast.success('Inscription réussie! Merci de votre visite.', {
        duration: 3000,
      });
      // Navigate to introduction page after showing toast
      setTimeout(() => {
        navigate('/introduction-fi');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle different error formats
      let errorMessage = 'Erreur lors de l\'inscription';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        
        // If detail is an array (validation errors)
        if (Array.isArray(detail)) {
          errorMessage = detail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
        } 
        // If detail is a string
        else if (typeof detail === 'string') {
          errorMessage = detail;
        }
        // If detail is an object
        else if (typeof detail === 'object') {
          errorMessage = detail.msg || detail.message || 'Erreur de validation';
        }
      }
      
      toast.error(errorMessage);
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
          <CardDescription className="text-xs mt-1">Formulaire d'inscription pour nouveaux nouveaux arrivants et nouveaux convertiss</CardDescription>
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
              <Label>Type de nouveaux arrivants et nouveaux convertis *</Label>
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
              <Label htmlFor="age_range">Tranche d'âge (optionnel)</Label>
              <Select value={formData.age_range} onValueChange={(value) => setFormData({...formData, age_range: value})}>
                <SelectTrigger data-testid="age-range-select">
                  <SelectValue placeholder="Sélectionnez votre tranche d'âge" />
                </SelectTrigger>
                <SelectContent>
                  {ageRanges.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
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

            {/* Case à cocher EJP */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-3 border rounded-lg bg-purple-50 border-purple-200">
                <Checkbox
                  id="ejp"
                  checked={formData.ejp}
                  onCheckedChange={(checked) => setFormData({...formData, ejp: checked})}
                  data-testid="ejp-checkbox"
                />
                <Label htmlFor="ejp" className="font-medium cursor-pointer text-purple-900">
                  Église des Jeunes Prodiges (EJP)
                </Label>
              </div>
            </div>

            {/* Section RGPD */}
            <div className="border-t pt-6 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-lg text-blue-900">Protection de vos données</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Nous collectons vos données personnelles (nom, prénom, numéro de téléphone, adresse, etc.) afin de vous offrir un service adapté à vos besoins, de vous accompagner spirituellement et de faciliter votre intégration au sein de notre communauté. Conformément à la réglementation générale sur la protection des données (RGPD), vos informations seront utilisées uniquement dans le cadre de nos activités et ne seront en aucun cas partagées avec des tiers sans votre consentement explicite.
                </p>
                <div className="space-y-3 pt-2">
                  <p className="font-medium text-gray-900">Acceptez-vous que vos données soient utilisées à ces fins ?</p>
                  <div className="space-y-3">
                    <label className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      gdprConsent === true ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                    }`}>
                      <input
                        type="checkbox"
                        checked={gdprConsent === true}
                        onChange={() => setGdprConsent(true)}
                        className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        Oui, je consens à l'utilisation de mes données personnelles.
                      </span>
                    </label>
                    
                    <label className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      gdprConsent === false ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'
                    }`}>
                      <input
                        type="checkbox"
                        checked={gdprConsent === false}
                        onChange={() => setGdprConsent(false)}
                        className="mt-1 h-5 w-5 text-red-600 rounded focus:ring-red-500"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        Non, je ne consens pas.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || gdprConsent !== true}
              data-testid="register-submit-button"
            >
              {loading ? 'Inscription en cours...' : gdprConsent !== true ? 'Veuillez accepter le consentement' : 'S\'inscrire'}
            </Button>

            <div className="text-center pt-4 space-y-2">
              <div>
                <a 
                  href="/login" 
                  className="text-sm text-teal-600 hover:underline"
                >
                  Retour à la connexion
                </a>
              </div>
              <div className="border-t pt-3 mt-3">
                <p className="text-xs text-gray-600 mb-2">Nouveau membre d'une Famille d'Impact ?</p>
                <a 
                  href="/register-membre-fi" 
                  className="text-sm font-semibold text-green-600 hover:underline"
                >
                  S'inscrire en tant que membre FI →
                </a>
              </div>

              {/* Bouton Trouver ma FI */}
              <div className="border-t pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/trouver-ma-fi')}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium text-sm flex items-center justify-center space-x-2 shadow-md"
                >
                  <span className="text-xl">🏠</span>
                  <span>Trouver la Famille d'Impact la plus proche</span>
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Localisez la FI la plus proche de chez vous sur une carte interactive
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
