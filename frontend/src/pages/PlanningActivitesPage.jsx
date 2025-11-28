import React, { useState, useEffect } from 'react';
import EventsLayout from '@/components/EventsLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from '@/components/ui/textarea';
import { Plus, Save, Trash2, Calendar } from 'lucide-react';

const PlanningActivitesPage = () => {
  const [activites, setActivites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [villeSelectionnee, setVilleSelectionnee] = useState('');
  
  const villes = ['Dijon', 'Rome', 'Besançon', 'Autre'];
  const ministeres = [
    'Jeunesse',
    'Évangélisation',
    'Musique',
    'Prière',
    'Enseignement',
    'Accueil',
    'Enfance',
    'Femmes',
    'Hommes',
    'Média',
    'Diaconie'
  ];
  const statuts = ['À venir', 'Reporté', 'Annulé', 'Fait'];

  useEffect(() => {
    const ville = localStorage.getItem('selected_ville_planning');
    if (ville) {
      setVilleSelectionnee(ville);
      loadActivites(ville);
    }
  }, []);

  const loadActivites = async (ville) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/planning/activites?ville=${ville}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur chargement');
      }
      
      const data = await response.json();
      setActivites(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des activités');
    }
  };

  const handleVilleSelection = (ville) => {
    setVilleSelectionnee(ville);
    localStorage.setItem('selected_ville_planning', ville);
    loadActivites(ville);
  };

  const handleAddActivite = () => {
    const nouvelleActivite = {
      id: `temp-${Date.now()}`,
      nom: '',
      date: new Date().toISOString().split('T')[0],
      ministeres: [],
      statut: 'À venir',
      commentaire: '',
      ville: villeSelectionnee,
      isNew: true
    };
    setActivites([nouvelleActivite, ...activites]);
    setEditingId(nouvelleActivite.id);
    setEditData(nouvelleActivite);
  };

  const handleEdit = (activite) => {
    setEditingId(activite.id);
    setEditData({ ...activite });
  };

  const handleCancel = (activite) => {
    if (activite.isNew) {
      setActivites(activites.filter(a => a.id !== activite.id));
    }
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async (activite) => {
    setLoading(true);
    try {
      const dataToSave = editingId ? editData : activite;
      
      if (activite.isNew) {
        // Créer nouvelle activité
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/planning/activites`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...dataToSave,
              id: undefined,
              isNew: undefined
            })
          }
        );
        
        if (!response.ok) {
          throw new Error('Erreur création');
        }
        
        const result = await response.json();
        toast.success('Activité créée');
        await loadActivites(villeSelectionnee);
      } else {
        // Modifier activité existante
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/planning/activites/${activite.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSave)
          }
        );
        
        if (!response.ok) {
          throw new Error('Erreur mise à jour');
        }
        
        toast.success('Activité mise à jour');
        await loadActivites(villeSelectionnee);
      }
      
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (activite) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
      return;
    }
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/planning/activites/${activite.id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur suppression');
      }
      
      toast.success('Activité supprimée');
      await loadActivites(villeSelectionnee);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleMinisteresChange = (value, add = true) => {
    if (add) {
      setEditData({
        ...editData,
        ministeres: [...(editData.ministeres || []), value]
      });
    } else {
      setEditData({
        ...editData,
        ministeres: (editData.ministeres || []).filter(m => m !== value)
      });
    }
  };

  // Si pas de ville sélectionnée, afficher la sélection
  if (!villeSelectionnee) {
    return (
      <EventsLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <h1 className="text-3xl font-bold mb-2">Planning des Activités</h1>
            <p className="text-gray-600">Sélectionnez votre ville pour commencer</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {villes.map((ville) => (
              <Button
                key={ville}
                onClick={() => handleVilleSelection(ville)}
                size="lg"
                className="h-24"
              >
                {ville}
              </Button>
            ))}
          </div>
        </div>
      </EventsLayout>
    );
  }

  return (
    <EventsLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Planning des Activités</h1>
            <p className="text-gray-600">Ville: {villeSelectionnee}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setVilleSelectionnee('');
              localStorage.removeItem('selected_ville_planning');
            }}>
              Changer de ville
            </Button>
            <Button onClick={handleAddActivite}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle activité
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Nom de l'activité</TableHead>
                <TableHead className="w-[150px]">Date</TableHead>
                <TableHead className="w-[200px]">Ministères</TableHead>
                <TableHead className="w-[130px]">Statut</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Aucune activité. Cliquez sur "Nouvelle activité" pour commencer.
                  </TableCell>
                </TableRow>
              ) : (
                activites.map((activite) => {
                  const isEditing = editingId === activite.id;
                  const data = isEditing ? editData : activite;
                  
                  return (
                    <TableRow key={activite.id}>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={data.nom}
                            onChange={(e) => setEditData({ ...data, nom: e.target.value })}
                            placeholder="Nom de l'activité"
                          />
                        ) : (
                          <span className="font-medium">{activite.nom}</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={data.date}
                            onChange={(e) => setEditData({ ...data, date: e.target.value })}
                          />
                        ) : (
                          new Date(activite.date).toLocaleDateString('fr-FR')
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <div className="space-y-2">
                            <Select onValueChange={(v) => handleMinisteresChange(v, true)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Ajouter ministère" />
                              </SelectTrigger>
                              <SelectContent>
                                {ministeres.map((m) => (
                                  <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex flex-wrap gap-1">
                              {(data.ministeres || []).map((m) => (
                                <span
                                  key={m}
                                  className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded cursor-pointer"
                                  onClick={() => handleMinisteresChange(m, false)}
                                >
                                  {m} ×
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(activite.ministeres || []).map((m) => (
                              <span key={m} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={data.statut}
                            onValueChange={(v) => setEditData({ ...data, statut: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statuts.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            activite.statut === 'Fait' ? 'bg-green-100 text-green-800' :
                            activite.statut === 'À venir' ? 'bg-blue-100 text-blue-800' :
                            activite.statut === 'Reporté' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {activite.statut}
                          </span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <Textarea
                            value={data.commentaire}
                            onChange={(e) => setEditData({ ...data, commentaire: e.target.value })}
                            placeholder="Commentaire..."
                            rows={2}
                          />
                        ) : (
                          <span className="text-sm text-gray-600">{activite.commentaire}</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave(activite)}
                              disabled={loading}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancel(activite)}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(activite)}
                            >
                              ✏️
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(activite)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </EventsLayout>
  );
};

export default PlanningActivitesPage;
