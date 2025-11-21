import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUsers, getFamillesImpact, updateFamilleImpact, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Users, UserPlus } from 'lucide-react';

const AttributionPilotesPage = () => {
  const navigate = useNavigate();
  const currentUser = getUser();
  
  const [famillesImpact, setFamillesImpact] = useState([]);
  const [pilotes, setPilotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFI, setSelectedFI] = useState(null);
  const [selectedPilote, setSelectedPilote] = useState('');

  useEffect(() => {
    // Seuls responsable_secteur et superviseur_fi peuvent accéder
    if (!currentUser || !['responsable_secteur', 'superviseur_fi', 'super_admin'].includes(currentUser.role)) {
      navigate('/dashboard');
      return;
    }
    
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Récupérer la ville de l'utilisateur
      const userCity = currentUser.city;
      
      // Charger toutes les FI de la ville
      const allFI = await getFamillesImpact(null, userCity);
      
      // Filtrer par secteur si responsable_secteur
      let filteredFI = allFI;
      if (currentUser.role === 'responsable_secteur') {
        filteredFI = allFI.filter(fi => fi.secteur_id === currentUser.assigned_secteur_id);
      }
      
      setFamillesImpact(filteredFI);
      
      // Charger tous les pilotes de la ville
      const allUsers = await getUsers(userCity);
      const pilotesList = allUsers.filter(u => u.role === 'pilote_fi');
      
      // Si responsable_secteur, filtrer les pilotes de son secteur si nécessaire
      if (currentUser.role === 'responsable_secteur' && currentUser.assigned_secteur_id) {
        // Filtrer les pilotes du même secteur (si la logique le nécessite)
        setPilotes(pilotesList.filter(p => p.city === currentUser.city));
      } else {
        setPilotes(pilotesList);
      }
      
      console.log('✅ Données chargées:', { fis: filteredFI.length, pilotes: pilotesList.length });
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
      console.error('❌ Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttribution = async () => {
    if (!selectedFI || !selectedPilote) {
      toast.error('Veuillez sélectionner une FI et un pilote');
      return;
    }

    try {
      // Mettre à jour la FI avec le nouveau pilote
      await updateFamilleImpact(selectedFI.id, {
        ...selectedFI,
        pilote_id: selectedPilote
      });
      
      toast.success('Pilote attribué avec succès!');
      loadData();
      setSelectedFI(null);
      setSelectedPilote('');
    } catch (error) {
      toast.error('Erreur lors de l\'attribution');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Attribution des Pilotes</h1>
          <p className="text-gray-500">Attribuer des pilotes aux Familles d'Impact de votre secteur</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Liste des FI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Familles d'Impact ({famillesImpact.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {famillesImpact.map((fi) => (
                  <div
                    key={fi.id}
                    className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                      selectedFI?.id === fi.id ? 'bg-blue-50 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedFI(fi)}
                  >
                    <div className="font-medium">{fi.name}</div>
                    <div className="text-sm text-gray-500">
                      Pilote actuel: {fi.pilote_name || 'Aucun'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {fi.membres?.length || 0} membres
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                Attribuer un Pilote
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedFI ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      FI sélectionnée:
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="font-medium">{selectedFI.name}</div>
                      <div className="text-sm text-gray-500">
                        Pilote actuel: {selectedFI.pilote_name || 'Aucun'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sélectionner un pilote</label>
                    <Select value={selectedPilote} onValueChange={setSelectedPilote}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un pilote" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Aucun pilote</SelectItem>
                        {pilotes.map((pilote) => (
                          <SelectItem key={pilote.id} value={pilote.id}>
                            {pilote.username} - {pilote.telephone || 'Pas de tél'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAttribution} className="flex-1">
                      Attribuer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFI(null);
                        setSelectedPilote('');
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Sélectionnez une Famille d'Impact dans la liste de gauche
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AttributionPilotesPage;
