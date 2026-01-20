import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowLeft, Plus, Calendar, CheckCircle, XCircle, Clock, Trash2, Save, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '../utils/api';

const AgendaDepartementPage = () => {
  const { departement } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  
  const [loading, setLoading] = useState(true);
  const [selectedSemestre, setSelectedSemestre] = useState('1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddActiviteDialog, setShowAddActiviteDialog] = useState(false);
  const [showEditPriereDialog, setShowEditPriereDialog] = useState(false);
  
  // Configuration temps de prière (une seule config par département)
  const [priereConfig, setPriereConfig] = useState(null);
  
  // Liste des activités
  const [activites, setActivites] = useState([]);
  
  const publicVille = location.state?.ville;
  const isPublicMode = location.state?.publicMode || !user;
  const canEdit = user && ['super_admin', 'pasteur', 'respo_departement'].includes(user.role);

  // Formulaire temps de prière
  const [priereForm, setPriereForm] = useState({
    jour: 'mardi',
    heure: '19:00',
    isRecurrent: false,
    frequence: 'hebdomadaire'
  });

  // Formulaire activité
  const [activiteForm, setActiviteForm] = useState({
    titre: '',
    date: '',
    heure: '',
    description: ''
  });

  const joursSemaine = [
    { value: 'lundi', label: 'Lundi' },
    { value: 'mardi', label: 'Mardi' },
    { value: 'mercredi', label: 'Mercredi' },
    { value: 'jeudi', label: 'Jeudi' },
    { value: 'vendredi', label: 'Vendredi' },
    { value: 'samedi', label: 'Samedi' },
    { value: 'dimanche', label: 'Dimanche' }
  ];

  const frequences = [
    { value: 'hebdomadaire', label: 'Chaque semaine' },
    { value: 'bimensuel', label: 'Toutes les 2 semaines' },
    { value: 'mensuel', label: 'Chaque mois' }
  ];

  const statutOptions = [
    { value: 'planifie', label: 'Planifié', icon: Clock, color: 'text-blue-600 bg-blue-100' },
    { value: 'fait', label: 'Fait', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { value: 'pas_fait', label: 'Pas fait', icon: XCircle, color: 'text-red-600 bg-red-100' },
    { value: 'en_retard', label: 'En retard', icon: Clock, color: 'text-orange-600 bg-orange-100' }
  ];

  useEffect(() => {
    loadData();
  }, [departement, selectedSemestre, selectedYear]);

  const loadData = async () => {
    try {
      const params = new URLSearchParams({
        semestre: selectedSemestre,
        annee: selectedYear.toString()
      });
      if (publicVille) params.append('ville', publicVille);
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda/${encodeURIComponent(departement)}?${params}`
      );
      const data = await response.json();
      
      // Séparer la config prière des activités
      const priere = data.find(d => d.type === 'temps_priere_config');
      const acts = data.filter(d => d.type === 'activite');
      
      setPriereConfig(priere || null);
      setActivites(acts || []);
      
      if (priere) {
        setPriereForm({
          jour: priere.jour || 'mardi',
          heure: priere.heure || '19:00',
          isRecurrent: priere.isRecurrent || false,
          frequence: priere.frequence || 'hebdomadaire'
        });
      }
    } catch (error) {
      console.error('Error loading agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePriere = async () => {
    try {
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda-priere`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'temps_priere_config',
          departement: decodeURIComponent(departement),
          jour: priereForm.jour,
          heure: priereForm.heure,
          isRecurrent: priereForm.isRecurrent,
          frequence: priereForm.isRecurrent ? priereForm.frequence : null,
          semestre: selectedSemestre,
          annee: selectedYear,
          ville: publicVille || user?.city || ''
        })
      });
      
      if (response.ok) {
        toast.success('Temps de prière enregistré');
        setShowEditPriereDialog(false);
        loadData();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleAddActivite = async () => {
    if (!activiteForm.titre || !activiteForm.date) {
      toast.error('Veuillez remplir le titre et la date');
      return;
    }

    try {
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda-public`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: activiteForm.date,
          type: 'activite',
          titre: activiteForm.titre,
          description: activiteForm.description,
          heure: activiteForm.heure,
          statut: 'planifie',
          departement: decodeURIComponent(departement),
          semestre: selectedSemestre,
          annee: selectedYear,
          ville: publicVille || user?.city || ''
        })
      });
      
      if (response.ok) {
        toast.success('Activité ajoutée');
        setShowAddActiviteDialog(false);
        setActiviteForm({ titre: '', date: '', heure: '', description: '' });
        loadData();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleUpdateStatut = async (entryId, newStatut) => {
    try {
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda-public/entry/${entryId}/statut`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut })
      });
      
      if (response.ok) {
        toast.success('Statut mis à jour');
        loadData();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDeleteActivite = async (entryId) => {
    if (!window.confirm('Supprimer cette activité ?')) return;
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (user) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
      }
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda/entry/${entryId}`,
        { method: 'DELETE', headers }
      );
      
      if (response.ok) {
        toast.success('Supprimé');
        loadData();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const jourLabel = joursSemaine.find(j => j.value === priereForm.jour)?.label || priereForm.jour;
  const freqLabel = frequences.find(f => f.value === priereForm.frequence)?.label || '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-yellow-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">📅 Agenda - {decodeURIComponent(departement)}</h1>
                <p className="text-orange-100">Semestre {selectedSemestre} - {selectedYear}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={selectedSemestre} onValueChange={setSelectedSemestre}>
                <SelectTrigger className="w-32 bg-white/10 border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semestre 1</SelectItem>
                  <SelectItem value="2">Semestre 2</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-24 bg-white/10 border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <>
            {/* Section Temps de prière - UNE SEULE CONFIG */}
            <Card>
              <CardHeader className="bg-purple-50 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  🙏 Temps de prière
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowEditPriereDialog(true)}
                  className="border-purple-300 text-purple-700"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Configurer
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                {priereConfig ? (
                  <div className="flex items-center gap-4 p-4 bg-purple-50/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-lg text-purple-900">
                        {jourLabel} à {priereConfig.heure || priereForm.heure}
                      </div>
                      {priereConfig.isRecurrent && (
                        <div className="text-sm text-purple-600 mt-1">
                          🔄 Récurrent - {freqLabel}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p>Aucun temps de prière configuré</p>
                    <Button 
                      onClick={() => setShowEditPriereDialog(true)}
                      className="mt-3 bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Configurer le temps de prière
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Activités */}
            <Card>
              <CardHeader className="bg-orange-50 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  📌 Activités
                  <span className="text-sm font-normal text-orange-600">({activites.length})</span>
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => setShowAddActiviteDialog(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                {activites.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p>Aucune activité planifiée</p>
                    <Button 
                      onClick={() => setShowAddActiviteDialog(true)}
                      className="mt-3 bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une activité
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activites.map(entry => {
                      const statutInfo = statutOptions.find(s => s.value === entry.statut) || statutOptions[0];
                      return (
                        <div key={entry.id} className="p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">{entry.titre}</div>
                              <div className="text-sm text-gray-500">
                                📅 {new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                {entry.heure && ` à ${entry.heure}`}
                              </div>
                              {entry.description && <p className="text-xs text-gray-400 mt-1">{entry.description}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Statut - seulement pour activités */}
                              <Select value={entry.statut} onValueChange={(v) => handleUpdateStatut(entry.id, v)}>
                                <SelectTrigger className={`w-28 text-xs ${statutInfo.color}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statutOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {canEdit && (
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteActivite(entry.id)} className="text-red-500 h-8 w-8 p-0">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Dialog Configurer Temps de prière */}
      <Dialog open={showEditPriereDialog} onOpenChange={setShowEditPriereDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>🙏 Configurer le temps de prière</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Jour</Label>
                <Select value={priereForm.jour} onValueChange={(v) => setPriereForm({...priereForm, jour: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {joursSemaine.map(j => (
                      <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={priereForm.heure}
                  onChange={(e) => setPriereForm({...priereForm, heure: e.target.value})}
                />
              </div>
            </div>
            
            {/* Checkbox récurrence */}
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <input
                type="checkbox"
                id="isRecurrent"
                checked={priereForm.isRecurrent}
                onChange={(e) => setPriereForm({...priereForm, isRecurrent: e.target.checked})}
                className="w-4 h-4 text-purple-600"
              />
              <Label htmlFor="isRecurrent" className="cursor-pointer font-medium text-purple-800">
                🔄 Récurrent
              </Label>
            </div>
            
            {priereForm.isRecurrent && (
              <div>
                <Label>Fréquence</Label>
                <Select value={priereForm.frequence} onValueChange={(v) => setPriereForm({...priereForm, frequence: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequences.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              {priereForm.isRecurrent ? (
                <>💡 Temps de prière le <strong>{joursSemaine.find(j => j.value === priereForm.jour)?.label}</strong> à <strong>{priereForm.heure}</strong> - {frequences.find(f => f.value === priereForm.frequence)?.label}</>
              ) : (
                <>💡 Temps de prière le <strong>{joursSemaine.find(j => j.value === priereForm.jour)?.label}</strong> à <strong>{priereForm.heure}</strong></>
              )}
            </div>
            
            <Button onClick={handleSavePriere} className="w-full bg-purple-600 hover:bg-purple-700">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Ajouter Activité */}
      <Dialog open={showAddActiviteDialog} onOpenChange={setShowAddActiviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>📌 Ajouter une activité</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre *</Label>
              <Input
                value={activiteForm.titre}
                onChange={(e) => setActiviteForm({...activiteForm, titre: e.target.value})}
                placeholder="Ex: Retraite annuelle, Formation..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={activiteForm.date}
                  onChange={(e) => setActiviteForm({...activiteForm, date: e.target.value})}
                />
              </div>
              <div>
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={activiteForm.heure}
                  onChange={(e) => setActiviteForm({...activiteForm, heure: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={activiteForm.description}
                onChange={(e) => setActiviteForm({...activiteForm, description: e.target.value})}
                placeholder="Détails de l'activité..."
                rows={2}
              />
            </div>
            
            <Button onClick={handleAddActivite} className="w-full bg-orange-600 hover:bg-orange-700">
              <Save className="h-4 w-4 mr-2" />
              Ajouter l'activité
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendaDepartementPage;
