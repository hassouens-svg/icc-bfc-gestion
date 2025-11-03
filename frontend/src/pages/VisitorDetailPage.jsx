import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getVisitor, getUser, addComment, addPresence, updateFormation, stopTracking, updateVisitor } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { ArrowLeft, MessageSquare, Calendar, Award, StopCircle } from 'lucide-react';
import { toast } from 'sonner';

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

  // Calendar states
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedType, setSelectedType] = useState('dimanche');
  const [selectedPresence, setSelectedPresence] = useState('oui');

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
      toast.error('Erreur lors du chargement du visiteur');
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

  const handleAddPresence = async () => {
    if (!selectedDate) {
      toast.error('Veuillez sélectionner une date');
      return;
    }

    try {
      await addPresence(id, selectedDate, selectedPresence === 'oui', selectedType);
      toast.success('Présence enregistrée!');
      setSelectedDate('');
      loadVisitor();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleFormationToggle = async (formationType, currentValue) => {
    try {
      await updateFormation(id, formationType, !currentValue);
      toast.success('Formation mise à jour!');
      loadVisitor();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
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
              <h2 className="text-3xl font-bold text-gray-900" data-testid="visitor-name">
                {visitor.firstname} {visitor.lastname}
              </h2>
              <p className="text-gray-500 mt-1">Détails et suivi du visiteur</p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowStopDialog(true)}
            data-testid="stop-tracking-button"
          >
            <StopCircle className="h-4 w-4 mr-2" />
            Arrêter le suivi
          </Button>
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
                <p className="text-sm text-gray-500">Canal d'arrivée</p>
                <p className="font-medium">{visitor.arrival_channel}</p>
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

        {/* Formations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Formations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pcnc"
                  checked={visitor.formation_pcnc}
                  onCheckedChange={() => handleFormationToggle('pcnc', visitor.formation_pcnc)}
                  data-testid="formation-pcnc"
                />
                <Label htmlFor="pcnc" className="font-medium cursor-pointer">PCNC</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="au_coeur_bible"
                  checked={visitor.formation_au_coeur_bible}
                  onCheckedChange={() => handleFormationToggle('au_coeur_bible', visitor.formation_au_coeur_bible)}
                  data-testid="formation-au-coeur-bible"
                />
                <Label htmlFor="au_coeur_bible" className="font-medium cursor-pointer">Au cœur de la bible</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="star"
                  checked={visitor.formation_star}
                  onCheckedChange={() => handleFormationToggle('star', visitor.formation_star)}
                  data-testid="formation-star"
                />
                <Label htmlFor="star" className="font-medium cursor-pointer">STAR</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Presence Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Suivi des présences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add presence form */}
              <div className="border p-4 rounded-lg bg-gray-50">
                <h4 className="font-medium mb-3">Ajouter une présence</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="presence-date">Date</Label>
                    <Input
                      id="presence-date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      data-testid="presence-date-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="presence-type">Type</Label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger data-testid="presence-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dimanche">Dimanche</SelectItem>
                        <SelectItem value="jeudi">Jeudi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="presence-status">Présence</Label>
                    <Select value={selectedPresence} onValueChange={setSelectedPresence}>
                      <SelectTrigger data-testid="presence-status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oui">
                          <span className="flex items-center">
                            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                            Oui
                          </span>
                        </SelectItem>
                        <SelectItem value="non">
                          <span className="flex items-center">
                            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                            Non
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddPresence} className="w-full" data-testid="add-presence-button">
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </div>

              {/* Presence history - Dimanche */}
              <div>
                <h4 className="font-medium mb-2">Présences Dimanche</h4>
                <div className="space-y-2">
                  {visitor.presences_dimanche && visitor.presences_dimanche.length > 0 ? (
                    visitor.presences_dimanche.sort((a, b) => new Date(b.date) - new Date(a.date)).map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{p.date}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          p.present 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {p.present ? 'Oui' : 'Non'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Aucune présence enregistrée</p>
                  )}
                </div>
              </div>

              {/* Presence history - Jeudi */}
              <div>
                <h4 className="font-medium mb-2">Présences Jeudi</h4>
                <div className="space-y-2">
                  {visitor.presences_jeudi && visitor.presences_jeudi.length > 0 ? (
                    visitor.presences_jeudi.sort((a, b) => new Date(b.date) - new Date(a.date)).map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{p.date}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          p.present 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {p.present ? 'Oui' : 'Non'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Aucune présence enregistrée</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Commentaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Ajouter un commentaire..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  data-testid="comment-textarea"
                />
                <Button onClick={handleAddComment} data-testid="add-comment-button">
                  Ajouter un commentaire
                </Button>
              </div>

              {/* Comments list */}
              <div className="space-y-3">
                {visitor.comments && visitor.comments.length > 0 ? (
                  visitor.comments.sort((a, b) => new Date(b.date) - new Date(a.date)).map((comment, idx) => (
                    <div key={idx} className="border p-3 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Aucun commentaire</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stop Tracking Dialog */}
      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arrêter le suivi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Veuillez indiquer la raison pour laquelle vous souhaitez arrêter le suivi de ce visiteur.
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
