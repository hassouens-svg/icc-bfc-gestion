import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, X, Calendar, DollarSign, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { getUser } from '../utils/api';

const ProjetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [projet, setProjet] = useState(null);
  const [taches, setTaches] = useState([]);
  const [commentaires, setCommentaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTacheOpen, setIsTacheOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newTache, setNewTache] = useState({ titre: '', description: '', deadline: '' });
  const [editData, setEditData] = useState({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [projetRes, tachesRes, commentsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/projets/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/taches?projet_id=${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/commentaires?projet_id=${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      const projetData = await projetRes.json();
      const tachesData = await tachesRes.json();
      const commentsData = await commentsRes.json();
      setProjet(projetData);
      setEditData(projetData);
      setTaches(tachesData);
      setCommentaires(commentsData);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProjet = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/projets/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      });
      toast.success('Projet mis à jour');
      setIsEditOpen(false);
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleCreateTache = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/taches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...newTache, projet_id: id })
      });
      toast.success('Tâche créée');
      setIsTacheOpen(false);
      setNewTache({ titre: '', description: '', deadline: '' });
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleUpdateTacheStatut = async (tacheId, newStatut) => {
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/taches/${tacheId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ statut: newStatut })
      });
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/commentaires`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ projet_id: id, texte: newComment })
      });
      setNewComment('');
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  if (loading) return <Layout><div className="p-6">Chargement...</div></Layout>;
  if (!projet) return <Layout><div className="p-6">Projet non trouvé</div></Layout>;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/events/projets')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{projet.titre}</h1>
            <p className="text-gray-500">Par {projet.created_by} • {projet.ville}</p>
          </div>
          <Button onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" /> Modifier
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Statut</CardTitle></CardHeader>
            <CardContent>
              <Select value={projet.statut} onValueChange={(val) => handleUpdateProjet({ statut: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planifie">Planifié</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Dates</CardTitle></CardHeader>
            <CardContent className="text-sm">
              {projet.date_debut ? (
                <div>
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {new Date(projet.date_debut).toLocaleDateString('fr-FR')} - {projet.date_fin ? new Date(projet.date_fin).toLocaleDateString('fr-FR') : '...'}
                </div>
              ) : 'Aucune date'}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Budget</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <div>Prévu: {projet.budget_prevu}€</div>
              <div>Réel: {projet.budget_reel || 0}€</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-600">{projet.description || 'Aucune description'}</p>
          </CardContent>
        </Card>

        {/* Tâches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tâches ({taches.length})</CardTitle>
            <Button size="sm" onClick={() => setIsTacheOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nouvelle tâche
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {taches.map((tache) => (
                <div key={tache.id} className="flex items-center gap-3 p-3 border rounded">
                  <button
                    onClick={() => handleUpdateTacheStatut(tache.id, tache.statut === 'termine' ? 'a_faire' : 'termine')}
                    className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                      tache.statut === 'termine' ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}
                  >
                    {tache.statut === 'termine' && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <div className="flex-1">
                    <div className={tache.statut === 'termine' ? 'line-through text-gray-400' : ''}>{tache.titre}</div>
                    {tache.deadline && <div className="text-xs text-gray-500">Deadline: {new Date(tache.deadline).toLocaleDateString('fr-FR')}</div>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Commentaires */}
        <Card>
          <CardHeader><CardTitle>Commentaires</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              {commentaires.map((com) => (
                <div key={com.id} className="border-l-4 border-blue-500 pl-3 py-2">
                  <div className="text-sm font-semibold">{com.user}</div>
                  <div className="text-sm text-gray-600">{com.texte}</div>
                  <div className="text-xs text-gray-400">{new Date(com.created_at).toLocaleString('fr-FR')}</div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input
                placeholder="Ajouter un commentaire..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button type="submit">Envoyer</Button>
            </form>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Modifier le projet</DialogTitle></DialogHeader>
            <form onSubmit={handleUpdateProjet} className="space-y-4">
              <div><Label>Titre</Label><Input value={editData.titre || ''} onChange={(e) => setEditData({...editData, titre: e.target.value})} /></div>
              <div><Label>Description</Label><textarea className="w-full border rounded p-2" rows={3} value={editData.description || ''} onChange={(e) => setEditData({...editData, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date début</Label><Input type="date" value={editData.date_debut || ''} onChange={(e) => setEditData({...editData, date_debut: e.target.value})} /></div>
                <div><Label>Date fin</Label><Input type="date" value={editData.date_fin || ''} onChange={(e) => setEditData({...editData, date_fin: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Budget prévu</Label><Input type="number" value={editData.budget_prevu || 0} onChange={(e) => setEditData({...editData, budget_prevu: parseFloat(e.target.value)})} /></div>
                <div><Label>Budget réel</Label><Input type="number" value={editData.budget_reel || 0} onChange={(e) => setEditData({...editData, budget_reel: parseFloat(e.target.value)})} /></div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Annuler</Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isTacheOpen} onOpenChange={setIsTacheOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle tâche</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateTache} className="space-y-4">
              <div><Label>Titre *</Label><Input value={newTache.titre} onChange={(e) => setNewTache({...newTache, titre: e.target.value})} required /></div>
              <div><Label>Description</Label><textarea className="w-full border rounded p-2" rows={2} value={newTache.description} onChange={(e) => setNewTache({...newTache, description: e.target.value})} /></div>
              <div><Label>Deadline</Label><Input type="date" value={newTache.deadline} onChange={(e) => setNewTache({...newTache, deadline: e.target.value})} /></div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsTacheOpen(false)}>Annuler</Button>
                <Button type="submit">Créer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ProjetDetailPage;