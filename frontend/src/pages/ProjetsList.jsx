import React, { useState, useEffect } from 'react';
import EventsLayout from '../components/EventsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Calendar, Edit, Trash2, Eye, Archive, ArchiveRestore, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getUser } from '../utils/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ProjetsList = () => {
  const user = getUser();
  const navigate = useNavigate();
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [newProjet, setNewProjet] = useState({
    titre: '',
    description: '',
    date_debut: '',
    date_fin: '',
    budget_prevu: 0,
    ville: user?.city || 'Dijon'
  });

  useEffect(() => {
    loadProjets();
  }, []);

  const loadProjets = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/projets`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setProjets(data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/projets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProjet)
      });
      
      if (response.ok) {
        toast.success('Projet créé !');
        setIsDialogOpen(false);
        loadProjets();
        setNewProjet({ titre: '', description: '', date_debut: '', date_fin: '', budget_prevu: 0, ville: user?.city || 'Dijon' });
      }
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const getStatutColor = (statut) => {
    const colors = {
      'planifie': 'bg-blue-100 text-blue-800',
      'en_cours': 'bg-yellow-100 text-yellow-800',
      'termine': 'bg-green-100 text-green-800',
      'annule': 'bg-red-100 text-red-800'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const handleArchiveProjet = async (projetId) => {
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/projets/${projetId}/archive`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Projet archivé');
      loadProjets();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDeleteProjet = async (projetId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) {
      return;
    }
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/projets/${projetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Projet supprimé');
      loadProjets();
    } catch (error) {
      toast.error('Erreur');
    }
  };

      'termine': 'bg-green-100 text-green-800',
      'annule': 'bg-red-100 text-red-800'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const getStatutLabel = (statut) => {
    const labels = {
      'planifie': 'Planifié',
      'en_cours': 'En cours',
      'termine': 'Terminé',
      'annule': 'Annulé'
    };
    return labels[statut] || statut;
  };

  return (
    <EventsLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Projets & Événements</h1>
            <p className="text-gray-500">Gérez vos projets d'église</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Projet
          </Button>
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projets.map((projet) => (
              <Card key={projet.id} className={`hover:shadow-lg transition-shadow cursor-pointer ${projet.archived ? 'opacity-75' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="text-lg">
                      {projet.titre}
                      {projet.archived && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Archivé</span>}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatutColor(projet.statut)}`}>
                      {getStatutLabel(projet.statut)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{projet.description || 'Aucune description'}</p>
                  
                  <div className="space-y-1 text-sm text-gray-500">
                    {projet.date_debut && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(projet.date_debut).toLocaleDateString('fr-FR')} - {projet.date_fin ? new Date(projet.date_fin).toLocaleDateString('fr-FR') : '...'}
                      </div>
                    )}
                    <div>Budget: {projet.budget_prevu}€</div>
                    <div className="text-xs">Par {projet.created_by}</div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => navigate(`/events/projets/${projet.id}`)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Voir
                    </Button>
                    {projet.archived ? (
                      <Button size="sm" variant="outline" onClick={() => handleArchiveProjet(projet.id)} title="Désarchiver">
                        <ArchiveRestore className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleArchiveProjet(projet.id)} title="Archiver">
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteProjet(projet.id)} title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog Create */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau Projet</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Titre *</Label>
                <Input
                  value={newProjet.titre}
                  onChange={(e) => setNewProjet({...newProjet, titre: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  className="w-full border rounded p-2"
                  rows={3}
                  value={newProjet.description}
                  onChange={(e) => setNewProjet({...newProjet, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date début</Label>
                  <Input
                    type="date"
                    value={newProjet.date_debut}
                    onChange={(e) => setNewProjet({...newProjet, date_debut: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Date fin</Label>
                  <Input
                    type="date"
                    value={newProjet.date_fin}
                    onChange={(e) => setNewProjet({...newProjet, date_fin: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Budget prévu (€)</Label>
                <Input
                  type="number"
                  value={newProjet.budget_prevu}
                  onChange={(e) => setNewProjet({...newProjet, budget_prevu: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Créer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </EventsLayout>
  );
};

export default ProjetsList;
