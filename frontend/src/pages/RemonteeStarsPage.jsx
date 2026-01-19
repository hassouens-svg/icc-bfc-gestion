import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { MessageSquare, Send, User, Building2, Eye, EyeOff } from 'lucide-react';

const RemonteeStarsPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    is_anonyme: false,
    departement: '',
    ville: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const departements = [
    'Non spécifié',
    'MLA',
    'Accueil',
    'Soins pastoraux',
    'Régie',
    'Sono',
    'Sainte cène',
    'Impact junior',
    'Navette',
    'Prière',
    'Protocole',
    'Sécurité',
    'Communication',
    'Coordination',
    'Bergeries',
    'Formation',
    'Finance',
    'Ministère des femmes (bureau)',
    'Ministère des hommes (bureau)',
    'Impact santé',
    'Évènementiel/Restauration',
    'Modération',
    'EJP-Prière - Intercession',
    'EJP-Coordination',
    'EJP-MLA',
    'EJP-Sono',
    'EJP-Modération',
    'EJP-COM',
    'EJP-Accueil',
    'EJP-Communion Fraternelle'
  ];

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
    
    if (!formData.message.trim()) {
      toast.error('Veuillez saisir votre message');
      return;
    }

    if (!formData.ville) {
      toast.error('Veuillez sélectionner votre ville');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stars/remontees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: formData.is_anonyme ? '' : formData.nom,
          prenom: formData.is_anonyme ? '' : formData.prenom,
          is_anonyme: formData.is_anonyme,
          departement: formData.departement || 'Non spécifié',
          ville: formData.ville,
          message: formData.message
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi');
      }

      setSubmitted(true);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-12 pb-8 px-8">
            <div className="flex justify-center mb-6">
              <MessageSquare className="h-20 w-20 text-green-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Message envoyé ! 📩
            </h1>
            
            <p className="text-gray-600 mb-8">
              Merci pour votre retour. Votre message a été transmis aux responsables 
              qui le prendront en compte.
            </p>
            
            <Button 
              onClick={() => navigate('/')} 
              className="bg-indigo-500 hover:bg-indigo-600"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="text-5xl mb-4">💬</div>
          <CardTitle className="text-2xl">Remontées & Suggestions</CardTitle>
          <CardDescription>
            Partagez vos inquiétudes, questions ou suggestions en toute confidentialité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Anonyme ou pas */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="anonyme"
                  checked={formData.is_anonyme}
                  onCheckedChange={(checked) => setFormData({...formData, is_anonyme: checked})}
                />
                <Label htmlFor="anonyme" className="flex items-center gap-2 cursor-pointer">
                  {formData.is_anonyme ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  Rester anonyme
                </Label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.is_anonyme 
                  ? "Votre identité ne sera pas révélée" 
                  : "Votre nom sera visible par les responsables"}
              </p>
            </div>

            {/* Nom et Prénom (si pas anonyme) */}
            {!formData.is_anonyme && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    placeholder="Votre nom"
                  />
                </div>
              </div>
            )}

            {/* Ville */}
            <div>
              <Label>Ville *</Label>
              <Select 
                value={formData.ville} 
                onValueChange={(value) => setFormData({...formData, ville: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre ville" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city, idx) => {
                    const cityName = typeof city === 'object' ? city.name : city;
                    return (
                      <SelectItem key={idx} value={cityName}>{cityName}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Département (optionnel) */}
            <div>
              <Label>Département (optionnel)</Label>
              <Select 
                value={formData.departement} 
                onValueChange={(value) => setFormData({...formData, departement: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un département (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {departements.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message">Votre message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Décrivez votre inquiétude, question ou suggestion..."
                className="min-h-32"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {loading ? 'Envoi...' : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RemonteeStarsPage;
