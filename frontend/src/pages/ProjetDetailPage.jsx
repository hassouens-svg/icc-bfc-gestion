import React, { useState, useEffect } from 'react';
import EventsLayout from '../components/EventsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, X, Calendar, DollarSign, Edit, Trash2, Users, Target, AlertCircle, Filter } from 'lucide-react';
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
  const [poles, setPoles] = useState([]);
  const [commentaires, setCommentaires] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTacheOpen, setIsTacheOpen] = useState(false);
  const [isPoleOpen, setIsPoleOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isDepenseOpen, setIsDepenseOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newTache, setNewTache] = useState({ titre: '', description: '', deadline: '', assigne_a: '', pole_id: '' });
  const [newPole, setNewPole] = useState({ nom: '', description: '', responsable: '' });
  const [editingPole, setEditingPole] = useState(null);
  const [newMember, setNewMember] = useState({ nom: '', telephone: '', role: '' });
  const [newDepense, setNewDepense] = useState({ montant: '', raison: '', date: new Date().toISOString().split('T')[0] });
  const [editData, setEditData] = useState({});
  const [filtreStatut, setFiltreStatut] = useState('tous');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [projetRes, tachesRes, polesRes, commentsRes, depensesRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/projets/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/taches?projet_id=${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/poles?projet_id=${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/commentaires?projet_id=${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/depenses?projet_id=${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      const projetData = await projetRes.json();
      const tachesData = await tachesRes.json();
      const polesData = await polesRes.json();
      const commentsData = await commentsRes.json();
      const depensesData = await depensesRes.json();
      
      setProjet(projetData);
      setTaches(tachesData);
      setPoles(polesData);
      setCommentaires(commentsData);
      setDepenses(depensesData);
      setEditData(projetData);
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepense = async () => {
    if (!newDepense.montant || !newDepense.raison) {
      toast.error('Montant et raison requis');
      return;
    }

    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/depenses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...newDepense, projet_id: id })
      });
      
      toast.success('Dépense ajoutée');
      setNewDepense({ montant: '', raison: '', date: new Date().toISOString().split('T')[0] });
      setIsDepenseOpen(false);
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDeleteDepense = async (depenseId) => {
    if (!window.confirm('Supprimer cette dépense ?')) return;

    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/depenses/${depenseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Dépense supprimée');
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleUpdate = async () => {
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

  const handleAddTache = async () => {
    if (!newTache.titre) {
      toast.error('Titre requis');
      return;
    }

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
      setNewTache({ titre: '', description: '', deadline: '', assigne_a: '', pole_id: '' });
      setIsTacheOpen(false);
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

  const handleDeleteTache = async (tacheId) => {
    if (!window.confirm('Supprimer cette tâche ?')) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/taches/${tacheId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        throw new Error('Erreur de suppression');
      }
      
      toast.success('Tâche supprimée');
      // Force immediate update
      setTaches(prev => prev.filter(t => t.id !== tacheId));
      await loadData();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleAddPole = async () => {
    if (!newPole.nom) {
      toast.error('Nom du pôle requis');
      return;
    }

    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/poles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...newPole, projet_id: id })
      });
      toast.success('Pôle créé');
      setNewPole({ nom: '', description: '', responsable: '' });
      setIsPoleOpen(false);
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleUpdatePole = async () => {
    if (!editingPole || !editingPole.nom) {
      toast.error('Nom du pôle requis');
      return;
    }

    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/poles/${editingPole.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nom: editingPole.nom,
          description: editingPole.description,
          responsable: editingPole.responsable
        })
      });
      toast.success('Pôle mis à jour');
      setEditingPole(null);
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDeletePole = async (poleId) => {
    if (!window.confirm('Supprimer ce pôle ? Les tâches associées devront être réassignées.')) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/poles/${poleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.detail || 'Erreur de suppression');
        return;
      }

      toast.success('Pôle supprimé');
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };


  const handleAddComment = async () => {
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

  const handleAddMember = async () => {
    if (!newMember.nom || !newMember.role) {
      toast.error('Nom et rôle requis');
      return;
    }

    try {
      const updatedMembers = [...(editData.team_members || []), newMember];
      
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/projets/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ team_members: updatedMembers })
      });
      
      toast.success(`${newMember.nom} ajouté à l'équipe`);
      setNewMember({ nom: '', telephone: '', role: '' });
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du membre');
    }
  };

  const handleRemoveMember = async (index) => {
    const memberToRemove = editData.team_members[index];
    if (!window.confirm(`Retirer ${memberToRemove.nom} de l'équipe ?`)) return;

    try {
      const updatedMembers = (editData.team_members || []).filter((_, i) => i !== index);
      
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/projets/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ team_members: updatedMembers })
      });
      
      toast.success(`${memberToRemove.nom} retiré de l'équipe`);
      await loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression du membre');
    }
  };

  const handleSaveTeam = async () => {
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/projets/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ team_members: editData.team_members })
      });
      toast.success('Équipe mise à jour');
      setIsTeamOpen(false);
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const getProgressStats = () => {
    const termine = taches.filter(t => t.statut === 'termine').length;
    const enCours = taches.filter(t => t.statut === 'en_cours').length;
    const aFaire = taches.filter(t => t.statut === 'a_faire').length;
    const enRetard = taches.filter(t => t.statut === 'en_retard').length;
    return { total: taches.length, termine, enCours, aFaire, enRetard };
  };

  const getBudgetStatus = () => {
    const prevu = projet?.budget_prevu || 0;
    const reel = Math.max(0, projet?.budget_reel || 0); // Force 0 minimum
    const percentage = prevu > 0 ? Math.round((reel / prevu) * 100) : 0;
    const restant = Math.max(0, prevu - reel);
    
    let status = 'success';
    if (percentage >= 90) status = 'danger';
    else if (percentage >= 75) status = 'warning';
    
    return { prevu, reel, percentage, restant, status };
  };

  const getTeamStats = () => {
    if (!projet?.team_members) return [];
    
    return projet.team_members.map(member => {
      const memberTaches = taches.filter(t => t.assigne_a === member.nom);
      const termine = memberTaches.filter(t => t.statut === 'termine').length;
      const total = memberTaches.length;
      const progress = total > 0 ? Math.round((termine / total) * 100) : 0;
      
      return { ...member, total, termine, progress };
    });
  };

  const getTaskColor = (statut) => {
    if (statut === 'termine') return 'border-l-4 border-green-500 bg-green-50';
    if (statut === 'en_cours') return 'border-l-4 border-yellow-500 bg-yellow-50';
    if (statut === 'en_retard') return 'border-l-4 border-red-500 bg-red-50';
    return 'border-l-4 border-gray-300 bg-white';
  };

  const getStatutBadge = (statut) => {
    if (statut === 'termine') return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">✓ Terminé</span>;
    if (statut === 'en_cours') return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">⟳ En cours</span>;
    if (statut === 'en_retard') return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">🔴 En retard</span>;
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">○ À faire</span>;
  };

  if (loading) {
    return (
      <EventsLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </EventsLayout>
    );
  }

  if (!projet) {
    return (
      <EventsLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Projet non trouvé</div>
        </div>
      </EventsLayout>
    );
  }

  const stats = getProgressStats();
  const budgetStatus = getBudgetStatus();
  const teamStats = getTeamStats();
  const tachesFiltrees = filtreStatut === 'tous' ? taches : taches.filter(t => t.statut === filtreStatut);

  return (
    <EventsLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/events/projets')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-5xl font-bold">{projet.nom}</h1>
                <div className="flex items-center gap-2">
                  <div className="text-4xl font-bold text-blue-600">
                    {stats.total > 0 ? Math.round((stats.termine / stats.total) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-500">d'achèvement</div>
                </div>
              </div>
              <p className="text-gray-500 text-base mt-2">{projet.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
              <Edit className="h-4 w-4 mr-2" /> Modifier
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-sm text-gray-600">Tâches totales</div>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-green-600">✓ Terminées:</span><span className="font-semibold">{stats.termine}</span></div>
                  <div className="flex justify-between"><span className="text-yellow-600">⟳ En cours:</span><span className="font-semibold">{stats.enCours}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">○ À faire:</span><span className="font-semibold">{stats.aFaire}</span></div>
                  <div className="flex justify-between"><span className="text-red-600">🔴 En retard:</span><span className="font-semibold">{stats.enRetard}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card className={budgetStatus.status === 'danger' ? 'border-red-500' : budgetStatus.status === 'warning' ? 'border-yellow-500' : ''}>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl mx-auto mb-2">💰</div>
                <div className="text-xl font-bold">{budgetStatus.percentage}%</div>
                <div className="text-sm text-gray-600">Budget utilisé</div>
                <div className="mt-3">
                  <div className="text-lg font-semibold">
                    <span className={budgetStatus.reel > 0 ? 'text-red-600' : 'text-gray-600'}>{budgetStatus.reel}€</span>
                    <span className="text-gray-400"> / </span>
                    <span className="text-gray-800">{budgetStatus.prevu}€</span>
                  </div>
                  <div className="text-sm text-green-600 font-semibold mt-1">Restant: {budgetStatus.restant}€</div>
                </div>
                <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className={`h-full ${budgetStatus.status === 'danger' ? 'bg-red-500' : budgetStatus.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{width: `${Math.min(budgetStatus.percentage, 100)}%`}}></div>
                </div>
                <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setIsDepenseOpen(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Ajouter dépense
                </Button>
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

          {/* Deadline */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <div className="text-sm text-gray-600">Deadline</div>
                <div className="text-lg font-bold mt-2">{projet.deadline || 'Non définie'}</div>
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${projet.statut === 'Terminé' ? 'bg-green-100 text-green-800' : projet.statut === 'En cours' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {projet.statut}
                  </span>
                </div>
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
                        <div className="text-xs text-gray-500">{member.role}</div>
                        {member.telephone && <div className="text-xs text-gray-400">📱 {member.telephone}</div>}
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

        {/* Dépenses - Affichée SEULEMENT s'il y a des dépenses */}
        {depenses && depenses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 Dépenses ({depenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {depenses.map((depense) => (
                  <div key={depense.id} className="flex items-center justify-between border rounded p-3 hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="font-semibold">{depense.raison}</div>
                      <div className="text-xs text-gray-500">{new Date(depense.date).toLocaleDateString('fr-FR')} • Par {depense.created_by}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-red-600">{depense.montant}€</div>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteDepense(depense.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pôles et Tâches */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>📊 Pôles du Projet ({poles.length})</CardTitle>
              <Button onClick={() => setIsPoleOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Nouveau Pôle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {poles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun pôle créé. Créez des pôles pour organiser vos tâches.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {poles.map(pole => {
                  const poleTaches = taches.filter(t => t.pole_id === pole.id);
                  const tachesTerminees = poleTaches.filter(t => t.statut === 'termine').length;
                  const pourcentage = poleTaches.length > 0 ? Math.round((tachesTerminees / poleTaches.length) * 100) : 0;
                  
                  return (
                    <div key={pole.id} className="border-2 border-purple-200 rounded-lg overflow-hidden">
                      {/* En-tête du Pôle */}
                      <div className="bg-purple-50 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {editingPole?.id === pole.id ? (
                              <div className="space-y-2">
                                <Input
                                  value={editingPole.nom}
                                  onChange={(e) => setEditingPole({...editingPole, nom: e.target.value})}
                                  placeholder="Nom du pôle"
                                  className="font-semibold"
                                />
                                <Input
                                  value={editingPole.description || ''}
                                  onChange={(e) => setEditingPole({...editingPole, description: e.target.value})}
                                  placeholder="Description"
                                />
                                <Select value={editingPole.responsable || ''} onValueChange={(val) => setEditingPole({...editingPole, responsable: val})}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner responsable" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(projet.team_members || []).map((member, idx) => (
                                      <SelectItem key={idx} value={member.nom}>{member.nom} - {member.role}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleUpdatePole}>
                                    <Check className="h-4 w-4 mr-1" /> Enregistrer
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingPole(null)}>
                                    <X className="h-4 w-4 mr-1" /> Annuler
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-3">
                                  <h3 className="text-xl font-bold text-purple-900">{pole.nom}</h3>
                                  <div className="flex items-center gap-2">
                                    <div className="text-2xl font-bold text-purple-600">{pourcentage}%</div>
                                    <span className="text-sm text-gray-600">({tachesTerminees}/{poleTaches.length} tâches)</span>
                                  </div>
                                </div>
                                {pole.description && (
                                  <p className="text-sm text-gray-600 mt-1">{pole.description}</p>
                                )}
                                {pole.responsable && (
                                  <div className="flex items-center gap-1 mt-2 text-sm text-purple-700">
                                    <Users className="h-4 w-4" />
                                    <span className="font-medium">Responsable: {pole.responsable}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          {!editingPole && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setEditingPole(pole)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setNewTache({ ...newTache, pole_id: pole.id });
                                setIsTacheOpen(true);
                              }}>
                                <Plus className="h-4 w-4 mr-1" /> Tâche
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeletePole(pole.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {/* Barre de progression du pôle */}
                        <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-purple-600 transition-all" style={{width: `${pourcentage}%`}}></div>
                        </div>
                      </div>

                      {/* Tâches du Pôle */}
                      <div className="p-4 space-y-2">
                        {poleTaches.length === 0 ? (
                          <div className="text-center py-4 text-gray-400 text-sm">Aucune tâche dans ce pôle</div>
                        ) : (
                          poleTaches.map(tache => (
                            <div key={tache.id} className={`border rounded-lg p-3 ${getTaskColor(tache.statut)}`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-sm">{tache.titre}</h4>
                                    {getStatutBadge(tache.statut)}
                                  </div>
                                  {tache.description && (
                                    <p className="text-xs text-gray-600 mb-1">{tache.description}</p>
                                  )}
                                  <div className="flex gap-3 text-xs text-gray-500">
                                    {tache.deadline && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(tache.deadline).toLocaleDateString('fr-FR')}
                                      </div>
                                    )}
                                    {tache.assigne_a && (
                                      <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {tache.assigne_a}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Select value={tache.statut} onValueChange={(val) => handleUpdateTacheStatut(tache.id, val)}>
                                    <SelectTrigger className="w-[110px] h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="a_faire">À faire</SelectItem>
                                      <SelectItem value="en_cours">En cours</SelectItem>
                                      <SelectItem value="en_retard">En retard</SelectItem>
                                      <SelectItem value="termine">Terminé</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteTache(tache.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Tâches sans pôle */}
                {taches.filter(t => !t.pole_id).length > 0 && (
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4">
                      <h3 className="text-lg font-bold text-gray-700">📋 Tâches Générales (Sans Pôle)</h3>
                      <p className="text-sm text-gray-500">Tâches non assignées à un pôle spécifique</p>
                    </div>
                    <div className="p-4 space-y-2">
                      {taches.filter(t => !t.pole_id).map(tache => (
                        <div key={tache.id} className={`border rounded-lg p-3 ${getTaskColor(tache.statut)}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">{tache.titre}</h4>
                                {getStatutBadge(tache.statut)}
                              </div>
                              {tache.description && (
                                <p className="text-xs text-gray-600 mb-1">{tache.description}</p>
                              )}
                              <div className="flex gap-3 text-xs text-gray-500">
                                {tache.deadline && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(tache.deadline).toLocaleDateString('fr-FR')}
                                  </div>
                                )}
                                {tache.assigne_a && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {tache.assigne_a}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Select value={tache.statut} onValueChange={(val) => handleUpdateTacheStatut(tache.id, val)}>
                                <SelectTrigger className="w-[110px] h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="a_faire">À faire</SelectItem>
                                  <SelectItem value="en_cours">En cours</SelectItem>
                                  <SelectItem value="en_retard">En retard</SelectItem>
                                  <SelectItem value="termine">Terminé</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteTache(tache.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commentaires */}
        <Card>
          <CardHeader>
            <CardTitle>Commentaires ({commentaires.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {commentaires.map(comment => (
              <div key={comment.id} className="border-l-2 border-blue-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{comment.user}</span>
                  <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString('fr-FR')}</span>
                </div>
                <p className="text-sm text-gray-700">{comment.texte}</p>
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                rows={2}
              />
              <Button onClick={handleAddComment}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dialog Edit */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le projet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nom</Label>
                <Input value={editData.nom || ''} onChange={(e) => setEditData({...editData, nom: e.target.value})} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editData.description || ''} onChange={(e) => setEditData({...editData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Budget prévu (€)</Label>
                  <Input type="number" value={editData.budget_prevu || ''} onChange={(e) => setEditData({...editData, budget_prevu: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <Label>Deadline</Label>
                  <Input type="date" value={editData.deadline || ''} onChange={(e) => setEditData({...editData, deadline: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Statut</Label>
                <Select value={editData.statut} onValueChange={(val) => setEditData({...editData, statut: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planifié">Planifié</SelectItem>
                    <SelectItem value="En cours">En cours</SelectItem>
                    <SelectItem value="En pause">En pause</SelectItem>
                    <SelectItem value="Terminé">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Annuler</Button>
                <Button onClick={handleUpdate}>Enregistrer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Tâche */}
        <Dialog open={isTacheOpen} onOpenChange={setIsTacheOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle tâche</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Pôle</Label>
                <Select value={newTache.pole_id || ''} onValueChange={(val) => setNewTache({...newTache, pole_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un pôle (optionnel)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun pôle (Tâche générale)</SelectItem>
                    {poles.map((pole) => (
                      <SelectItem key={pole.id} value={pole.id}>{pole.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Titre *</Label>
                <Input value={newTache.titre} onChange={(e) => setNewTache({...newTache, titre: e.target.value})} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={newTache.description} onChange={(e) => setNewTache({...newTache, description: e.target.value})} />
              </div>
              <div>
                <Label>Deadline</Label>
                <Input type="date" value={newTache.deadline} onChange={(e) => setNewTache({...newTache, deadline: e.target.value})} />
              </div>
              <div>
                <Label>Assigné à</Label>
                <Select value={newTache.assigne_a || ''} onValueChange={(val) => setNewTache({...newTache, assigne_a: val})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un membre" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Non assigné</SelectItem>

        {/* Dialog Pôle */}
        <Dialog open={isPoleOpen} onOpenChange={setIsPoleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau pôle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nom du pôle *</Label>
                <Input 
                  value={newPole.nom} 
                  onChange={(e) => setNewPole({...newPole, nom: e.target.value})} 
                  placeholder="Ex: Communication, Logistique, Finance..."
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={newPole.description} 
                  onChange={(e) => setNewPole({...newPole, description: e.target.value})} 
                  placeholder="Décrivez les objectifs de ce pôle..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Responsable du pôle</Label>
                <Select value={newPole.responsable || ''} onValueChange={(val) => setNewPole({...newPole, responsable: val})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un responsable (optionnel)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun responsable</SelectItem>
                    {(projet.team_members || []).map((member, idx) => (
                      <SelectItem key={idx} value={member.nom}>{member.nom} - {member.role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                💡 Un pôle permet de regrouper des tâches liées et de suivre leur progression globale.
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsPoleOpen(false);
                  setNewPole({ nom: '', description: '', responsable: '' });
                }}>Annuler</Button>
                <Button onClick={handleAddPole}>Créer le pôle</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

                    {(projet.team_members || []).map((member, idx) => (
                      <SelectItem key={idx} value={member.nom}>{member.nom} - {member.role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsTacheOpen(false);
                  setNewTache({ titre: '', description: '', deadline: '', assigne_a: '', pole_id: '' });
                }}>Annuler</Button>
                <Button onClick={handleAddTache}>Créer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Dépense */}
        <Dialog open={isDepenseOpen} onOpenChange={setIsDepenseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une dépense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Montant (€) *</Label>
                <Input type="number" step="0.01" value={newDepense.montant} onChange={(e) => setNewDepense({...newDepense, montant: e.target.value})} placeholder="Ex: 150.50" />
              </div>
              <div>
                <Label>Raison *</Label>
                <Textarea value={newDepense.raison} onChange={(e) => setNewDepense({...newDepense, raison: e.target.value})} placeholder="Ex: Achat de matériel" rows={3} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={newDepense.date} onChange={(e) => setNewDepense({...newDepense, date: e.target.value})} />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-sm text-blue-800">
                  <div className="font-semibold">Budget actuel</div>
                  <div className="mt-1">{budgetStatus.reel}€ / {budgetStatus.prevu}€</div>
                  <div className="mt-1 text-xs">Après cette dépense : {budgetStatus.reel + (parseFloat(newDepense.montant) || 0)}€</div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDepenseOpen(false)}>Annuler</Button>
                <Button onClick={handleAddDepense}>Ajouter</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Équipe */}
        <Dialog open={isTeamOpen} onOpenChange={setIsTeamOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gérer l'équipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-3">Ajouter un membre</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="Nom *" value={newMember.nom} onChange={(e) => setNewMember({...newMember, nom: e.target.value})} />
                    <Input placeholder="Téléphone (optionnel)" value={newMember.telephone} onChange={(e) => setNewMember({...newMember, telephone: e.target.value})} />
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Rôle *" value={newMember.role} onChange={(e) => setNewMember({...newMember, role: e.target.value})} />
                    <Button onClick={handleAddMember}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Membres actuels</h3>
                {(editData.team_members || []).length === 0 ? (
                  <div className="text-center py-4 text-gray-500">Aucun membre</div>
                ) : (
                  <div className="space-y-2">
                    {(editData.team_members || []).map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between border rounded p-3">
                        <div>
                          <div className="font-medium">{member.nom}</div>
                          <div className="text-sm text-gray-500">{member.role}</div>
                          {member.telephone && <div className="text-xs text-gray-400">📱 {member.telephone}</div>}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveMember(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setIsTeamOpen(false)}>Fermer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </EventsLayout>
  );
};

export default ProjetDetailPage;