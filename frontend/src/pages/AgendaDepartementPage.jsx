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
  
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemestre, setSelectedSemestre] = useState('1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const publicVille = location.state?.ville;
  const isPublicMode = location.state?.publicMode || !user;
  
  // Permettre l'ajout à tous, mais la modification de statut uniquement aux admins connectés
  const canEdit = user && ['super_admin', 'pasteur', 'respo_departement'].includes(user.role);
  const canAdd = true; // Tout le monde peut ajouter des entrées
  
  const [newEntry, setNewEntry] = useState({
    date: '',
    type: 'priere_hebdo',
    titre: '',
    description: '',
    statut: 'planifie',
    heure: '',
    isRecurring: false,
    recurringDay: 'mardi',
    recurringEndDate: ''
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

  const typeOptions = [
    { value: 'priere_hebdo', label: 'Temps de prière hebdomadaire' },
    { value: 'programme_special', label: 'Programme spécial' },
    { value: 'reunion', label: 'Réunion' },
    { value: 'formation', label: 'Formation' },
    { value: 'autre', label: 'Autre' }
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
      const villeParam = publicVille ? `&ville=${encodeURIComponent(publicVille)}` : '';
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda/${encodeURIComponent(departement)}?semestre=${selectedSemestre}&annee=${selectedYear}${villeParam}`
      );
      if (response.ok) {
        const data = await response.json();
        setAgenda(data);
      }
    } catch (error) {
      console.error('Error loading agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour générer les dates récurrentes
  const generateRecurringDates = (startDate, endDate, dayOfWeek) => {
    const dayMap = {
      'lundi': 1, 'mardi': 2, 'mercredi': 3, 'jeudi': 4,
      'vendredi': 5, 'samedi': 6, 'dimanche': 0
    };
    
    const targetDay = dayMap[dayOfWeek];
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
    
    // Trouver le premier jour correspondant
    while (current.getDay() !== targetDay) {
      current.setDate(current.getDate() + 1);
    }
    
    // Générer toutes les dates jusqu'à la fin
    while (current <= end) {
      dates.push(new Date(current).toISOString().split('T')[0]);
      current.setDate(current.getDate() + 7);
    }
    
    return dates;
  };

  const handleAddEntry = async () => {
    if (newEntry.isRecurring) {
      // Mode récurrent
      if (!newEntry.recurringEndDate || !newEntry.titre) {
        toast.error('Veuillez remplir le titre et la date de fin');
        return;
      }
      
      const startDate = newEntry.date || new Date().toISOString().split('T')[0];
      const dates = generateRecurringDates(startDate, newEntry.recurringEndDate, newEntry.recurringDay);
      
      if (dates.length === 0) {
        toast.error('Aucune date trouvée pour cette récurrence');
        return;
      }
      
      try {
        const url = user 
          ? `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda/${encodeURIComponent(departement)}`
          : `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda-public`;
        
        const headers = { 'Content-Type': 'application/json' };
        if (user) {
          headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        }
        
        let successCount = 0;
        for (const date of dates) {
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              date,
              type: newEntry.type,
              titre: newEntry.titre,
              description: newEntry.description + (newEntry.heure ? ` - ${newEntry.heure}` : ''),
              statut: 'planifie',
              heure: newEntry.heure,
              departement: decodeURIComponent(departement),
              semestre: selectedSemestre,
              annee: selectedYear,
              ville: publicVille || user?.city || '',
              isRecurring: true,
              recurringDay: newEntry.recurringDay
            })
          });
          if (response.ok) successCount++;
        }
        
        toast.success(`${successCount} entrées créées (tous les ${newEntry.recurringDay}s)`);
        setShowAddDialog(false);
        setNewEntry({ date: '', type: 'priere_hebdo', titre: '', description: '', statut: 'planifie', heure: '', isRecurring: false, recurringDay: 'mardi', recurringEndDate: '' });
        loadAgenda();
      } catch (error) {
        toast.error('Erreur lors de la création');
      }
    } else {
      // Mode simple (une seule date)
      if (!newEntry.date || !newEntry.titre) {
        toast.error('Veuillez remplir la date et le titre');
        return;
      }
      
      try {
        const url = user 
          ? `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda/${encodeURIComponent(departement)}`
          : `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda-public`;
        
        const headers = { 'Content-Type': 'application/json' };
        if (user) {
          headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        }
        
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...newEntry,
            description: newEntry.description + (newEntry.heure ? ` - ${newEntry.heure}` : ''),
            departement: decodeURIComponent(departement),
            semestre: selectedSemestre,
            annee: selectedYear,
            ville: publicVille || user?.city || ''
          })
        });
        
        if (response.ok) {
          toast.success('Entrée ajoutée');
          setShowAddDialog(false);
          setNewEntry({ date: '', type: 'priere_hebdo', titre: '', description: '', statut: 'planifie', heure: '', isRecurring: false, recurringDay: 'mardi', recurringEndDate: '' });
          loadAgenda();
        } else {
          toast.error('Erreur lors de l\'ajout');
        }
      } catch (error) {
        toast.error('Erreur');
      }
    }
  };


  const handleUpdateStatut = async (entryId, newStatut) => {
    try {
      // Utiliser l'endpoint public si pas connecté
      const url = user 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda/entry/${entryId}/statut`
        : `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda-public/entry/${entryId}/statut`;
      
      const headers = {
        'Content-Type': 'application/json'
      };
      if (user) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
      }
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
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
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda/entry/${entryId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      if (response.ok) {
        toast.success('Supprimé');
        loadAgenda();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatutInfo = (statut) => {
    return statutOptions.find(s => s.value === statut) || statutOptions[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  Agenda - {decodeURIComponent(departement)}
                </h1>
                <p className="text-sm text-gray-500">
                  Semestre {selectedSemestre} - {selectedYear}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={selectedSemestre} onValueChange={setSelectedSemestre}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semestre 1</SelectItem>
                  <SelectItem value="2">Semestre 2</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Bouton Ajouter visible pour tous */}
              <Button onClick={() => setShowAddDialog(true)} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : agenda.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune entrée dans l'agenda pour ce semestre</p>
              <Button onClick={() => setShowAddDialog(true)} className="mt-4 bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter la première entrée
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {agenda.map((entry) => {
              const statutInfo = getStatutInfo(entry.statut);
              const StatutIcon = statutInfo.icon;
              
              return (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium bg-orange-100 text-orange-700 px-2 py-1 rounded">
                            {formatDate(entry.date)}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {typeOptions.find(t => t.value === entry.type)?.label || entry.type}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{entry.titre}</h3>
                        {entry.description && (
                          <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Sélecteur de statut visible pour tous */}
                        <Select 
                          value={entry.statut} 
                          onValueChange={(v) => handleUpdateStatut(entry.id, v)}
                        >
                          <SelectTrigger className={`w-32 ${statutInfo.color}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statutOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  <opt.icon className="h-3 w-3" />
                                  {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog Ajouter */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une entrée à l'agenda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Toggle Récurrence */}
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <input
                type="checkbox"
                id="isRecurring"
                checked={newEntry.isRecurring}
                onChange={(e) => setNewEntry({...newEntry, isRecurring: e.target.checked})}
                className="w-4 h-4 text-orange-600"
              />
              <Label htmlFor="isRecurring" className="cursor-pointer font-medium text-orange-800">
                📅 Événement récurrent (tous les mardis, samedis, etc.)
              </Label>
            </div>
            
            {newEntry.isRecurring ? (
              <>
                {/* Mode Récurrent */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Jour de la semaine *</Label>
                    <Select 
                      value={newEntry.recurringDay} 
                      onValueChange={(v) => setNewEntry({...newEntry, recurringDay: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {joursSemaine.map(jour => (
                          <SelectItem key={jour.value} value={jour.value}>{jour.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Heure (optionnel)</Label>
                    <Input
                      type="time"
                      value={newEntry.heure}
                      onChange={(e) => setNewEntry({...newEntry, heure: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>À partir du</Label>
                    <Input
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Jusqu'au *</Label>
                    <Input
                      type="date"
                      value={newEntry.recurringEndDate}
                      onChange={(e) => setNewEntry({...newEntry, recurringEndDate: e.target.value})}
                    />
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                  💡 Cela créera une entrée pour chaque {newEntry.recurringDay} entre les dates sélectionnées
                </p>
              </>
            ) : (
              <>
                {/* Mode Simple */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Heure (optionnel)</Label>
                    <Input
                      type="time"
                      value={newEntry.heure}
                      onChange={(e) => setNewEntry({...newEntry, heure: e.target.value})}
                    />
                  </div>
                </div>
              </>
            )}
            
            <div>
              <Label>Type</Label>
              <Select 
                value={newEntry.type} 
                onValueChange={(v) => setNewEntry({...newEntry, type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Titre *</Label>
              <Input
                value={newEntry.titre}
                onChange={(e) => setNewEntry({...newEntry, titre: e.target.value})}
                placeholder="Ex: Prière du mercredi"
              />
            </div>
            
            <div>
              <Label>Description (optionnel)</Label>
              <Textarea
                value={newEntry.description}
                onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                placeholder="Détails supplémentaires..."
              />
            </div>
            
            <Button onClick={handleAddEntry} className="w-full bg-orange-600 hover:bg-orange-700">
              <Save className="h-4 w-4 mr-2" />
              {newEntry.isRecurring ? 'Créer les entrées récurrentes' : 'Enregistrer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendaDepartementPage;
