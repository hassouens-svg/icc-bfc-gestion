import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { MapPin, Users, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BergeriesDisciplesPage = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('all');
  const [bergeries, setBergeries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog pour créer une nouvelle bergerie
  const [showAddBergerie, setShowAddBergerie] = useState(false);
  const [newBergerie, setNewBergerie] = useState({ nom: '', responsable: '', ville: 'Dijon' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCities();
    loadBergeriesFromSheet();
  }, []);

  const loadCities = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cities/public`);
      if (response.ok) {
        const citiesData = await response.json();
        const cityNames = citiesData.map(city => typeof city === 'string' ? city : city.name).filter(Boolean);
        setCities(cityNames);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadBergeriesFromSheet = async () => {
    try {
      // Essayer de charger depuis le backend d'abord
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/list`);
      if (response.ok) {
        const data = await response.json();
        setBergeries(data);
      } else {
        // Fallback: charger depuis le Google Sheet directement (données statiques)
        loadStaticData();
      }
    } catch (error) {
      console.error('Error:', error);
      loadStaticData();
    } finally {
      setLoading(false);
    }
  };

  const loadStaticData = () => {
    // Données extraites du Google Sheet
    const staticBergeries = [
      { id: 'bg-1', nom: 'Choisies de Dieu ICC', responsable: 'Ps Nathalie', ville: 'Dijon', membres_count: 27 },
      { id: 'bg-2', nom: 'Les perles Besançon', responsable: 'Olive', ville: 'Besançon', membres_count: 16 },
      { id: 'bg-3', nom: 'Ambassadeurs de Christ', responsable: 'Eddy Marc', ville: 'Dijon', membres_count: 20 },
      { id: 'bg-4', nom: 'Groupe NEHEMI', responsable: 'Tonton Frank', ville: 'Dijon', membres_count: 15 },
      { id: 'bg-5', nom: 'Les Prunelles de Dieu', responsable: 'Xaviera', ville: 'Dijon', membres_count: 19 },
      { id: 'bg-6', nom: 'Femmes Fortes et Puissantes', responsable: 'Félicie', ville: 'Dijon', membres_count: 17 },
      { id: 'bg-7', nom: 'Lampe Allumée', responsable: 'Rebecca', ville: 'Besançon', membres_count: 13 },
      { id: 'bg-8', nom: 'Les disciples de Bérée', responsable: 'Jules', ville: 'Dijon', membres_count: 16 },
      { id: 'bg-9', nom: 'ROYALTY', responsable: 'Jemima', ville: 'Dijon', membres_count: 16 },
      { id: 'bg-10', nom: 'Vaillante Héroïne', responsable: 'Lesti', ville: 'Dijon', membres_count: 12 },
      { id: 'bg-11', nom: 'HUIOS', responsable: 'Pierre Christian', ville: 'Besançon', membres_count: 6 },
      { id: 'bg-12', nom: 'Les Déboras', responsable: 'Queren', ville: 'Dijon', membres_count: 11 },
      { id: 'bg-13', nom: 'Les Princesses de Dieu', responsable: 'Ps Nathalie', ville: 'Dijon', membres_count: 11 },
      { id: 'bg-14', nom: 'Perles AUXERRE', responsable: 'Ornella', ville: 'Auxerre', membres_count: 11 },
      { id: 'bg-15', nom: 'Vaillants Héros de Dieu', responsable: 'Gloire', ville: 'Besançon', membres_count: 13 },
      { id: 'bg-16', nom: 'ESTHER', responsable: 'Arielle', ville: 'Dijon', membres_count: 16 },
      { id: 'bg-17', nom: 'FEMMES D\'EXPÉRIENCE MFI-B', responsable: 'Florence', ville: 'Dijon', membres_count: 10 },
      { id: 'bg-18', nom: 'Groupe de disciple – Esther', responsable: 'Fr Steve', ville: 'Besançon', membres_count: 12 },
      { id: 'bg-19', nom: 'Femmes de Destinée', responsable: 'Béthsabée', ville: 'Besançon', membres_count: 10 },
      { id: 'bg-20', nom: 'Les HÉRITIERS', responsable: 'Bertin', ville: 'Dijon', membres_count: 11 },
      { id: 'bg-21', nom: 'Les Princesses intimes du SAI', responsable: 'Olivette', ville: 'Dijon', membres_count: 11 },
      { id: 'bg-22', nom: 'DISCIPLES PST NATHALIE', responsable: 'Ps Nathalie', ville: 'Dijon', membres_count: 6 },
      { id: 'bg-23', nom: 'Medi\'Time', responsable: 'Joseph', ville: 'Dijon', membres_count: 8 },
      { id: 'bg-24', nom: 'Sacerdocce royal', responsable: 'Priscillia', ville: 'Dijon', membres_count: 14 },
      { id: 'bg-25', nom: 'Disciples Parfait', responsable: 'Parfait', ville: 'Dijon', membres_count: 7 },
      { id: 'bg-26', nom: 'Les saintes', responsable: 'Sabrina', ville: 'Dijon', membres_count: 7 },
      { id: 'bg-27', nom: 'Gloire GDD', responsable: 'Dorine', ville: 'Dijon', membres_count: 10 },
      { id: 'bg-28', nom: 'ÉLITES DE DIEU', responsable: 'Anael', ville: 'Dijon', membres_count: 6 },
      { id: 'bg-29', nom: 'Kingdom\'s Fighter', responsable: 'Dorcas', ville: 'Dijon', membres_count: 11 },
      { id: 'bg-30', nom: 'Les Justes GDD', responsable: 'Carine', ville: 'Dijon', membres_count: 6 },
      { id: 'bg-31', nom: 'Amies de Dieu', responsable: 'Carole', ville: 'Dijon', membres_count: 9 },
      { id: 'bg-32', nom: 'RUTH', responsable: 'Ruth', ville: 'Dijon', membres_count: 9 },
      { id: 'bg-33', nom: 'Groupe des disciples S', responsable: 'Serge', ville: 'Dijon', membres_count: 9 },
      { id: 'bg-34', nom: 'Groupe des disciples P', responsable: 'Patrick', ville: 'Dijon', membres_count: 13 },
      { id: 'bg-35', nom: 'Fleur de lys', responsable: 'Gracia', ville: 'Dijon', membres_count: 9 },
      { id: 'bg-36', nom: 'Kingdom\'s Keepers', responsable: 'Daniella', ville: 'Dijon', membres_count: 11 },
      { id: 'bg-37', nom: 'L\'Éternel m\'a exaucée', responsable: 'Solange', ville: 'Dijon', membres_count: 8 },
      { id: 'bg-38', nom: 'Les Disciples de Dieu', responsable: 'Adélaïde', ville: 'Besançon', membres_count: 12 },
      { id: 'bg-39', nom: 'Power Ladies', responsable: 'Yolande', ville: 'Dijon', membres_count: 11 },
      { id: 'bg-40', nom: 'Femmes de Valeur', responsable: 'Ruth T.', ville: 'Dijon', membres_count: 8 },
      { id: 'bg-41', nom: 'Les Conquérants', responsable: 'Cédric', ville: 'Chalon-sur-Saône', membres_count: 10 },
    ];
    setBergeries(staticBergeries);
  };

  const handleSelectBergerie = (bergerie) => {
    // Stocker le contexte
    localStorage.setItem('selected_bergerie_disciple', JSON.stringify(bergerie));
    navigate(`/bergerie-disciple/${bergerie.id}`);
  };

  const handleCreateBergerie = async () => {
    if (!newBergerie.nom || !newBergerie.responsable || !newBergerie.ville) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    setCreating(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBergerie)
      });
      
      if (response.ok) {
        const data = await response.json();
        setBergeries([...bergeries, data.bergerie]);
        toast.success('Bergerie créée avec succès!');
        setShowAddBergerie(false);
        setNewBergerie({ nom: '', responsable: '', ville: 'Dijon' });
        
        // Naviguer vers la nouvelle bergerie
        localStorage.setItem('selected_bergerie_disciple', JSON.stringify(data.bergerie));
        navigate(`/bergerie-disciple/${data.bergerie.id}`);
      } else {
        toast.error('Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur de connexion');
    } finally {
      setCreating(false);
    }
  };

  const filteredBergeries = selectedCity === 'all' 
    ? bergeries 
    : bergeries.filter(b => b.ville === selectedCity);

  // Statistiques
  const totalMembres = filteredBergeries.reduce((sum, b) => sum + (b.membres_count || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate('/bergeries')} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        
        {/* Filtre ville */}
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-green-600" />
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Toutes les villes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌍 Toutes les villes</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        {/* Title + Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold text-gray-900">🌿 Bergeries - Groupes de Disciples</h1>
            <p className="text-gray-600 mt-2">
              {filteredBergeries.length} groupe(s) • {totalMembres} membre(s)
              {selectedCity !== 'all' && ` • ${selectedCity}`}
            </p>
          </div>
          <Button 
            onClick={() => setShowAddBergerie(true)} 
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Bergerie
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-green-600">{filteredBergeries.length}</p>
              <p className="text-sm text-green-700">Groupes</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{totalMembres}</p>
              <p className="text-sm text-blue-700">Membres</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-purple-600">
                {filteredBergeries.filter(b => b.ville === 'Dijon').length}
              </p>
              <p className="text-sm text-purple-700">Dijon</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-orange-600">
                {filteredBergeries.filter(b => b.ville === 'Besançon').length}
              </p>
              <p className="text-sm text-orange-700">Besançon</p>
            </CardContent>
          </Card>
        </div>

        {/* Bergeries Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBergeries.map((bergerie) => (
            <Card 
              key={bergerie.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-green-400 hover:bg-green-50 group"
              onClick={() => handleSelectBergerie(bergerie)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base leading-tight line-clamp-2">
                  {bergerie.nom}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{bergerie.membres_count || 0} membre(s)</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    👤 {bergerie.responsable}
                  </div>
                  <div className="text-xs text-gray-400">
                    📍 {bergerie.ville}
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-3 bg-green-600 hover:bg-green-700 group-hover:bg-green-700"
                  size="sm"
                >
                  Accéder
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bannière 2026 */}
        <div className="mt-12">
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 rounded-2xl p-6 text-center text-white shadow-xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              🎯 2026, année du discipolat
            </h2>
            <p className="text-sm md:text-base font-medium opacity-95">
              Objectif <span className="text-yellow-300 font-bold text-xl">1000</span> disciples affermis du Christ
              en Bourgogne Franche-Comté en 2026
            </p>
            <p className="text-sm mt-2 opacity-80">🙏 La BFC pour Christ</p>
          </div>
        </div>
      </div>

      {/* Dialog Créer Bergerie */}
      <Dialog open={showAddBergerie} onOpenChange={setShowAddBergerie}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🌿 Créer une nouvelle Bergerie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom de la Bergerie *</Label>
              <Input 
                value={newBergerie.nom} 
                onChange={(e) => setNewBergerie({...newBergerie, nom: e.target.value})}
                placeholder="Ex: Les Conquérants de Dieu"
              />
            </div>
            <div>
              <Label>Nom du Responsable *</Label>
              <Input 
                value={newBergerie.responsable} 
                onChange={(e) => setNewBergerie({...newBergerie, responsable: e.target.value})}
                placeholder="Ex: Jean-Pierre"
              />
            </div>
            <div>
              <Label>Ville *</Label>
              <Select 
                value={newBergerie.ville} 
                onValueChange={(v) => setNewBergerie({...newBergerie, ville: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une ville" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBergerie(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreateBergerie} 
              className="bg-green-600 hover:bg-green-700"
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer la Bergerie
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BergeriesDisciplesPage;
