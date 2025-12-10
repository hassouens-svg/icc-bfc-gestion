import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

const RecensementStarsPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    jour_naissance: '',
    mois_naissance: '',
    ville: '',
    departements: []
  });
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);

  React.useEffect(() => {
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

  const departements = [
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
    'Ministère des promotions',
    'Formation',
    'Finance',
    'Ministère des femmes (bureau)',
    'Ministère des hommes (bureau)',
    'Impact santé',
    'Évènementiel/Restauration'
  ];

  const mois = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  const handleDeptToggle = (dept) => {
    setFormData(prev => ({
      ...prev,
      departements: prev.departements.includes(dept)
        ? prev.departements.filter(d => d !== dept)
        : [...prev.departements, dept]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.prenom || !formData.nom || !formData.jour_naissance || !formData.mois_naissance || !formData.ville) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.departements.length === 0) {
      toast.error('Veuillez sélectionner au moins un département');
      return;
    }

    const jour = parseInt(formData.jour_naissance);
    const mois = parseInt(formData.mois_naissance);

    if (jour < 1 || jour > 31) {
      toast.error('Jour invalide (1-31)');
      return;
    }

    if (mois < 1 || mois > 12) {
      toast.error('Mois invalide');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          prenom: formData.prenom,
          nom: formData.nom,
          jour_naissance: jour,
          mois_naissance: mois,
          departements: formData.departements,
          ville: formData.ville
        })
      });

      if (!response.ok) throw new Error('Erreur');

      toast.success('✅ Inscription réussie ! Merci pour votre service ! ⭐');
      
      // Reset form
      setFormData({
        prenom: '',
        nom: '',
        jour_naissance: '',
        mois_naissance: '',
        departements: []
      });

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      toast.error('Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">⭐</div>
          <CardTitle className="text-3xl font-bold text-orange-600">Recensement des STARS</CardTitle>
          <CardDescription>Enregistrez-vous pour faire partie des stars de l'église</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Prénom et Nom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                  placeholder="Votre prénom"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  placeholder="Votre nom"
                  required
                />
              </div>
            </div>

            {/* Date de naissance */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Date de Naissance (Jour et Mois uniquement) *</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jour">Jour</Label>
                  <Input
                    id="jour"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.jour_naissance}
                    onChange={(e) => setFormData({...formData, jour_naissance: e.target.value})}
                    placeholder="Ex: 15"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mois">Mois</Label>
                  <select
                    id="mois"
                    value={formData.mois_naissance}
                    onChange={(e) => setFormData({...formData, mois_naissance: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Sélectionnez</option>
                    {mois.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Départements */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Dans quel(s) département(s) servez-vous ? *</Label>
              <p className="text-sm text-gray-600 mb-3">Vous pouvez en cocher plusieurs</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto border rounded-lg p-4">
                {departements.map((dept, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dept-${idx}`}
                      checked={formData.departements.includes(dept)}
                      onCheckedChange={() => handleDeptToggle(dept)}
                    />
                    <Label htmlFor={`dept-${idx}`} className="font-normal cursor-pointer">
                      {dept}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.departements.length > 0 && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  ✅ {formData.departements.length} département(s) sélectionné(s)
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6" 
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : '⭐ S\'inscrire comme STAR'}
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/')}
            >
              Retour à l'accueil
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecensementStarsPage;
