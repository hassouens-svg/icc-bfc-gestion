import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCities, getSecteurs, getFamillesImpact, createMembreFI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const RegisterMembreFIPage = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [secteurs, setSecteurs] = useState([]);
  const [famillesImpact, setFamillesImpact] = useState([]);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    ville: '',
    secteur_id: '',
    fi_id: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (formData.ville) {
      loadSecteurs(formData.ville);
    }
  }, [formData.ville]);

  useEffect(() => {
    if (formData.secteur_id) {
      loadFamillesImpact(formData.secteur_id);
    }
  }, [formData.secteur_id]);

  const loadCities = async () => {
    try {
      const citiesData = await getCities();
      setCities(citiesData);
    } catch (error) {
      toast.error('Erreur lors du chargement des villes');
    }
  };

  const loadSecteurs = async (ville) => {
    try {
      const secteursData = await getSecteurs(ville);
      setSecteurs(secteursData);
      setFamillesImpact([]);
      setFormData(prev => ({ ...prev, secteur_id: '', fi_id: '' }));
    } catch (error) {
      toast.error('Erreur lors du chargement des secteurs');
    }
  };

  const loadFamillesImpact = async (secteurId) => {
    try {
      const fisData = await getFamillesImpact(secteurId);
      setFamillesImpact(fisData);
      setFormData(prev => ({ ...prev, fi_id: '' }));
    } catch (error) {
      toast.error('Erreur lors du chargement des Familles d\'Impact');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.prenom || !formData.nom || !formData.ville || !formData.secteur_id || !formData.fi_id) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await createMembreFI({
        prenom: formData.prenom,
        nom: formData.nom,
        fi_id: formData.fi_id,
        source: 'manuel'
      });
      toast.success('Nouveau membre ajouté avec succès!');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      let errorMessage = 'Erreur lors de l\'inscription';
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (typeof detail === 'object') {
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
          <Button 
            onClick={() => navigate('/')} 
            variant="ghost" 
            className="mb-4 w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex justify-center mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_dijon-icc-hub/artifacts/foeikpvk_IMG_2590.png" 
              alt="ICC Logo" 
              className="h-24 w-24 object-contain rounded-full"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-green-600">
            Nouveau Membre - Famille d'Impact
          </CardTitle>
          <CardDescription>Inscription d'un nouveau membre dans une cellule de prière</CardDescription>
          <CardDescription className="text-xs mt-1 text-orange-600">
            Réservé aux cellules de prière (Jeudis)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Informations personnelles</h3>
              
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                  placeholder="Prénom"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  placeholder="Nom"
                />
              </div>
            </div>

            {/* Affectation FI */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Affectation à une Famille d'Impact</h3>
              
              <div className="space-y-2">
                <Label htmlFor="ville">Ville *</Label>
                <Select value={formData.ville} onValueChange={(value) => setFormData({...formData, ville: value})}>
                  <SelectTrigger data-testid="register-fi-city-select">
                    <SelectValue placeholder="Sélectionnez votre ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.ville && (
                <div className="space-y-2">
                  <Label htmlFor="secteur">Secteur *</Label>
                  <Select 
                    value={formData.secteur_id} 
                    onValueChange={(value) => setFormData({...formData, secteur_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un secteur" />
                    </SelectTrigger>
                    <SelectContent>
                      {secteurs.map((secteur) => (
                        <SelectItem key={secteur.id} value={secteur.id}>
                          {secteur.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.secteur_id && (
                <div className="space-y-2">
                  <Label htmlFor="fi">Famille d'Impact *</Label>
                  <Select 
                    value={formData.fi_id} 
                    onValueChange={(value) => setFormData({...formData, fi_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une Famille d'Impact" />
                    </SelectTrigger>
                    <SelectContent>
                      {famillesImpact.map((fi) => (
                        <SelectItem key={fi.id} value={fi.id}>
                          {fi.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700" 
              disabled={loading}
            >
              {loading ? 'Inscription en cours...' : 'Inscrire le membre'}
            </Button>

            <div className="text-center pt-4">
              <a 
                href="/" 
                className="text-sm text-green-600 hover:underline"
              >
                Retour à l'accueil
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterMembreFIPage;
