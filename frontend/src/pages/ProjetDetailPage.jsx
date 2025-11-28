import React, { useState, useEffect } from 'react';
import EventsLayout from '../components/EventsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, X, Calendar, DollarSign, Edit, Trash2, Users, Target } from 'lucide-react';
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
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newTache, setNewTache] = useState({ titre: '', description: '', deadline: '', assigne_a: '' });
  const [newMember, setNewMember] = useState({ nom: '', email: '' });
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
      setNewTache({ titre: '', description: '', deadline: '', assigne_a: '' });
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

  const handleAddMember = async () => {
    if (!newMember.nom || !newMember.email) {
      toast.error('Nom et email requis');
      return;
    }
    const updatedMembers = [...(projet.team_members || []), newMember];
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/projets/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ team_members: updatedMembers })
      });
      toast.success('Membre ajouté');
      setNewMember({ nom: '', email: '' });
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleRemoveMember = async (index) => {
    const updatedMembers = (projet.team_members || []).filter((_, i) => i !== index);
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/projets/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ team_members: updatedMembers })
      });
      toast.success('Membre retiré');
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

  // KPIs calculations
  const getProgressStats = () => {
    const total = taches.length;
    if (total === 0) return { total: 0, termine: 0, enCours: 0, aFaire: 0, progress: 0 };
    const termine = taches.filter(t => t.statut === 'termine').length;
    const enCours = taches.filter(t => t.statut === 'en_cours').length;
    const aFaire = taches.filter(t => t.statut === 'a_faire').length;
    const progress = Math.round((termine / total) * 100);
    return { total, termine, enCours, aFaire, progress };
  };

  const getTeamStats = () => {
    const members = projet?.team_members || [];
    return members.map(member => {
      const memberTaches = taches.filter(t => t.assigne_a === member.email);
      const termine = memberTaches.filter(t => t.statut === 'termine').length;
      const enCours = memberTaches.filter(t => t.statut === 'en_cours').length;
      return {
        ...member,
        total: memberTaches.length,
        termine,
        enCours,
        progress: memberTaches.length > 0 ? Math.round((termine / memberTaches.length) * 100) : 0
      };
    });
  };

  const getBudgetStatus = () => {
    const prevu = projet?.budget_prevu || 0;
    const reel = projet?.budget_reel || 0;
    const percentage = prevu > 0 ? Math.round((reel / prevu) * 100) : 0;
    const status = percentage > 100 ? 'danger' : percentage > 80 ? 'warning' : 'success';
    return { prevu, reel, percentage, status };
  };

  const stats = getProgressStats();
  const teamStats = getTeamStats();
  const budgetStatus = getBudgetStatus();

  if (loading) return <EventsLayout><div className="p-6">Chargement...</div></EventsLayout>;
  if (!projet) return <EventsLayout><div className="p-6">Projet non trouvé</div></EventsLayout>;

  return (
    <EventsLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
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

        {/* KPIs Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Progression globale */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="h-8 w-8 mx-auto mb-2" />
                <div className="text-4xl font-bold">{stats.progress}%</div>
                <div className="text-sm">Progression</div>
                <div className="mt-2 bg-white/20 rounded-full h-2 overflow-hidden">
                  <div className="bg-white h-full" style={{width: `${stats.progress}%`}}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tâches */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-sm text-gray-600">Tâches totales</div>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-green-600">✓ Terminées:</span>
                    <span className="font-semibold">{stats.termine}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-600">⟳ En cours:</span>
                    <span className="font-semibold">{stats.enCours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">○ À faire:</span>
                    <span className="font-semibold">{stats.aFaire}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card className={budgetStatus.status === 'danger' ? 'border-red-500' : budgetStatus.status === 'warning' ? 'border-yellow-500' : ''}>
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-xl font-bold">{budgetStatus.percentage}%</div>
                <div className="text-sm text-gray-600">Budget utilisé</div>
                <div className="mt-2 text-xs">
                  <div>{budgetStatus.reel}€ / {budgetStatus.prevu}€</div>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full ${budgetStatus.status === 'danger' ? 'bg-red-500' : budgetStatus.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{width: `${Math.min(budgetStatus.percentage, 100)}%`}}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Équipe */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold">{(projet.team_members || []).length}</div>
                <div className="text-sm text-gray-600">Membres d'équipe</div>
                <Button size="sm" className="mt-3 w-full" onClick={() => setIsTeamOpen(true)}>
                  Gérer l'équipe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Performance */}
        {teamStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance de l'équipe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamStats.map((member, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="font-semibold">{member.nom}</div>
                        <div className="text-xs text-gray-500">{member.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{member.progress}%</div>
                        <div className="text-xs text-gray-500">{member.termine}/{member.total} tâches</div>
                      </div>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{width: `${member.progress}%`}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info basiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Statut</CardTitle></CardHeader>
            <CardContent>
              <Select value={projet.statut} onValueChange={async (val) => {
                await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/projets/${id}`, {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ statut: val })
                });
                loadData();
              }}>
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
            <CardHeader><CardTitle className="text-sm">Description</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <p className="text-gray-600">{projet.description || 'Aucune description'}</p>
            </CardContent>
          </Card>
        </div>

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
                    className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      tache.statut === 'termine' ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}
                  >
                    {tache.statut === 'termine' && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <div className="flex-1">
                    <div className={tache.statut === 'termine' ? 'line-through text-gray-400' : 'font-medium'}>{tache.titre}</div>
                    {tache.assigne_a && (
                      <div className="text-xs text-gray-500">Assignée à : {tache.assigne_a}</div>
                    )}
                    {tache.deadline && <div className="text-xs text-gray-500">Deadline: {new Date(tache.deadline).toLocaleDateString('fr-FR')}</div>}
                  </div>
                  <Select
                    value={tache.statut}
                    onValueChange={(val) => handleUpdateTacheStatut(tache.id, val)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a_faire">À faire</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
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

        {/* Dialog Team Management */}
        <Dialog open={isTeamOpen} onOpenChange={setIsTeamOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Gestion de l'équipe</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Membres actuels</h3>
                {(projet.team_members || []).length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucun membre dans l&apos;équipe</p>
                ) : (
                  <div className="space-y-2">
                    {(projet.team_members || []).map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{member.nom}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => handleRemoveMember(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Ajouter un membre</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nom complet</Label>
                    <Input
                      value={newMember.nom}
                      onChange={(e) => setNewMember({...newMember, nom: e.target.value})}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={newMember.email}
                      onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                      placeholder="jean@email.com"
                    />
                  </div>
                </div>
                <Button className="mt-3 w-full" onClick={handleAddMember}>
                  <Plus className="h-4 w-4 mr-2" /> Ajouter ce membre
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Edit Projet */}
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
                <div><Label>Budget prévu (€)</Label><Input type="number" value={editData.budget_prevu || 0} onChange={(e) => setEditData({...editData, budget_prevu: parseFloat(e.target.value)})} /></div>
                <div><Label>Budget réel (€)</Label><Input type="number" value={editData.budget_reel || 0} onChange={(e) => setEditData({...editData, budget_reel: parseFloat(e.target.value)})} /></div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Annuler</Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Nouvelle Tâche */}
        <Dialog open={isTacheOpen} onOpenChange={setIsTacheOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle tâche</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateTache} className="space-y-4">
              <div><Label>Titre *</Label><Input value={newTache.titre} onChange={(e) => setNewTache({...newTache, titre: e.target.value})} required /></div>
              <div><Label>Description</Label><textarea className="w-full border rounded p-2" rows={2} value={newTache.description} onChange={(e) => setNewTache({...newTache, description: e.target.value})} /></div>
              <div>
                <Label>Assigner à</Label>
                <Select value={newTache.assigne_a || "non_assigne"} onValueChange={(val) => setNewTache({...newTache, assigne_a: val === "non_assigne" ? "" : val})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un membre" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non_assigne">Non assignée</SelectItem>
                    {(projet.team_members || []).map((member, idx) => (
                      <SelectItem key={idx} value={member.email}>{member.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Deadline</Label><Input type="date" value={newTache.deadline} onChange={(e) => setNewTache({...newTache, deadline: e.target.value})} /></div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsTacheOpen(false)}>Annuler</Button>
                <Button type="submit">Créer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </EventsLayout>
  );
};

export default ProjetDetailPage;