import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LayoutMinistereStars from '../components/LayoutMinistereStars';
import { getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowLeft, Users, CheckCircle, XCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const MinistereStarsDepartementPage = () => {
  const navigate = useNavigate();
  const { departement } = useParams();
  const user = getUser();
  const [stars, setStars] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [cities, setCities] = useState([]);
  const [newStar, setNewStar] = useState({
    prenom: '',
    nom: '',
    jour_naissance: '',
    mois_naissance: '',
    ville: ''
  });
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!user || !['super_admin', 'pasteur', 'responsable_eglise', 'ministere_stars'].includes(user.role)) {
      navigate('/');
      return;
    }
    loadStars();
    loadCities();
  }, [departement]);

  const loadCities = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cities`);
      const data = await response.json();
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadStars = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/departement/${encodeURIComponent(departement)}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      const data = await response.json();
      setStars(data);
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleStatutChange = async (starId, newStatut) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/${starId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ statut: newStatut })
        }
      );

      if (!response.ok) throw new Error('Erreur');

      toast.success('Statut mis à jour');
      loadStars();
    } catch (error) {
      toast.error('Erreur de mise à jour');
    }
  };

  const handleAddStar = async (e) => {
    e.preventDefault();
    
    if (!newStar.prenom || !newStar.nom || !newStar.jour_naissance || !newStar.mois_naissance || !newStar.ville) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const jour = parseInt(newStar.jour_naissance);
    const moisVal = parseInt(newStar.mois_naissance);

    if (jour < 1 || jour > 31) {
      toast.error('Jour invalide (1-31)');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prenom: newStar.prenom,
          nom: newStar.nom,
          jour_naissance: jour,
          mois_naissance: moisVal,
          departements: [decodeURIComponent(departement)],
          ville: newStar.ville
        })
      });

      if (!response.ok) throw new Error('Erreur');

      toast.success('⭐ Star ajoutée avec succès !');
      setShowAddDialog(false);
      setNewStar({ prenom: '', nom: '', jour_naissance: '', mois_naissance: '', ville: '' });
      loadStars();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const actifs = stars.filter(s => s.statut === 'actif').length;
  const nonActifs = stars.filter(s => s.statut === 'non_actif').length;

  if (loading) {
    return (
      <LayoutMinistereStars>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </LayoutMinistereStars>
    );
  }

  return (
    <LayoutMinistereStars>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">⭐ {decodeURIComponent(departement)}</h1>
            <p className="text-gray-500 mt-1">Liste des stars du département</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/ministere-stars/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total</p>
                  <h3 className="text-3xl font-bold mt-2">{stars.length}</h3>
                </div>
                <Users className="h-12 w-12 text-blue-200 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Actifs</p>
                  <h3 className="text-3xl font-bold mt-2">{actifs}</h3>
                </div>
                <CheckCircle className="h-12 w-12 text-green-200 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Non Actifs</p>
                  <h3 className="text-3xl font-bold mt-2">{nonActifs}</h3>
                </div>
                <XCircle className="h-12 w-12 text-red-200 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des stars */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Liste des Stars</CardTitle>
            <Button onClick={() => setShowAddDialog(true)} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4">Prénom</th>
                    <th className="text-left py-3 px-4">Nom</th>
                    <th className="text-center py-3 px-4">Date de Naissance</th>
                    <th className="text-left py-3 px-4">Autres Départements</th>
                    <th className="text-center py-3 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {stars.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-500">
                        Aucune star dans ce département
                      </td>
                    </tr>
                  ) : (
                    stars.map((star, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{star.prenom}</td>
                        <td className="py-3 px-4">{star.nom}</td>
                        <td className="text-center py-3 px-4">
                          {String(star.jour_naissance).padStart(2, '0')}/{String(star.mois_naissance).padStart(2, '0')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {star.departements.filter(d => d !== departement).map((dept, i) => (
                              <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {dept}
                              </span>
                            ))}
                            {star.departements.filter(d => d !== departement).length === 0 && (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <Select
                            value={star.statut}
                            onValueChange={(value) => handleStatutChange(star.id, value)}
                          >
                            <SelectTrigger className={`w-32 ${star.statut === 'actif' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="actif">✅ Actif</SelectItem>
                              <SelectItem value="non_actif">❌ Non Actif</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog pour ajouter une star */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>⭐ Ajouter une Star à {decodeURIComponent(departement)}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStar} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={newStar.prenom}
                  onChange={(e) => setNewStar({...newStar, prenom: e.target.value})}
                  placeholder="Prénom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={newStar.nom}
                  onChange={(e) => setNewStar({...newStar, nom: e.target.value})}
                  placeholder="Nom"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jour">Jour de naissance *</Label>
                <Input
                  id="jour"
                  type="number"
                  min="1"
                  max="31"
                  value={newStar.jour_naissance}
                  onChange={(e) => setNewStar({...newStar, jour_naissance: e.target.value})}
                  placeholder="1-31"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mois">Mois de naissance *</Label>
                <select
                  id="mois"
                  value={newStar.mois_naissance}
                  onChange={(e) => setNewStar({...newStar, mois_naissance: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Sélectionner...</option>
                  {mois.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ville">Ville *</Label>
              <select
                id="ville"
                value={newStar.ville}
                onChange={(e) => setNewStar({...newStar, ville: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Sélectionner une ville...</option>
                {cities.map(city => (
                  <option key={city.id || city} value={city.name || city}>{city.name || city}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </LayoutMinistereStars>
  );
};

export default MinistereStarsDepartementPage;
