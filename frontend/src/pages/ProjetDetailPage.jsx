import React, { useState, useEffect } from 'react';
import EventsLayout from '../components/EventsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, X, Calendar, DollarSign, Edit, Trash2, Users, Target, AlertCircle, Filter, BarChart } from 'lucide-react';
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
  const [editingTache, setEditingTache] = useState(null);
  const [newPole, setNewPole] = useState({ nom: '', description: '', responsable: '' });
  const [editingPole, setEditingPole] = useState(null);
  const [newMember, setNewMember] = useState({ nom: '', telephone: '', role: '' });
  const [jalons, setJalons] = useState([]);
  const [isJalonOpen, setIsJalonOpen] = useState(false);
  const [isGanttOpen, setIsGanttOpen] = useState(false);
  const [newJalon, setNewJalon] = useState({ titre: '', description: '', acteur: '', date_debut: '', date_fin: '' });
  const [editingJalon, setEditingJalon] = useState(null);
  const [newDepense, setNewDepense] = useState({ montant: '', raison: '', date: new Date().toISOString().split('T')[0] });
  const [editData, setEditData] = useState({});
  const [filtreStatut, setFiltreStatut] = useState('tous');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [projetRes, tachesRes, polesRes, jalonsRes, commentsRes, depensesRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/projets/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/taches?projet_id=${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/poles?projet_id=${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/jalons?projet_id=${id}`, {
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
      const jalonsData = await jalonsRes.json();
      const commentsData = await commentsRes.json();
      const depensesData = await depensesRes.json();
      
      setProjet(projetData);
      setTaches(tachesData);
      setPoles(polesData);
      setJalons(jalonsData);
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

  const handleUpdateTache = async () => {
    if (!editingTache || !editingTache.titre) {
      toast.error('Titre requis');
      return;
    }

    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/taches/${editingTache.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titre: editingTache.titre,
          description: editingTache.description,
          deadline: editingTache.deadline,
          assigne_a: editingTache.assigne_a,
          pole_id: editingTache.pole_id
        })
      });
      toast.success('Tâche mise à jour');
      setEditingTache(null);
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

  const handleAddJalon = async () => {
    if (!newJalon.titre) {
      toast.error('Titre requis');
      return;
    }

    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/jalons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...newJalon, projet_id: id })
      });
      toast.success('Jalon créé');
      setNewJalon({ titre: '', description: '', acteur: '', deadline: '' });
      setIsJalonOpen(false);
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleUpdateJalon = async () => {
    if (!editingJalon || !editingJalon.titre) {
      toast.error('Titre requis');
      return;
    }

    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/jalons/${editingJalon.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titre: editingJalon.titre,
          description: editingJalon.description,
          acteur: editingJalon.acteur,
          date_debut: editingJalon.date_debut,
          date_fin: editingJalon.date_fin,
          statut: editingJalon.statut
        })
      });
      toast.success('Jalon mis à jour');
      setEditingJalon(null);
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDeleteJalon = async (jalonId) => {
    if (!window.confirm('Supprimer ce jalon ?')) return;

    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/jalons/${jalonId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Jalon supprimé');
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

          {/* Jalons */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsJalonOpen(true)}>
            <CardContent className="pt-4">
              <div className="text-center mb-3">
                <Target className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                <div className="text-sm font-semibold">Jalons ({jalons.length})</div>
              </div>
              {jalons.length === 0 ? (
                <div className="text-xs text-gray-400 text-center">Aucun jalon</div>
              ) : (
                <div className="space-y-1">
                  {jalons.slice(0, 3).map((jalon, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="truncate flex-1 mr-2">{jalon.titre}</div>
                      <span className={`px-1.5 py-0.5 rounded text-xs whitespace-nowrap ${
                        jalon.statut === 'termine' ? 'bg-green-100 text-green-800' :
                        jalon.statut === 'en_retard' ? 'bg-red-100 text-red-800' :
                        jalon.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                        jalon.statut === 'annule' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {jalon.statut === 'termine' ? '✓' :
                         jalon.statut === 'en_retard' ? '!' :
                         jalon.statut === 'en_cours' ? '...' :
                         jalon.statut === 'annule' ? 'X' : '○'}
                      </span>
                    </div>
                  ))}
                  {jalons.length > 3 && (
                    <div className="text-xs text-gray-400 text-center mt-1">+{jalons.length - 3} autres</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Performance */}
        {teamStats.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">👥 Performance Équipe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {teamStats.map((member, idx) => (
                  <div key={idx} className="border rounded p-2 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <div className="truncate">
                        <div className="font-medium text-sm truncate">{member.nom}</div>
                        <div className="text-xs text-gray-500">{member.role}</div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-lg font-bold text-blue-600">{member.progress}%</div>
                        <div className="text-xs text-gray-500">{member.termine}/{member.total}</div>
                      </div>
                    </div>
                    <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all" style={{width: `${member.progress}%`}}></div>
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
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">📊 Pôles ({poles.length})</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => {
                  setNewTache({ titre: '', description: '', deadline: '', assigne_a: '', pole_id: '' });
                  setIsTacheOpen(true);
                }}>
                  <Plus className="h-3 w-3 mr-1" /> Tâche Générale
                </Button>
                <Button size="sm" onClick={() => setIsPoleOpen(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Pôle
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {poles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">Aucun pôle créé</p>
                <p className="text-sm">Créez des pôles pour mieux organiser vos tâches par thématique</p>
              </div>
            ) : (
              <div className="space-y-3">
                {poles.map(pole => {
                  const poleTaches = taches.filter(t => t.pole_id === pole.id);
                  const tachesTerminees = poleTaches.filter(t => t.statut === 'termine').length;
                  const pourcentage = poleTaches.length > 0 ? Math.round((tachesTerminees / poleTaches.length) * 100) : 0;
                  
                  return (
                    <div key={pole.id} className="border border-purple-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {/* En-tête du Pôle */}
                      <div className="bg-purple-50 p-3">
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
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-bold text-purple-900">{pole.nom}</h3>
                                  <div className="flex items-center gap-2">
                                    <div className="text-xl font-bold text-purple-600">{pourcentage}%</div>
                                    <span className="text-sm text-gray-600">({tachesTerminees}/{poleTaches.length})</span>
                                  </div>
                                </div>
                                {pole.description && (
                                  <p className="text-xs text-gray-600 mb-2">{pole.description}</p>
                                )}
                                {pole.responsable && (
                                  <div className="flex items-center gap-1 text-xs text-purple-700 bg-purple-100 rounded-full px-2 py-1 w-fit">
                                    <Users className="h-3 w-3" />
                                    <span>{pole.responsable}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          {!editingPole && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => setEditingPole(pole)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => {
                                  setNewTache({ titre: '', description: '', deadline: '', assigne_a: '', pole_id: pole.id });
                                  setIsTacheOpen(true);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Tâche
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeletePole(pole.id)}>
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {/* Barre de progression du pôle */}
                        <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-purple-600 transition-all" style={{width: `${pourcentage}%`}}></div>
                        </div>
                      </div>

                      {/* Tâches du Pôle */}
                      <div className="p-3 bg-gray-50 space-y-2">
                        {poleTaches.length === 0 ? (
                          <div className="text-center py-4 text-gray-400 text-xs">
                            Aucune tâche - Cliquez sur &quot;Tâche&quot; pour ajouter
                          </div>
                        ) : (
                          poleTaches.map(tache => (
                            <div key={tache.id} className={`border rounded p-2 ${getTaskColor(tache.statut)}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 mb-1">
                                    <h4 className="font-medium text-sm truncate">{tache.titre}</h4>
                                    {getStatutBadge(tache.statut)}
                                  </div>
                                  {tache.description && (
                                    <p className="text-xs text-gray-600 mb-1 line-clamp-1">{tache.description}</p>
                                  )}
                                  <div className="flex gap-2 text-xs text-gray-500">
                                    {tache.deadline && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(tache.deadline).toLocaleDateString('fr-FR')}
                                      </div>
                                    )}
                                    {tache.assigne_a && (
                                      <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        <span className="truncate">{tache.assigne_a}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-7 w-7 p-0" 
                                    onClick={() => setEditingTache(tache)}
                                    title="Modifier la tâche"
                                  >
                                    <Edit className="h-3 w-3 text-blue-600" />
                                  </Button>
                                  <Select value={tache.statut} onValueChange={(val) => handleUpdateTacheStatut(tache.id, val)}>
                                    <SelectTrigger className="w-[90px] h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="a_faire">À faire</SelectItem>
                                      <SelectItem value="en_cours">En cours</SelectItem>
                                      <SelectItem value="en_retard">En retard</SelectItem>
                                      <SelectItem value="termine">Terminé</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDeleteTache(tache.id)}>
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
                  <div className="border border-gray-300 rounded-lg overflow-hidden mt-4">
                    <div className="bg-gray-100 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-gray-800">📋 Tâches Générales ({taches.filter(t => !t.pole_id).length})</h3>
                        </div>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setNewTache({ titre: '', description: '', deadline: '', assigne_a: '', pole_id: '' });
                            setIsTacheOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Tâche
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 bg-white space-y-2">
                      {taches.filter(t => !t.pole_id).map(tache => (
                        <div key={tache.id} className={`border rounded p-2 ${getTaskColor(tache.statut)}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-1">
                                <h4 className="font-medium text-sm truncate">{tache.titre}</h4>
                                {getStatutBadge(tache.statut)}
                              </div>
                              {tache.description && (
                                <p className="text-xs text-gray-600 mb-1 line-clamp-1">{tache.description}</p>
                              )}
                              <div className="flex gap-2 text-xs text-gray-500">
                                {tache.deadline && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(tache.deadline).toLocaleDateString('fr-FR')}
                                  </div>
                                )}
                                {tache.assigne_a && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span className="truncate">{tache.assigne_a}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 w-7 p-0" 
                                onClick={() => setEditingTache(tache)}
                                title="Modifier la tâche"
                              >
                                <Edit className="h-3 w-3 text-blue-600" />
                              </Button>
                              <Select value={tache.statut} onValueChange={(val) => handleUpdateTacheStatut(tache.id, val)}>
                                <SelectTrigger className="w-[90px] h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="a_faire">À faire</SelectItem>
                                  <SelectItem value="en_cours">En cours</SelectItem>
                                  <SelectItem value="en_retard">En retard</SelectItem>
                                  <SelectItem value="termine">Terminé</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDeleteTache(tache.id)}>
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
        <Dialog open={isTacheOpen || !!editingTache} onOpenChange={(open) => {
          if (!open) {
            setIsTacheOpen(false);
            setEditingTache(null);
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {editingTache ? 
                  'Modifier la tâche' :
                  (newTache.pole_id ? 
                    `Nouvelle tâche - ${poles.find(p => p.id === newTache.pole_id)?.nom || 'Pôle'}` : 
                    'Nouvelle tâche générale'
                  )
                }
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {poles.length > 0 && !editingTache && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <Label className="text-sm mb-1 block">📂 Pôle</Label>
                  <Select value={newTache.pole_id || 'none'} onValueChange={(val) => setNewTache({...newTache, pole_id: val === 'none' ? '' : val})}>
                    <SelectTrigger className="bg-white h-8 text-sm">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tâche générale</SelectItem>
                      {poles.map((pole) => (
                        <SelectItem key={pole.id} value={pole.id}>{pole.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {editingTache && poles.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <Label className="text-sm mb-1 block">📂 Pôle</Label>
                  <Select value={editingTache.pole_id || 'none'} onValueChange={(val) => setEditingTache({...editingTache, pole_id: val === 'none' ? '' : val})}>
                    <SelectTrigger className="bg-white h-8 text-sm">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tâche générale</SelectItem>
                      {poles.map((pole) => (
                        <SelectItem key={pole.id} value={pole.id}>{pole.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-sm">Titre *</Label>
                <Input 
                  value={editingTache ? editingTache.titre : newTache.titre} 
                  onChange={(e) => editingTache ? 
                    setEditingTache({...editingTache, titre: e.target.value}) : 
                    setNewTache({...newTache, titre: e.target.value})
                  } 
                  placeholder="Ex: Préparer présentation"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Description</Label>
                <Textarea 
                  value={editingTache ? editingTache.description : newTache.description} 
                  onChange={(e) => editingTache ? 
                    setEditingTache({...editingTache, description: e.target.value}) : 
                    setNewTache({...newTache, description: e.target.value})
                  } 
                  placeholder="Détails..."
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">📅 Date limite</Label>
                <Input 
                  type="date" 
                  value={editingTache ? editingTache.deadline : newTache.deadline} 
                  onChange={(e) => editingTache ? 
                    setEditingTache({...editingTache, deadline: e.target.value}) : 
                    setNewTache({...newTache, deadline: e.target.value})
                  } 
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">👥 Assigné à (plusieurs personnes, séparées par virgule)</Label>
                <Input 
                  value={editingTache ? (editingTache.assigne_a || '') : (newTache.assigne_a || '')} 
                  onChange={(e) => editingTache ? 
                    setEditingTache({...editingTache, assigne_a: e.target.value}) : 
                    setNewTache({...newTache, assigne_a: e.target.value})
                  }
                  placeholder="Ex: Jean Dupont, Marie Martin"
                  className="mt-1"
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {(projet.team_members || []).map((member, idx) => {
                    const currentAssignees = editingTache ? (editingTache.assigne_a || '') : (newTache.assigne_a || '');
                    const names = currentAssignees.split(',').map(n => n.trim()).filter(Boolean);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const newAssignees = names.includes(member.nom) 
                            ? names.filter(n => n !== member.nom).join(', ')
                            : [...names, member.nom].join(', ');
                          
                          if (editingTache) {
                            setEditingTache({...editingTache, assigne_a: newAssignees});
                          } else {
                            setNewTache({...newTache, assigne_a: newAssignees});
                          }
                        }}
                        className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                          names.includes(member.nom)
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                        }`}
                      >
                        {member.nom}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" onClick={() => {
                  setIsTacheOpen(false);
                  setEditingTache(null);
                  setNewTache({ titre: '', description: '', deadline: '', assigne_a: '', pole_id: '' });
                }}>Annuler</Button>
                <Button 
                  size="sm" 
                  onClick={editingTache ? handleUpdateTache : handleAddTache} 
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Check className="h-4 w-4 mr-1" /> {editingTache ? 'Enregistrer' : 'Créer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Pôle */}
        <Dialog open={isPoleOpen} onOpenChange={setIsPoleOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">Créer un pôle</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Nom du pôle *</Label>
                <Input 
                  value={newPole.nom} 
                  onChange={(e) => setNewPole({...newPole, nom: e.target.value})} 
                  placeholder="Ex: Communication, Logistique..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Description</Label>
                <Textarea 
                  value={newPole.description} 
                  onChange={(e) => setNewPole({...newPole, description: e.target.value})} 
                  placeholder="Objectifs..."
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Responsable</Label>
                <Select value={newPole.responsable || 'none'} onValueChange={(val) => setNewPole({...newPole, responsable: val === 'none' ? '' : val})}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Optionnel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {(projet.team_members || []).map((member, idx) => (
                      <SelectItem key={idx} value={member.nom}>{member.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => {
                  setIsPoleOpen(false);
                  setNewPole({ nom: '', description: '', responsable: '' });
                }}>Annuler</Button>
                <Button size="sm" onClick={handleAddPole}>Créer</Button>
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


        {/* Dialog Jalons */}
        <Dialog open={isJalonOpen} onOpenChange={setIsJalonOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl">🎯 Jalons du Projet</DialogTitle>
                {jalons.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsJalonOpen(false);
                      setIsGanttOpen(true);
                    }}
                    className="ml-4"
                  >
                    <BarChart className="h-4 w-4 mr-1" />
                    Gantt
                  </Button>
                )}
              </div>
            </DialogHeader>
            <div className="space-y-4">
              {/* Liste des jalons */}
              <div>
                <h3 className="font-semibold mb-3">Jalons ({jalons.length})</h3>
                {jalons.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Aucun jalon défini</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {jalons.map((jalon) => (
                      <div key={jalon.id} className="border rounded p-3 hover:bg-gray-50">
                        {editingJalon?.id === jalon.id ? (
                          <div className="space-y-3">
                            <Input
                              value={editingJalon.titre}
                              onChange={(e) => setEditingJalon({...editingJalon, titre: e.target.value})}
                              placeholder="Titre"
                              className="font-medium"
                            />
                            <Textarea
                              value={editingJalon.description || ''}
                              onChange={(e) => setEditingJalon({...editingJalon, description: e.target.value})}
                              placeholder="Description"
                              rows={2}
                            />
                            <div>
                              <Label className="text-xs">Acteur</Label>
                              <Input
                                value={editingJalon.acteur || ''}
                                onChange={(e) => setEditingJalon({...editingJalon, acteur: e.target.value})}
                                placeholder="Nom"
                                className="mt-1"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Date début</Label>
                                <Input
                                  type="datetime-local"
                                  value={editingJalon.date_debut || ''}
                                  onChange={(e) => setEditingJalon({...editingJalon, date_debut: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Date fin</Label>
                                <Input
                                  type="datetime-local"
                                  value={editingJalon.date_fin || ''}
                                  onChange={(e) => setEditingJalon({...editingJalon, date_fin: e.target.value})}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Statut</Label>
                              <Select value={editingJalon.statut} onValueChange={(val) => setEditingJalon({...editingJalon, statut: val})}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="a_faire">À faire</SelectItem>
                                  <SelectItem value="en_cours">En cours</SelectItem>
                                  <SelectItem value="termine">Terminé</SelectItem>
                                  <SelectItem value="en_retard">En retard</SelectItem>
                                  <SelectItem value="annule">Annulé</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setEditingJalon(null)}>
                                <X className="h-3 w-3 mr-1" /> Annuler
                              </Button>
                              <Button size="sm" onClick={handleUpdateJalon}>
                                <Check className="h-3 w-3 mr-1" /> Enregistrer
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{jalon.titre}</h4>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  jalon.statut === 'termine' ? 'bg-green-100 text-green-800' :
                                  jalon.statut === 'en_retard' ? 'bg-red-100 text-red-800' :
                                  jalon.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                                  jalon.statut === 'annule' ? 'bg-gray-100 text-gray-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {jalon.statut === 'a_faire' ? 'À faire' :
                                   jalon.statut === 'en_cours' ? 'En cours' :
                                   jalon.statut === 'termine' ? 'Terminé' :
                                   jalon.statut === 'en_retard' ? 'En retard' : 'Annulé'}
                                </span>
                              </div>
                              {jalon.description && <p className="text-sm text-gray-600 mb-2">{jalon.description}</p>}
                              <div className="flex gap-3 text-xs text-gray-500">
                                {jalon.acteur && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {jalon.acteur}
                                  </div>
                                )}
                                {jalon.date_debut && jalon.date_fin && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(jalon.date_debut).toLocaleDateString('fr-FR')} → {new Date(jalon.date_fin).toLocaleDateString('fr-FR')}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setEditingJalon(jalon)}>
                                <Edit className="h-3 w-3 text-blue-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteJalon(jalon.id)}>
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Formulaire nouveau jalon */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Ajouter un jalon</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Titre *</Label>
                    <Input
                      value={newJalon.titre}
                      onChange={(e) => setNewJalon({...newJalon, titre: e.target.value})}
                      placeholder="Ex: Lancement de la phase 1"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newJalon.description || ''}
                      onChange={(e) => setNewJalon({...newJalon, description: e.target.value})}
                      placeholder="Détails du jalon..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Acteur / Responsable</Label>
                    <Input
                      value={newJalon.acteur || ''}
                      onChange={(e) => setNewJalon({...newJalon, acteur: e.target.value})}
                      placeholder="Personne responsable"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Date de début</Label>
                      <Input
                        type="datetime-local"
                        value={newJalon.date_debut || ''}
                        onChange={(e) => setNewJalon({...newJalon, date_debut: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Date de fin</Label>
                      <Input
                        type="datetime-local"
                        value={newJalon.date_fin || ''}
                        onChange={(e) => setNewJalon({...newJalon, date_fin: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsJalonOpen(false)}>Fermer</Button>
                    <Button onClick={handleAddJalon}>
                      <Plus className="h-4 w-4 mr-1" /> Ajouter le jalon
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>


        {/* Dialog Gantt */}
        <Dialog open={isGanttOpen} onOpenChange={setIsGanttOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl">📊 Diagramme de Gantt - Jalons du Projet</DialogTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsGanttOpen(false);
                    setIsJalonOpen(true);
                  }}
                >
                  Retour aux jalons
                </Button>
              </div>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto max-h-[70vh]">
              {jalons.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Aucun jalon défini</p>
                </div>
              ) : (() => {
                // Calculer la plage de dates
                const jalonsWithDates = jalons.filter(j => j.date_debut && j.date_fin);
                if (jalonsWithDates.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-400">
                      <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Aucun jalon avec dates de début et fin définies</p>
                    </div>
                  );
                }

                const allDates = jalonsWithDates.flatMap(j => [new Date(j.date_debut), new Date(j.date_fin)]);
                const minDate = new Date(Math.min(...allDates));
                const maxDate = new Date(Math.max(...allDates));
                const today = new Date();
                
                // Ajouter une marge de 7 jours avant et après
                const startDate = new Date(Math.min(minDate, today));
                startDate.setDate(startDate.getDate() - 7);
                const endDate = new Date(Math.max(maxDate, today));
                endDate.setDate(endDate.getDate() + 7);
                
                const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                
                const getPosition = (date) => {
                  const daysDiff = Math.ceil((new Date(date) - startDate) / (1000 * 60 * 60 * 24));
                  return (daysDiff / totalDays) * 100;
                };
                
                const todayPosition = getPosition(today);

                return (
                  <div className="space-y-4">
                    {/* Légende des dates */}
                    <div className="flex justify-between text-xs text-gray-600 px-48">
                      <span>{startDate.toLocaleDateString('fr-FR')}</span>
                      <span className="font-medium text-blue-600">Aujourd'hui</span>
                      <span>{endDate.toLocaleDateString('fr-FR')}</span>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3">
                      {jalonsWithDates.sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut)).map((jalon, idx) => {
                        const startPos = getPosition(jalon.date_debut);
                        const endPos = getPosition(jalon.date_fin);
                        const barWidth = endPos - startPos;
                        
                        const statusColor = 
                          jalon.statut === 'termine' ? 'bg-green-500' :
                          jalon.statut === 'en_retard' ? 'bg-red-500' :
                          jalon.statut === 'en_cours' ? 'bg-blue-500' :
                          jalon.statut === 'annule' ? 'bg-gray-400' :
                          'bg-yellow-500';

                        return (
                          <div key={idx} className="relative">
                            {/* Nom du jalon */}
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-48 text-sm font-medium truncate">{jalon.titre}</div>
                              <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${
                                jalon.statut === 'termine' ? 'bg-green-100 text-green-800' :
                                jalon.statut === 'en_retard' ? 'bg-red-100 text-red-800' :
                                jalon.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                                jalon.statut === 'annule' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {jalon.statut === 'termine' ? 'Terminé' :
                                 jalon.statut === 'en_retard' ? 'En retard' :
                                 jalon.statut === 'en_cours' ? 'En cours' :
                                 jalon.statut === 'annule' ? 'Annulé' : 'À faire'}
                              </span>
                              {jalon.acteur && (
                                <span className="text-xs text-gray-500">👤 {jalon.acteur}</span>
                              )}
                            </div>

                            {/* Barre de timeline */}
                            <div className="relative h-16 bg-gray-100 rounded-lg overflow-visible">
                              {/* Ligne aujourd'hui (une seule fois) */}
                              {idx === 0 && (
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-blue-600 z-20"
                                  style={{ left: `${todayPosition}%` }}
                                >
                                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-600 rounded-full"></div>
                                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-600 rounded-full"></div>
                                </div>
                              )}

                              {/* BARRE DE DURÉE du jalon */}
                              <div
                                className={`absolute top-1/2 -translate-y-1/2 h-8 ${statusColor} rounded-lg shadow-md z-10 flex items-center justify-center`}
                                style={{
                                  left: `${startPos}%`,
                                  width: `${Math.max(barWidth, 2)}%`
                                }}
                              >
                                <span className="text-white text-xs font-bold px-2 truncate">
                                  {jalon.titre}
                                </span>
                              </div>

                              {/* Dates début et fin */}
                              <div className="absolute -top-5 left-0 right-0 flex justify-between text-xs text-gray-600">
                                <div style={{position: 'absolute', left: `${startPos}%`, transform: 'translateX(-50%)'}}>
                                  {new Date(jalon.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                </div>
                                <div style={{position: 'absolute', left: `${endPos}%`, transform: 'translateX(-50%)'}}>
                                  {new Date(jalon.date_fin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Légende */}
                    <div className="border-t pt-4 mt-6">
                      <div className="flex flex-wrap gap-4 justify-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          <span>Terminé</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span>En cours</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                          <span>À faire</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-500 rounded"></div>
                          <span>En retard</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-400 rounded"></div>
                          <span>Annulé</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-0.5 h-4 bg-blue-600"></div>
                          <span className="font-medium text-blue-600">Aujourd'hui</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
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
                <h3 className="font-semibold mb-2">Membres actuels ({(editData.team_members || []).length})</h3>
                {(editData.team_members || []).length === 0 ? (
                  <div className="text-center py-4 text-gray-500">Aucun membre</div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                    {(editData.team_members || []).map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between border rounded p-3 bg-white hover:bg-gray-50">
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