import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getFamillesImpact, deleteFamilleImpact, getUser, getSecteurs } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Trash2, Heart, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

const GererFIPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [famillesImpact, setFamillesImpact] = useState([]);
  const [secteurs, setSecteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFI, setSelectedFI] = useState(null);

  useEffect(() => {
    if (!user || !['super_admin', 'superviseur_fi'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [fisData, secteursData] = await Promise.all([
        getFamillesImpact(null, user.city),
        getSecteurs()
      ]);
      setFamillesImpact(fisData);
      setSecteurs(secteursData);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFI = async () => {
    try {
      await deleteFamilleImpact(selectedFI.id);
      toast.success('Famille d\'Impact supprimée avec succès!');
      setIsDeleteDialogOpen(false);
      setSelectedFI(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const getSecteurName = (secteurId) => {
    const secteur = secteurs.find(s => s.id === secteurId);
    return secteur ? secteur.name : '-';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gérer les Familles d'Impact</h1>
          <p className="text-gray-600 mt-2">Liste de toutes les Familles d'Impact de votre ville</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600" />
              Familles d'Impact ({famillesImpact.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {famillesImpact.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Aucune Famille d'Impact</p>
              </div>
            ) : (
              <div className="space-y-2">
                {famillesImpact.map((fi) => (
                  <div
                    key={fi.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{fi.name || fi.nom || 'Sans nom'}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {getSecteurName(fi.secteur_id)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {fi.pilote_name || 'Aucun pilote'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFI(fi);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer la FI "<strong>{selectedFI?.name || selectedFI?.nom}</strong>" ?
                Cette action est irréversible et supprimera tous les membres associés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedFI(null)}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteFI} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default GererFIPage;
