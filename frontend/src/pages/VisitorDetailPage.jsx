import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getVisitor, getUser, addComment, updateVisitor, stopTracking } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { ArrowLeft, StopCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';
import KPIDiscipolat from '../components/KPIDiscipolat';

const VisitorDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = getUser();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [stopReason, setStopReason] = useState('');
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    address: '',
    arrival_channel: '',
    age_range: '',
    types: [],
    ejp: false
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadVisitor();
  }, [id, user, navigate]);

  const loadVisitor = async () => {
    try {
      const data = await getVisitor(id);
      setVisitor(data);
    } catch (error) {
      toast.error('Erreur lors du chargement du nouveaux arrivants et nouveaux convertis');
      navigate('/visitors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      toast.error('Veuillez entrer un commentaire');
      return;
    }

    try {
      await addComment(id, commentText);
      toast.success('Commentaire ajouté!');
      setCommentText('');
      loadVisitor();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  const handleStopTracking = async () => {
    if (!stopReason.trim()) {
      toast.error('Veuillez entrer une raison');
      return;
    }

    setShowStopDialog(false);
    setShowStopConfirm(true);
  };

  const confirmStopTracking = async () => {
    try {
      await stopTracking(id, stopReason);
      toast.success('Suivi arrêté');
      navigate('/visitors');
    } catch (error) {
      toast.error('Erreur lors de l\'arrêt du suivi');
    }
    setShowStopConfirm(false);
  };

  const handleOpenEditDialog = () => {
    setEditData({
      firstname: visitor.firstname,
      lastname: visitor.lastname,
      phone: visitor.phone,
      email: visitor.email || '',
      address: visitor.address || '',
      arrival_channel: visitor.arrival_channel,
      age_range: visitor.age_range || '',
      types: visitor.types || [],
      ejp: visitor.ejp || false
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      // Clean up empty strings to null for optional fields
      const cleanedData = {
        ...editData,
        email: editData.email?.trim() || null,
        address: editData.address?.trim() || null,
        age_range: editData.age_range?.trim() || null
      };
      await updateVisitor(id, cleanedData);
      toast.success('Informations mises à jour');
      await loadVisitor();
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!visitor) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/visitors')} data-testid="back-button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-gray-900" data-testid="visitor-name">
                  {visitor.firstname} {visitor.lastname}
                </h2>
                {visitor.ejp && (
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold">
                    EJP
                  </span>
                )}
              </div>
              <p className="text-gray-500 mt-1">Détails et suivi du nouveaux arrivants et nouveaux convertis</p>
            </div>
          </div>
          <div className="flex gap-2">
            {['super_admin', 'admin', 'promotions', 'referent', 'berger'].includes(user?.role) && (
              <Button
                variant="outline"
                onClick={handleOpenEditDialog}
                data-testid="edit-visitor-button"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => setShowStopDialog(true)}
              data-testid="stop-tracking-button"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Arrêter le suivi
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de base</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Types</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {visitor.types.map((type, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p className="font-medium">{visitor.phone || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{visitor.email || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Canal d&apos;arrivée</p>
                <p className="font-medium">{visitor.arrival_channel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type de visite</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    visitor.is_ancien 
                      ? 'bg-gray-100 text-gray-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {visitor.is_ancien ? 'Ancien Visiteur' : 'Nouveau Visiteur'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date de visite</p>
                <p className="font-medium">{visitor.visit_date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mois assigné</p>
                <p className="font-medium">{visitor.assigned_month}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Discipolat */}
        <KPIDiscipolat visitorId={id} visitorName={`${visitor.firstname} ${visitor.lastname}`} />

        {/* Section commentaires */}
      </div>

      {/* Stop Tracking Dialog */}
      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arrêter le suivi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Veuillez indiquer la raison pour laquelle vous souhaitez arrêter le suivi de ce nouveaux arrivants et nouveaux convertis.
            </p>
            <Textarea
              placeholder="Raison de l'arrêt du suivi..."
              value={stopReason}
              onChange={(e) => setStopReason(e.target.value)}
              data-testid="stop-reason-textarea"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStopDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleStopTracking} data-testid="confirm-stop-button">
              Continuer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Visitor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier les informations</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input
                  value={editData.firstname}
                  onChange={(e) => setEditData({...editData, firstname: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={editData.lastname}
                  onChange={(e) => setEditData({...editData, lastname: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Téléphone *</Label>
              <Input
                value={editData.phone}
                onChange={(e) => setEditData({...editData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({...editData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={editData.address}
                onChange={(e) => setEditData({...editData, address: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Canal d'arrivée</Label>
              <Select value={editData.arrival_channel} onValueChange={(value) => setEditData({...editData, arrival_channel: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Evangelisation">Evangelisation</SelectItem>
                  <SelectItem value="Réseaux sociaux">Réseaux sociaux</SelectItem>
                  <SelectItem value="Invitation par un membre (hors evangelisation)">Invitation par un membre</SelectItem>
                  <SelectItem value="Par soi même">Par soi même</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tranche d'âge</Label>
              <Select value={editData.age_range} onValueChange={(value) => setEditData({...editData, age_range: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une tranche d'âge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15-25 ans">15-25 ans</SelectItem>
                  <SelectItem value="25-35 ans">25-35 ans</SelectItem>
                  <SelectItem value="35-50 ans">35-50 ans</SelectItem>
                  <SelectItem value="+50 ans">+50 ans</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Types de visiteur</Label>
              <div className="flex flex-wrap gap-2">
                {['Nouveau Arrivant', 'Nouveau Converti', 'De Passage'].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={editData.types.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditData({...editData, types: [...editData.types, type]});
                        } else {
                          setEditData({...editData, types: editData.types.filter(t => t !== type)});
                        }
                      }}
                    />
                    <label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-purple-50 border-purple-200">
              <Checkbox
                id="edit-ejp"
                checked={editData.ejp}
                onCheckedChange={(checked) => setEditData({...editData, ejp: checked})}
              />
              <Label htmlFor="edit-ejp" className="font-medium cursor-pointer text-purple-900">
                Église des Jeunes Prodiges (EJP)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Stop Dialog */}
      <AlertDialog open={showStopConfirm} onOpenChange={setShowStopConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'arrêt du suivi</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir arrêter le suivi de {visitor.firstname} {visitor.lastname}? 
              Cette personne sera retirée de la liste mais restera dans la base de données.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-stop">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStopTracking} data-testid="final-confirm-stop">
              Oui, arrêter le suivi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default VisitorDetailPage;
