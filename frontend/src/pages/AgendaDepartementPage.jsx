import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowLeft, Plus, Calendar, CheckCircle, XCircle, Clock, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '../utils/api';

const AgendaDepartementPage = () => {
  const { departement } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemestre, setSelectedSemestre] = useState('1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addType, setAddType] = useState(null); // 'priere' ou 'activite'
  
  const publicVille = location.state?.ville;
  const isPublicMode = location.state?.publicMode || !user;
  const canEdit = user && ['super_admin', 'pasteur', 'respo_departement'].includes(user.role);

  // Formulaire Temps de prière
  const [priereForm, setPriereForm] = useState({
    jour: 'mardi',
    heure: '19:00',
    frequence: 'hebdomadaire',
    dateDebut: '',
    dateFin: ''
  });

  // Formulaire Activité
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
    { value: 'hebdomadaire', label: 'Chaque semaine', interval: 7 },
    { value: 'bimensuel', label: 'Toutes les 2 semaines', interval: 14 },
    { value: 'mensuel', label: 'Chaque mois', interval: 30 }
  ];

  const statutOptions = [
    { value: 'planifie', label: 'Planifié', icon: Clock, color: 'text-blue-600 bg-blue-100' },
    { value: 'fait', label: 'Fait', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { value: 'pas_fait', label: 'Pas fait', icon: XCircle, color: 'text-red-600 bg-red-100' },
    { value: 'en_retard', label: 'En retard', icon: Clock, color: 'text-orange-600 bg-orange-100' }
  ];

  useEffect(() => {
    loadAgenda();
  }, [departement, selectedSemestre, selectedYear]);

  const loadAgenda = async () => {
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
      setAgenda(data || []);
    } catch (error) {
      console.error('Error loading agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  // Générer les dates récurrentes
  const generateRecurringDates = (startDate, endDate, dayOfWeek, frequence) => {
    const dayMap = {
      'lundi': 1, 'mardi': 2, 'mercredi': 3, 'jeudi': 4,
      'vendredi': 5, 'samedi': 6, 'dimanche': 0
    };
    
    const interval = frequences.find(f => f.value === frequence)?.interval || 7;
    const targetDay = dayMap[dayOfWeek];
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
    
    // Trouver le premier jour correspondant
    while (current.getDay() !== targetDay) {
      current.setDate(current.getDate() + 1);
    }
    
    // Générer les dates selon la fréquence
    while (current <= end) {
      dates.push(new Date(current).toISOString().split('T')[0]);
      current.setDate(current.getDate() + interval);
    }
    
    return dates;
  };

  const handleAddPriere = async () => {
    if (!priereForm.dateDebut || !priereForm.dateFin) {
      toast.error('Veuillez définir la période (date début et fin)');
      return;
    }

    const dates = generateRecurringDates(
      priereForm.dateDebut, 
      priereForm.dateFin, 
      priereForm.jour, 
      priereForm.frequence
    );

    if (dates.length === 0) {
      toast.error('Aucune date trouvée pour cette période');
      return;
    }

    try {
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda-public`;
      const headers = { 'Content-Type': 'application/json' };
      
      let successCount = 0;
      const jourLabel = joursSemaine.find(j => j.value === priereForm.jour)?.label;
      const freqLabel = frequences.find(f => f.value === priereForm.frequence)?.label;
      
      for (const date of dates) {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            date,
            type: 'temps_priere',
            titre: `Temps de prière - ${jourLabel}`,
            description: `${freqLabel} à ${priereForm.heure}`,
            heure: priereForm.heure,
            statut: 'planifie',
            departement: decodeURIComponent(departement),
            semestre: selectedSemestre,
            annee: selectedYear,
            ville: publicVille || user?.city || '',
            frequence: priereForm.frequence,
            jour: priereForm.jour
          })
        });
        if (response.ok) successCount++;
      }
      
      toast.success(`${successCount} temps de prière créés (${freqLabel.toLowerCase()})`);
      setShowAddDialog(false);
      setAddType(null);
      setPriereForm({ jour: 'mardi', heure: '19:00', frequence: 'hebdomadaire', dateDebut: '', dateFin: '' });
      loadAgenda();
    } catch (error) {
      toast.error('Erreur lors de la création');
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
          description: activiteForm.description + (activiteForm.heure ? ` - ${activiteForm.heure}` : ''),
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
        setShowAddDialog(false);
        setAddType(null);
        setActiviteForm({ titre: '', date: '', heure: '', description: '' });
        loadAgenda();
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
        loadAgenda();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Supprimer cette entrée ?')) return;
    
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
        loadAgenda();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // Grouper l'agenda par type
  const tempsDepriere = agenda.filter(a => a.type === 'temps_priere');
  const activites = agenda.filter(a => a.type !== 'temps_priere');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-yellow-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
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
                <p className="text-orange-100">Planification annuelle du département</p>
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

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Boutons d'ajout */}
        <div className="flex gap-3">
          <Button 
            onClick={() => { setAddType('priere'); setShowAddDialog(true); }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            🙏 Ajouter Temps de prière
          </Button>
          <Button 
            onClick={() => { setAddType('activite'); setShowAddDialog(true); }}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            📌 Ajouter Activité
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section Temps de prière */}
            <Card>
              <CardHeader className="bg-purple-50">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  🙏 Temps de prière
                  <span className="text-sm font-normal text-purple-600">({tempsDepriere.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {tempsDepriere.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Aucun temps de prière planifié</p>
                ) : (
                  tempsDepriere.map(entry => {
                    const statutInfo = statutOptions.find(s => s.value === entry.statut) || statutOptions[0];
                    return (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            {new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                          <div className="text-sm text-gray-500">{entry.heure || ''}</div>
                        </div>
                        <div className="flex items-center gap-2">
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
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} className="text-red-500 h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Section Activités */}
            <Card>
              <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  📌 Activités
                  <span className="text-sm font-normal text-orange-600">({activites.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {activites.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Aucune activité planifiée</p>
                ) : (
                  activites.map(entry => {
                    const statutInfo = statutOptions.find(s => s.value === entry.statut) || statutOptions[0];
                    return (
                      <div key={entry.id} className="p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{entry.titre}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                              {entry.heure && ` à ${entry.heure}`}
                            </div>
                            {entry.description && <p className="text-xs text-gray-400 mt-1">{entry.description}</p>}
                          </div>
                          <div className="flex items-center gap-2">
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
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} className="text-red-500 h-8 w-8 p-0">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialog Ajouter */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) setAddType(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {addType === 'priere' ? '🙏 Ajouter Temps de prière' : '📌 Ajouter Activité'}
            </DialogTitle>
          </DialogHeader>
          
          {addType === 'priere' ? (
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
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Du</Label>
                  <Input
                    type="date"
                    value={priereForm.dateDebut}
                    onChange={(e) => setPriereForm({...priereForm, dateDebut: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Au</Label>
                  <Input
                    type="date"
                    value={priereForm.dateFin}
                    onChange={(e) => setPriereForm({...priereForm, dateFin: e.target.value})}
                  />
                </div>
              </div>
              
              <p className="text-sm text-gray-500 bg-purple-50 p-2 rounded">
                💡 Génère automatiquement tous les {joursSemaine.find(j => j.value === priereForm.jour)?.label.toLowerCase()}s 
                ({frequences.find(f => f.value === priereForm.frequence)?.label.toLowerCase()}) entre les dates
              </p>
              
              <Button onClick={handleAddPriere} className="w-full bg-purple-600 hover:bg-purple-700">
                <Save className="h-4 w-4 mr-2" />
                Créer les temps de prière
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Titre de l'activité *</Label>
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
                  <Label>Heure (optionnel)</Label>
                  <Input
                    type="time"
                    value={activiteForm.heure}
                    onChange={(e) => setActiviteForm({...activiteForm, heure: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label>Description (optionnel)</Label>
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendaDepartementPage;
