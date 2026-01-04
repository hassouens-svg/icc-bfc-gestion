import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PublicBergerieLayout from '../components/PublicBergerieLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { ArrowLeft, MessageSquare, Calendar, Award, StopCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';

const monthNames = {
  '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
  '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
  '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
};

const PublicBergerieVisitorDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  
  const ville = searchParams.get('ville') || '';
  const monthNum = searchParams.get('month') || '01';
  
  const guestContextStr = localStorage.getItem('guest_bergerie_context');
  const guestContext = guestContextStr ? JSON.parse(guestContextStr) : {
    ville,
    month_num: monthNum,
    month_name: monthNames[monthNum] || monthNum,
    nom: `Bergerie ${monthNames[monthNum] || monthNum}`
  };

  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [stopReason, setStopReason] = useState('');
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    firstname: '', lastname: '', phone: '', email: '', 
    address: '', arrival_channel: '', age_range: '', types: [], ejp: false
  });

  // Presence states
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedType, setSelectedType] = useState('dimanche');
  const [selectedPresence, setSelectedPresence] = useState('oui');

  useEffect(() => {
    if (!id) {
      navigate(`/bergerie/visitors?ville=${encodeURIComponent(ville)}&month=${monthNum}`);
      return;
    }
    loadVisitor();
  }, [id]);

  const loadVisitor = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/visitors/public/${id}`);
      if (response.ok) {
        const data = await response.json();
        setVisitor(data);
      } else {
        toast.error('Visiteur non trouvé');
        navigate(`/bergerie/visitors?ville=${encodeURIComponent(ville)}&month=${monthNum}`);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
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
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/visitors/public/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText })
      });
      toast.success('Commentaire ajouté!');
      setCommentText('');
      loadVisitor();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleAddPresence = async () => {
    if (!selectedDate) {
      toast.error('Veuillez sélectionner une date');
      return;
    }
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_id: id,
          date: selectedDate,
          present: selectedPresence === 'oui',
          ville: ville,
          bergerie_month: monthNum,
          type: selectedType
        })
      });
      toast.success('Présence enregistrée!');
      setSelectedDate('');
      loadVisitor();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleFormationToggle = async (formationType, currentValue) => {
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/visitors/public/${id}/formation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formation_type: formationType, value: !currentValue })
      });
      toast.success('Formation mise à jour!');
      loadVisitor();
    } catch (error) {
      toast.error('Erreur');
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
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/visitors/public/${id}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: stopReason })
      });
      toast.success('Suivi arrêté');
      navigate(`/bergerie/visitors?ville=${encodeURIComponent(ville)}&month=${monthNum}`);
    } catch (error) {
      toast.error('Erreur');
    }
    setShowStopConfirm(false);
  };

  const handleOpenEditDialog = () => {
    setEditData({
      firstname: visitor.firstname || '',
      lastname: visitor.lastname || '',
      phone: visitor.phone || '',
      email: visitor.email || '',
      address: visitor.address || '',
      arrival_channel: visitor.arrival_channel || '',
      age_range: visitor.age_range || '',
      types: visitor.types || [],
      ejp: visitor.ejp || false
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/visitors/public/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      toast.success('Informations mises à jour!');
      setIsEditDialogOpen(false);
      loadVisitor();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  if (loading) {
    return (
      <PublicBergerieLayout guestContext={guestContext}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PublicBergerieLayout>
    );
  }

  if (!visitor) return null;

  return (
    <PublicBergerieLayout guestContext={guestContext}>
      <div className="space-y-6">
        {/* Header - identique à VisitorDetailPage.jsx */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/bergerie/visitors?ville=${encodeURIComponent(ville)}&month=${monthNum}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{visitor.firstname} {visitor.lastname}</h2>
              <p className="text-gray-500">Détails et suivi du nouveaux arrivants et nouveaux convertis</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenEditDialog}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="destructive" onClick={() => setShowStopDialog(true)}>
              <StopCircle className="h-4 w-4 mr-2" />
              Arrêter
            </Button>
          </div>
        </div>

        {/* Informations de base - identique à VisitorDetailPage.jsx */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Types</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(visitor.types || []).map((type, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-gray-500">Téléphone</Label>
                <p className="font-medium">{visitor.phone || '-'}</p>
              </div>
              <div>
                <Label className="text-gray-500">Email</Label>
                <p className="font-medium">{visitor.email || '-'}</p>
              </div>
              <div>
                <Label className="text-gray-500">Canal d'arrivée</Label>
                <p className="font-medium">{visitor.arrival_channel || '-'}</p>
              </div>
              <div>
                <Label className="text-gray-500">Type de visite</Label>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                  {visitor.visitor_type || 'Ancien Visiteur'}
                </span>
              </div>
              <div>
                <Label className="text-gray-500">Date de visite</Label>
                <p className="font-medium">{visitor.visit_date || '-'}</p>
              </div>
              <div>
                <Label className="text-gray-500">Mois assigné</Label>
                <p className="font-medium">{visitor.assigned_month || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Formations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="formation_pcnc"
                  checked={visitor.formation_pcnc || false}
                  onCheckedChange={() => handleFormationToggle('formation_pcnc', visitor.formation_pcnc)}
                />
                <Label htmlFor="formation_pcnc">Formation PCNC</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="formation_au_coeur_bible"
                  checked={visitor.formation_au_coeur_bible || false}
                  onCheckedChange={() => handleFormationToggle('formation_au_coeur_bible', visitor.formation_au_coeur_bible)}
                />
                <Label htmlFor="formation_au_coeur_bible">Au Cœur de la Bible</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="formation_star"
                  checked={visitor.formation_star || false}
                  onCheckedChange={() => handleFormationToggle('formation_star', visitor.formation_star)}
                />
                <Label htmlFor="formation_star">Formation STAR</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enregistrer Présence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Enregistrer une Présence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dimanche">Dimanche</SelectItem>
                    <SelectItem value="jeudi">Jeudi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Présence</Label>
                <Select value={selectedPresence} onValueChange={setSelectedPresence}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oui">Présent</SelectItem>
                    <SelectItem value="non">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddPresence}>Enregistrer</Button>
            </div>
          </CardContent>
        </Card>

        {/* Commentaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Commentaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ajouter un commentaire..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddComment}>Ajouter</Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(visitor.comments || []).length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun commentaire</p>
              ) : (
                visitor.comments.map((c, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded">
                    <p className="text-sm">{c.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{c.date} - {c.author}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Modifier les informations</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Prénom</Label><Input value={editData.firstname} onChange={(e) => setEditData({...editData, firstname: e.target.value})} /></div>
                <div><Label>Nom</Label><Input value={editData.lastname} onChange={(e) => setEditData({...editData, lastname: e.target.value})} /></div>
              </div>
              <div><Label>Téléphone</Label><Input value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value})} /></div>
              <div><Label>Email</Label><Input type="email" value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} /></div>
              <div><Label>Canal d'arrivée</Label>
                <Select value={editData.arrival_channel} onValueChange={(v) => setEditData({...editData, arrival_channel: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Réseaux sociaux">Réseaux sociaux</SelectItem>
                    <SelectItem value="Invitation par un membre (hors évangélisation)">Invitation par un membre</SelectItem>
                    <SelectItem value="Evangelisation">Évangélisation</SelectItem>
                    <SelectItem value="Ancien Visiteur">Ancien Visiteur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="ejp" checked={editData.ejp} onCheckedChange={(c) => setEditData({...editData, ejp: c})} />
                <Label htmlFor="ejp">EJP (Église des Jeunes Prodiges)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSaveEdit}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stop Dialog */}
        <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Arrêter le suivi</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Label>Raison de l'arrêt</Label>
              <Textarea value={stopReason} onChange={(e) => setStopReason(e.target.value)} placeholder="Raison..." />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStopDialog(false)}>Annuler</Button>
              <Button variant="destructive" onClick={handleStopTracking}>Confirmer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Stop Dialog */}
        <AlertDialog open={showStopConfirm} onOpenChange={setShowStopConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer l'arrêt du suivi</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir arrêter le suivi de {visitor.firstname} {visitor.lastname} ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmStopTracking}>Confirmer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PublicBergerieLayout>
  );
};

export default PublicBergerieVisitorDetailPage;
