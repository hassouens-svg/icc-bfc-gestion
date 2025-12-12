import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LayoutMinistereStars from '../components/LayoutMinistereStars';
import { getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft, Users, CheckCircle, XCircle, Plus, Trash2, Calendar, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useSelectedCity } from '../contexts/SelectedCityContext';

const MinistereStarsDepartementPage = () => {
  const navigate = useNavigate();
  const { departement } = useParams();
  const user = getUser();
  const { selectedCity } = useSelectedCity();
  const [stars, setStars] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);
  const [showWeekPlanningDialog, setShowWeekPlanningDialog] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [cities, setCities] = useState([]);
  const [plannings, setPlannings] = useState([]);
  const [currentPlanning, setCurrentPlanning] = useState({ entries: [] });
  const [newStar, setNewStar] = useState({
    prenom: '',
    nom: '',
    jour_naissance: '',
    mois_naissance: '',
    ville: ''
  });
  const [loading, setLoading] = useState(true);

  const mois = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  const typesCulte = ['Culte 1', 'Culte 2', 'EJP', 'Tous les cultes'];

  // Vérifier les permissions
  const canEdit = user?.role && ['super_admin', 'pasteur', 'responsable_eglise', 'respo_departement'].includes(user.role);
  const canView = user?.role && ['super_admin', 'pasteur', 'responsable_eglise', 'respo_departement', 'star', 'ministere_stars'].includes(user.role);

  useEffect(() => {
    if (!user || !canView) {
      navigate('/');
      return;
    }
    loadStars();
    loadCities();
    loadPlannings();
  }, [departement, selectedCity]);

  const loadCities = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cities`);
      const data = await response.json();
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadPlannings = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/planning/${encodeURIComponent(departement)}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await response.json();
      setPlannings(data || []);
    } catch (error) {
      console.error('Error loading plannings:', error);
    }
  };

  const loadStars = async () => {
    try {
      // Filtrer par ville si sélectionnée
      let url = `${process.env.REACT_APP_BACKEND_URL}/api/stars/departement/${encodeURIComponent(departement)}`;
      if (selectedCity && selectedCity !== 'all') {
        url += `?ville=${encodeURIComponent(selectedCity)}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setStars(data);
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleStatutChange = async (starId, newStatut) => {
    if (!canEdit) {
      toast.error('Vous n\'avez pas les droits pour modifier');
      return;
    }
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/${starId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ statut: newStatut })
        }
      );
      if (!response.ok) throw new Error('Erreur');
      toast.success('Statut mis à jour');
      loadStars();
    } catch (error) {
      toast.error('Erreur de mise à jour');
    }
  };

  const handleAddStar = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error('Vous n\'avez pas les droits pour ajouter');
      return;
    }
    if (!newStar.prenom || !newStar.nom || !newStar.jour_naissance || !newStar.mois_naissance || !newStar.ville) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    const jour = parseInt(newStar.jour_naissance);
    const moisVal = parseInt(newStar.mois_naissance);
    if (jour < 1 || jour > 31) {
      toast.error('Jour invalide (1-31)');
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prenom: newStar.prenom,
          nom: newStar.nom,
          jour_naissance: jour,
          mois_naissance: moisVal,
          departements: [decodeURIComponent(departement)],
          ville: newStar.ville
        })
      });
      if (!response.ok) throw new Error('Erreur');
      toast.success('⭐ Star ajoutée avec succès !');
      setShowAddDialog(false);
      setNewStar({ prenom: '', nom: '', jour_naissance: '', mois_naissance: '', ville: '' });
      loadStars();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleDeleteStar = async (starId, starName) => {
    if (!canEdit) {
      toast.error('Vous n\'avez pas les droits pour supprimer');
      return;
    }
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${starName} ?`)) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stars/${starId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erreur');
      toast.success('Star supprimée');
      loadStars();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Planning functions
  const openWeekPlanning = async (week) => {
    setSelectedWeek(week);
    const currentYear = new Date().getFullYear();
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/planning/${encodeURIComponent(departement)}/${week}/${currentYear}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await response.json();
      setCurrentPlanning(data || { entries: [] });
    } catch (error) {
      setCurrentPlanning({ entries: [] });
    }
    setShowWeekPlanningDialog(true);
  };

  const addPlanningEntry = () => {
    if (!canEdit) return;
    setCurrentPlanning(prev => ({
      ...prev,
      entries: [...(prev.entries || []), { 
        type_culte: '', 
        role: '', 
        membre_ids: [], 
        membres_noms: [],
        commentaire: '' 
      }]
    }));
  };

  const updatePlanningEntry = (index, field, value) => {
    if (!canEdit) return;
    setCurrentPlanning(prev => {
      const newEntries = [...prev.entries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return { ...prev, entries: newEntries };
    });
  };

  // Fonction pour gérer la sélection multiple de membres
  const toggleMemberSelection = (index, starId, starName) => {
    if (!canEdit) return;
    setCurrentPlanning(prev => {
      const newEntries = [...prev.entries];
      const entry = newEntries[index];
      const memberIds = entry.membre_ids || [];
      const memberNames = entry.membres_noms || [];
      
      const existingIndex = memberIds.indexOf(starId);
      if (existingIndex > -1) {
        // Remove member
        memberIds.splice(existingIndex, 1);
        memberNames.splice(existingIndex, 1);
      } else {
        // Add member
        memberIds.push(starId);
        memberNames.push(starName);
      }
      
      newEntries[index] = { 
        ...entry, 
        membre_ids: memberIds,
        membres_noms: memberNames
      };
      return { ...prev, entries: newEntries };
    });
  };

  const removePlanningEntry = (index) => {
    if (!canEdit) return;
    setCurrentPlanning(prev => ({
      ...prev,
      entries: prev.entries.filter((_, i) => i !== index)
    }));
  };

  const savePlanning = async () => {
    if (!canEdit) {
      toast.error('Vous n\'avez pas les droits pour modifier le planning');
      return;
    }
    const currentYear = new Date().getFullYear();
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stars/planning`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          departement: decodeURIComponent(departement),
          semaine: selectedWeek,
          annee: currentYear,
          entries: currentPlanning.entries
        })
      });
      if (!response.ok) throw new Error('Erreur');
      toast.success('Planning enregistré !');
      loadPlannings();
      setShowWeekPlanningDialog(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const deletePlanning = async (week) => {
    if (!canEdit) {
      toast.error('Vous n\'avez pas les droits pour supprimer');
      return;
    }
    if (!window.confirm(`Supprimer le planning de la semaine ${week} ?`)) return;
    const currentYear = new Date().getFullYear();
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/planning/${encodeURIComponent(departement)}/${week}/${currentYear}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (!response.ok) throw new Error('Erreur');
      toast.success('Planning supprimé');
      loadPlannings();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const hasPlanning = (week) => {
    const currentYear = new Date().getFullYear();
    return plannings.some(p => p.semaine === week && p.annee === currentYear);
  };

  const actifs = stars.filter(s => s.statut === 'actif').length;
  const nonActifs = stars.filter(s => s.statut === 'non_actif').length;

  // Liste des rôles possibles dans le planning
  const rolesPlanning = [
    'Équipe de Prière', 
    'Équipe Technique (Son)', 
    'Équipe Technique (Vidéo)', 
    'Équipe Technique (Lumière)',
    'Accueil',
    'Service d\'ordre',
    'Louange',
    'Choristes',
    'Musiciens',
    'Animation',
    'Protocole',
    'Intercession',
    'Communion',
    'Quête',
    'École du Dimanche',
    'Nursery',
    'Média/Communication',
    'Autre'
  ];

  if (loading) {
    return (
      <LayoutMinistereStars>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </LayoutMinistereStars>
    );
  }

  return (
    <LayoutMinistereStars>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">⭐ {decodeURIComponent(departement)}</h1>
            <p className="text-gray-500 mt-1">
              Liste des stars du département
              {selectedCity && selectedCity !== 'all' && (
                <span className="ml-2 text-indigo-600 font-medium">({selectedCity})</span>
              )}
            </p>
            {!canEdit && (
              <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
                <Eye className="h-4 w-4" /> Mode lecture seule
              </p>
            )}
          </div>
          <Button variant="outline" onClick={() => navigate('/ministere-stars/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* Bouton Voir Planning */}
        <Button 
          onClick={() => setShowPlanningDialog(true)} 
          className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto"
        >
          <Calendar className="h-4 w-4 mr-2" />
          📅 {canEdit ? 'Gérer le Planning' : 'Voir le Planning'}
        </Button>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total</p>
                  <h3 className="text-3xl font-bold mt-2">{stars.length}</h3>
                </div>
                <Users className="h-12 w-12 text-blue-200 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Actifs</p>
                  <h3 className="text-3xl font-bold mt-2">{actifs}</h3>
                </div>
                <CheckCircle className="h-12 w-12 text-green-200 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Non Actifs</p>
                  <h3 className="text-3xl font-bold mt-2">{nonActifs}</h3>
                </div>
                <XCircle className="h-12 w-12 text-red-200 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des stars */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Liste des Stars</CardTitle>
            {canEdit && (
              <Button onClick={() => setShowAddDialog(true)} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {canEdit && <th className="text-center py-3 px-4 bg-gray-50">🗑️</th>}
                    <th className="text-left py-3 px-4">Prénom</th>
                    <th className="text-left py-3 px-4">Nom</th>
                    <th className="text-center py-3 px-4">Date de Naissance</th>
                    <th className="text-left py-3 px-4">Ville</th>
                    <th className="text-left py-3 px-4">Autres Départements</th>
                    <th className="text-center py-3 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {stars.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 7 : 6} className="text-center py-8 text-gray-500">
                        Aucune star dans ce département
                      </td>
                    </tr>
                  ) : (
                    stars.map((star, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        {canEdit && (
                          <td className="text-center py-3 px-4">
                            <Button
                              onClick={() => handleDeleteStar(star.id, `${star.prenom} ${star.nom}`)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-100 p-2"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </td>
                        )}
                        <td className="py-3 px-4 font-medium">{star.prenom}</td>
                        <td className="py-3 px-4">{star.nom}</td>
                        <td className="text-center py-3 px-4">
                          {String(star.jour_naissance).padStart(2, '0')}/{String(star.mois_naissance).padStart(2, '0')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                            {star.ville || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {star.departements.filter(d => d !== decodeURIComponent(departement)).map((dept, i) => (
                              <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {dept}
                              </span>
                            ))}
                            {star.departements.filter(d => d !== decodeURIComponent(departement)).length === 0 && (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          {canEdit ? (
                            <Select value={star.statut} onValueChange={(value) => handleStatutChange(star.id, value)}>
                              <SelectTrigger className={`w-32 ${star.statut === 'actif' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="actif">✅ Actif</SelectItem>
                                <SelectItem value="non_actif">❌ Non Actif</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs ${star.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {star.statut === 'actif' ? '✅ Actif' : '❌ Non Actif'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog pour ajouter une star */}
      {canEdit && (
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>⭐ Ajouter une Star à {decodeURIComponent(departement)}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStar} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom *</Label>
                  <Input value={newStar.prenom} onChange={(e) => setNewStar({...newStar, prenom: e.target.value})} placeholder="Prénom" />
                </div>
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input value={newStar.nom} onChange={(e) => setNewStar({...newStar, nom: e.target.value})} placeholder="Nom" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jour de naissance *</Label>
                  <Input type="number" min="1" max="31" value={newStar.jour_naissance} onChange={(e) => setNewStar({...newStar, jour_naissance: e.target.value})} placeholder="1-31" />
                </div>
                <div className="space-y-2">
                  <Label>Mois de naissance *</Label>
                  <select value={newStar.mois_naissance} onChange={(e) => setNewStar({...newStar, mois_naissance: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                    <option value="">Sélectionner...</option>
                    {mois.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ville *</Label>
                <select value={newStar.ville} onChange={(e) => setNewStar({...newStar, ville: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                  <option value="">Sélectionner...</option>
                  {cities.map(city => <option key={city.id || city} value={city.name || city}>{city.name || city}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">Annuler</Button>
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">Enregistrer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Planning - Sélection des semaines */}
      <Dialog open={showPlanningDialog} onOpenChange={setShowPlanningDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📅 Planning - {decodeURIComponent(departement)}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 mb-4">
              {canEdit 
                ? 'Sélectionnez une semaine pour créer ou modifier le planning :'
                : 'Sélectionnez une semaine pour consulter le planning :'}
            </p>
            <div className="grid grid-cols-8 md:grid-cols-13 gap-2">
              {Array.from({ length: 52 }, (_, i) => i + 1).map(week => (
                <div key={week} className="relative group">
                  {canEdit && hasPlanning(week) && (
                    <button
                      onClick={() => deletePlanning(week)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Supprimer ce planning"
                    >
                      ×
                    </button>
                  )}
                  <Button
                    onClick={() => openWeekPlanning(week)}
                    variant={hasPlanning(week) ? "default" : "outline"}
                    className={`w-12 h-12 text-sm ${hasPlanning(week) ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                  >
                    {week}
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <span className="flex items-center gap-2"><span className="w-4 h-4 bg-purple-600 rounded"></span> Planning existant</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 border rounded"></span> Pas de planning</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Planning - Édition d'une semaine avec tableau propre */}
      <Dialog open={showWeekPlanningDialog} onOpenChange={setShowWeekPlanningDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {canEdit ? <Edit className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              📅 Planning Semaine {selectedWeek} - {decodeURIComponent(departement)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Tableau propre */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="p-3 text-left font-semibold text-purple-800 w-36">Type Culte</th>
                    <th className="p-3 text-left font-semibold text-purple-800 w-44">Rôle/Service</th>
                    <th className="p-3 text-left font-semibold text-purple-800">Membres assignés</th>
                    <th className="p-3 text-left font-semibold text-purple-800 w-48">Commentaire</th>
                    {canEdit && <th className="p-3 text-center font-semibold text-purple-800 w-16">🗑️</th>}
                  </tr>
                </thead>
                <tbody>
                  {(currentPlanning.entries || []).length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 5 : 4} className="p-8 text-center text-gray-500">
                        Aucune entrée dans le planning pour cette semaine
                        {canEdit && (
                          <p className="text-sm mt-2">Cliquez sur "Ajouter une ligne" pour commencer</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    (currentPlanning.entries || []).map((entry, idx) => (
                      <tr key={idx} className="border-t hover:bg-gray-50">
                        <td className="p-3">
                          {canEdit ? (
                            <Select
                              value={entry.type_culte || ''}
                              onValueChange={(val) => updatePlanningEntry(idx, 'type_culte', val)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Type..." />
                              </SelectTrigger>
                              <SelectContent>
                                {typesCulte.map(t => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="font-medium">{entry.type_culte || '-'}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {canEdit ? (
                            <Select
                              value={entry.role || ''}
                              onValueChange={(val) => updatePlanningEntry(idx, 'role', val)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Rôle..." />
                              </SelectTrigger>
                              <SelectContent>
                                {rolesPlanning.map(r => (
                                  <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="font-medium">{entry.role || '-'}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {canEdit ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1 mb-2">
                                {(entry.membres_noms || []).map((nom, i) => (
                                  <span key={i} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                    {nom}
                                    <button
                                      onClick={() => {
                                        const star = stars.find(s => `${s.prenom} ${s.nom}` === nom);
                                        if (star) toggleMemberSelection(idx, star.id, nom);
                                      }}
                                      className="ml-1 text-purple-500 hover:text-purple-700"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                                {stars.filter(s => s.statut === 'actif').map(s => {
                                  const fullName = `${s.prenom} ${s.nom}`;
                                  const isSelected = (entry.membre_ids || []).includes(s.id);
                                  return (
                                    <label key={s.id} className="flex items-center gap-2 py-1 hover:bg-gray-100 px-1 rounded cursor-pointer">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleMemberSelection(idx, s.id, fullName)}
                                      />
                                      <span className="text-sm">{fullName}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {(entry.membres_noms || []).length > 0 ? (
                                entry.membres_noms.map((nom, i) => (
                                  <span key={i} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                                    {nom}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {canEdit ? (
                            <Input
                              value={entry.commentaire || ''}
                              onChange={(e) => updatePlanningEntry(idx, 'commentaire', e.target.value)}
                              placeholder="Note..."
                              className="text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-600">{entry.commentaire || '-'}</span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="p-3 text-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removePlanningEntry(idx)} 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {canEdit && (
              <Button onClick={addPlanningEntry} variant="outline" className="w-full border-dashed">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </Button>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowWeekPlanningDialog(false)} className="flex-1">
                {canEdit ? 'Annuler' : 'Fermer'}
              </Button>
              {canEdit && (
                <Button onClick={savePlanning} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  Enregistrer le planning
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </LayoutMinistereStars>
  );
};

export default MinistereStarsDepartementPage;
