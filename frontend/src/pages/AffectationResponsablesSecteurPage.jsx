import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { UserCog, MapPin, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { getSecteurs, getUsers, updateUser } from '../utils/api';
import { toast } from 'sonner';
import { getUser } from '../utils/api';

const AffectationResponsablesSecteurPage = () => {
  const navigate = useNavigate();
  const currentUser = getUser();
  
  const [secteurs, setSecteurs] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSecteur, setSelectedSecteur] = useState(null);
  const [selectedResponsable, setSelectedResponsable] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Vérifier les permissions
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!['super_admin', 'superviseur_fi'].includes(currentUser.role)) {
      toast.error('Accès refusé');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger secteurs et responsables
      const [secteursData, usersData] = await Promise.all([
        getSecteurs(),
        getUsers()
      ]);

      setSecteurs(secteursData);
      
      // Filtrer uniquement les responsables de secteur
      const responsablesData = usersData.filter(user => user.role === 'responsable_secteur');
      setResponsables(responsablesData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getResponsableForSecteur = (secteurId) => {
    return responsables.find(r => r.assigned_secteur_id === secteurId);
  };

  const getAvailableResponsables = () => {
    // Responsables non assignés + le responsable actuellement assigné au secteur sélectionné
    return responsables.filter(r => 
      !r.assigned_secteur_id || r.assigned_secteur_id === selectedSecteur?.id
    );
  };

  const handleOpenDialog = (secteur) => {
    setSelectedSecteur(secteur);
    const currentResponsable = getResponsableForSecteur(secteur.id);
    setSelectedResponsable(currentResponsable?.id || '');
    setIsDialogOpen(true);
  };

  const handleAssignResponsable = async () => {
    if (!selectedResponsable) {
      toast.error('Veuillez sélectionner un responsable');
      return;
    }

    try {
      setSubmitting(true);

      // Retirer l'ancien responsable s'il existe
      const oldResponsable = getResponsableForSecteur(selectedSecteur.id);
      if (oldResponsable && oldResponsable.id !== selectedResponsable) {
        await updateUser(oldResponsable.id, { assigned_secteur_id: null });
      }

      // Assigner le nouveau responsable
      await updateUser(selectedResponsable, { assigned_secteur_id: selectedSecteur.id });

      toast.success('Responsable assigné avec succès!');
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error assigning responsable:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'assignation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveResponsable = async (secteur) => {
    const responsable = getResponsableForSecteur(secteur.id);
    if (!responsable) return;

    if (!confirm(`Retirer ${responsable.username} du secteur "${secteur.nom}" ?`)) {
      return;
    }

    try {
      await updateUser(responsable.id, { assigned_secteur_id: null });
      toast.success('Responsable retiré avec succès');
      loadData();
    } catch (error) {
      console.error('Error removing responsable:', error);
      toast.error('Erreur lors du retrait du responsable');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <UserCog className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Attribution des Responsables aux Secteurs</h1>
          </div>
          <p className="text-gray-600">
            Assignez des responsables aux différents secteurs de votre ville
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Secteurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{secteurs.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Responsables disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{responsables.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Secteurs avec responsable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {secteurs.filter(s => getResponsableForSecteur(s.id)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des secteurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Liste des Secteurs
            </CardTitle>
            <CardDescription>
              {secteurs.length} secteur(s) dans votre ville
            </CardDescription>
          </CardHeader>
          <CardContent>
            {secteurs.length === 0 ? (
              <div className="p-12 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 text-lg">Aucun secteur trouvé</p>
                <p className="text-gray-400 text-sm mt-2">Créez d'abord des secteurs</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom du Secteur</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Responsable assigné</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {secteurs.map((secteur) => {
                    const responsable = getResponsableForSecteur(secteur.id);
                    return (
                      <TableRow key={secteur.id}>
                        <TableCell className="font-medium">{secteur.nom}</TableCell>
                        <TableCell>{secteur.ville}</TableCell>
                        <TableCell>
                          {responsable ? (
                            <span className="text-blue-600 font-medium">
                              {responsable.username}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Non assigné</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {responsable ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              Assigné
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-orange-600">
                              <XCircle className="h-4 w-4" />
                              En attente
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleOpenDialog(secteur)}
                            >
                              {responsable ? 'Modifier' : 'Attribuer'}
                            </Button>
                            {responsable && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveResponsable(secteur)}
                              >
                                Retirer
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog d'attribution */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Attribuer un responsable</DialogTitle>
              <DialogDescription>
                Sélectionnez un responsable pour le secteur "{selectedSecteur?.nom}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Responsable de Secteur</label>
                <Select value={selectedResponsable} onValueChange={setSelectedResponsable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un responsable..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableResponsables().map((responsable) => (
                      <SelectItem key={responsable.id} value={responsable.id}>
                        {responsable.username} ({responsable.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getAvailableResponsables().length === 0 && (
                  <p className="text-sm text-orange-600">
                    Aucun responsable disponible. Tous les responsables sont déjà assignés.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleAssignResponsable} 
                disabled={submitting || !selectedResponsable}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Attribution...
                  </>
                ) : (
                  'Attribuer'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AffectationResponsablesSecteurPage;
