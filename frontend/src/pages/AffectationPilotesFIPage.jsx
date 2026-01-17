import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { UserPlus, Users, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { getFamillesImpact, getUsers, updateUser, getSecteurs } from '../utils/api';
import { toast } from 'sonner';
import { getUser } from '../utils/api';

const AffectationPilotesFIPage = () => {
  const navigate = useNavigate();
  const currentUser = getUser();
  
  const [famillesImpact, setFamillesImpact] = useState([]);
  const [secteurs, setSecteurs] = useState([]);
  const [pilotes, setPilotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFI, setSelectedFI] = useState(null);
  const [selectedPilote, setSelectedPilote] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Vérifier les permissions
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!['super_admin', 'superviseur_fi', 'responsable_secteur'].includes(currentUser.role)) {
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
      
      // Charger secteurs, FI et pilotes
      const [secteursData, fisData, usersData] = await Promise.all([
        getSecteurs(),
        getFamillesImpact(),
        getUsers()
      ]);

      setSecteurs(secteursData);
      
      // Si responsable_secteur, filtrer les FI de son secteur uniquement
      let filteredFIs = fisData;
      if (currentUser.role === 'responsable_secteur' && currentUser.assigned_secteur_id) {
        filteredFIs = fisData.filter(fi => fi.secteur_id === currentUser.assigned_secteur_id);
        console.log(`📍 Responsable Secteur: ${filteredFIs.length} FI dans son secteur`);
      }
      setFamillesImpact(filteredFIs);
      
      // Filtrer uniquement les pilotes FI
      const pilotesData = usersData.filter(user => user.role === 'pilote_fi');
      setPilotes(pilotesData);
      
    } catch (error) {
      console.log('Error in AffectationPilotesFIPage.loadData');
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getSecteurName = (secteurId) => {
    const secteur = secteurs.find(s => s.id === secteurId);
    return secteur ? secteur.nom : 'Secteur inconnu';
  };

  const getPiloteForFI = (fiId) => {
    return pilotes.find(p => p.assigned_fi_id === fiId);
  };

  const getAvailablePilotes = () => {
    // Pilotes non assignés + le pilote actuellement assigné à la FI sélectionnée
    return pilotes.filter(p => 
      !p.assigned_fi_id || p.assigned_fi_id === selectedFI?.id
    );
  };

  const handleOpenDialog = (fi) => {
    setSelectedFI(fi);
    const currentPilote = getPiloteForFI(fi.id);
    setSelectedPilote(currentPilote?.id || '');
    setIsDialogOpen(true);
  };

  const handleAssignPilote = async () => {
    if (!selectedPilote) {
      toast.error('Veuillez sélectionner un pilote');
      return;
    }

    try {
      setSubmitting(true);

      // Retirer l'ancien pilote s'il existe
      const oldPilote = getPiloteForFI(selectedFI.id);
      if (oldPilote && oldPilote.id !== selectedPilote) {
        await updateUser(oldPilote.id, { assigned_fi_id: null });
      }

      // Assigner le nouveau pilote
      await updateUser(selectedPilote, { assigned_fi_id: selectedFI.id });

      toast.success('Pilote assigné avec succès!');
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.log('Error in AffectationPilotesFIPage.handleAssignPilote');
      console.error('Error assigning pilote:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'assignation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePilote = async (fi) => {
    const pilote = getPiloteForFI(fi.id);
    if (!pilote) return;

    if (!confirm(`Retirer ${pilote.username} de la FI "${fi.nom}" ?`)) {
      return;
    }

    try {
      await updateUser(pilote.id, { assigned_fi_id: null });
      toast.success('Pilote retiré avec succès');
      loadData();
    } catch (error) {
      console.log('Error in AffectationPilotesFIPage.handleRemovePilote');
      console.error('Error removing pilote:', error);
      toast.error('Erreur lors du retrait du pilote');
    }
  };

  // Grouper les FI par secteur
  const fisBySecteur = secteurs.map(secteur => ({
    secteur,
    fis: famillesImpact.filter(fi => fi.secteur_id === secteur.id)
  })).filter(group => group.fis.length > 0);

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
            <UserPlus className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Attribution des Pilotes aux Familles d'Impact</h1>
          </div>
          <p className="text-gray-600">
            Assignez des pilotes aux différentes Familles d'Impact de votre ville
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total FI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{famillesImpact.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pilotes disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pilotes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">FI avec pilote</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {famillesImpact.filter(fi => getPiloteForFI(fi.id)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des FI par secteur */}
        {fisBySecteur.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 text-lg">Aucune Famille d'Impact trouvée</p>
              <p className="text-gray-400 text-sm mt-2">Créez d'abord des secteurs et des FI</p>
            </CardContent>
          </Card>
        ) : (
          fisBySecteur.map(({ secteur, fis }) => (
            <Card key={secteur.id} className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Secteur : {secteur.nom}
                </CardTitle>
                <CardDescription>{fis.length} Famille(s) d'Impact</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom de la FI</TableHead>
                      <TableHead>Ville</TableHead>
                      <TableHead>Pilote assigné</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fis.map((fi) => {
                      const pilote = getPiloteForFI(fi.id);
                      return (
                        <TableRow key={fi.id}>
                          <TableCell className="font-medium">{fi.nom}</TableCell>
                          <TableCell>{fi.ville}</TableCell>
                          <TableCell>
                            {pilote ? (
                              <span className="text-blue-600 font-medium">
                                {pilote.username}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Non assigné</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {pilote ? (
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
                                onClick={() => handleOpenDialog(fi)}
                              >
                                {pilote ? 'Modifier' : 'Attribuer'}
                              </Button>
                              {pilote && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemovePilote(fi)}
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
              </CardContent>
            </Card>
          ))
        )}

        {/* Dialog d'attribution */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Attribuer un pilote</DialogTitle>
              <DialogDescription>
                Sélectionnez un pilote pour la FI "{selectedFI?.nom}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pilote</label>
                <Select value={selectedPilote} onValueChange={setSelectedPilote}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un pilote..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailablePilotes().map((pilote) => (
                      <SelectItem key={pilote.id} value={pilote.id}>
                        {pilote.username} ({pilote.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getAvailablePilotes().length === 0 && (
                  <p className="text-sm text-orange-600">
                    Aucun pilote disponible. Tous les pilotes sont déjà assignés.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleAssignPilote} 
                disabled={submitting || !selectedPilote}
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

export default AffectationPilotesFIPage;
