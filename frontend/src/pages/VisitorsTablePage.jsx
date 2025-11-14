import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getVisitors, getUser, deleteVisitor, addPresence, updateVisitor } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Trash2, Filter, X, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';

const VisitorsTablePage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  
  // Edit presence modal state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [editPresence, setEditPresence] = useState(null); // true, false, or null
  const [editComment, setEditComment] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    date: '',
    presence: 'all', // present, absent, all
    category: 'all', // Nouveau Arrivant, Nouveau Converti, De Passage, all
    status: 'actif', // actif, arrete, all
    search: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadVisitors();
  }, [user, navigate]);

  useEffect(() => {
    applyFilters();
  }, [visitors, filters]);

  const loadVisitors = async () => {
    try {
      // Include stopped visitors if filter allows it
      const includeStopped = filters.status === 'arrete' || filters.status === 'all';
      const data = await getVisitors(includeStopped);
      setVisitors(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des nouveaux arrivants et nouveaux convertiss');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...visitors];

    // Filter by status
    if (filters.status === 'actif') {
      filtered = filtered.filter(v => !v.tracking_stopped);
    } else if (filters.status === 'arrete') {
      filtered = filtered.filter(v => v.tracking_stopped);
    }

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(v => v.types.includes(filters.category));
    }

    // Filter by search (name)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(v => 
        v.firstname.toLowerCase().includes(searchLower) ||
        v.lastname.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date and presence
    if (filters.date) {
      filtered = filtered.map(v => {
        // Combiner toutes les présences
        const allPresences = [
          ...(v.presences_dimanche || []),
          ...(v.presences_jeudi || [])
        ];

        const presenceOnDate = allPresences.find(p => p.date === filters.date);
        
        if (filters.presence === 'present') {
          return presenceOnDate && presenceOnDate.present ? v : null;
        } else if (filters.presence === 'absent') {
          return presenceOnDate && presenceOnDate.present === false ? v : null;
        }
        return v;
      }).filter(v => v !== null);
    }

    setFilteredVisitors(filtered);
  };

  const handleDeleteVisitor = async () => {
    try {
      await deleteVisitor(selectedVisitor.id);
      toast.success('Visiteur supprimé avec succès');
      setDeleteDialogOpen(false);
      loadVisitors();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const resetFilters = () => {
    setFilters({
      date: '',
      presence: 'all',
      category: 'all',
      status: 'actif',
      search: ''
    });
  };

  const getPresenceInfoForDate = (visitor, date) => {
    if (!date) return { present: null, absent: null, commentaire: '-' };
    
    // Combiner toutes les présences
    const allPresences = [
      ...(visitor.presences_dimanche || []),
      ...(visitor.presences_jeudi || [])
    ];
    
    const presence = allPresences.find(p => p.date === date);
    
    if (!presence) {
      return { present: null, absent: null, commentaire: '-' };
    }
    
    return {
      present: presence.present === true ? '✅' : null,
      absent: presence.present === false ? '❌' : null,
      commentaire: presence.commentaire || '-'
    };
  };

  const handleEditPresence = (visitor) => {
    const presenceInfo = getPresenceInfoForDate(visitor, filters.date);
    setEditingVisitor(visitor);
    
    // Déterminer la présence actuelle (true, false, ou null)
    if (presenceInfo.present === '✅') {
      setEditPresence(true);
    } else if (presenceInfo.absent === '❌') {
      setEditPresence(false);
    } else {
      setEditPresence(null);
    }
    
    setEditComment(presenceInfo.commentaire === '-' ? '' : presenceInfo.commentaire);
    setEditDialogOpen(true);
  };

  const handleSavePresenceEdit = async () => {
    if (!editingVisitor || !filters.date) {
      toast.error('Erreur: Aucune date sélectionnée');
      return;
    }

    if (editPresence === null) {
      toast.error('Veuillez sélectionner Présent ou Absent');
      return;
    }

    try {
      await addPresence(
        editingVisitor.id,
        filters.date,
        editPresence,
        'dimanche',
        editComment || null
      );
      
      toast.success('Présence mise à jour avec succès');
      setEditDialogOpen(false);
      loadVisitors();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Nouveaux Arrivants - Vue Tableau</h2>
            <p className="text-gray-500 mt-1">
              {filteredVisitors.length} nouveaux arrivants et nouveaux convertis(s) 
              {user.role === 'referent' && ` - Mois: ${user.assigned_month}`}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filtres
              </CardTitle>
              <Button onClick={resetFilters} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label>Recherche</Label>
                <Input
                  placeholder="Nom..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actifs</SelectItem>
                    <SelectItem value="arrete">Arrêtés</SelectItem>
                    <SelectItem value="all">Tous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="Nouveau Arrivant">Nouveau Arrivant</SelectItem>
                    <SelectItem value="Nouveau Converti">Nouveau Converti</SelectItem>
                    <SelectItem value="De Passage">De Passage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                />
              </div>

              {/* Presence */}
              <div className="space-y-2">
                <Label>Présence</Label>
                <Select value={filters.presence} onValueChange={(value) => setFilters({...filters, presence: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="present">Présents</SelectItem>
                    <SelectItem value="absent">Absents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prénom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Canal d'arrivée</th>
                    {filters.date && (
                      <>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Présent</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absent</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commentaire</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVisitors.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                        Aucun nouveaux arrivants et nouveaux convertis trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredVisitors.map((visitor) => {
                      const presenceInfo = getPresenceInfoForDate(visitor, filters.date);
                      return (
                        <tr key={visitor.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{visitor.lastname}</td>
                          <td className="px-4 py-3 text-sm">{visitor.firstname}</td>
                          <td className="px-4 py-3 text-sm">
                            {visitor.types.join(', ')}
                          </td>
                          <td className="px-4 py-3 text-sm">{visitor.arrival_channel}</td>
                          {filters.date && (
                            <>
                              <td className="px-4 py-3 text-center text-lg">
                                {presenceInfo.present || '-'}
                              </td>
                              <td className="px-4 py-3 text-center text-lg">
                                {presenceInfo.absent || '-'}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 text-sm">
                            {presenceInfo.commentaire}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center space-x-2">
                              <Button
                                onClick={() => navigate(`/visitors/${visitor.id}`)}
                                variant="outline"
                                size="sm"
                              >
                                Voir
                              </Button>
                              {filters.date && (
                                <Button
                                  onClick={() => handleEditPresence(visitor)}
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {(user.role === 'admin' || user.role === 'referent') && (
                                <Button
                                  onClick={() => {
                                    setSelectedVisitor(visitor);
                                    setDeleteDialogOpen(true);
                                  }}
                                  variant="destructive"
                                  size="sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Presence Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la présence</DialogTitle>
            </DialogHeader>
            {editingVisitor && (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{editingVisitor.firstname} {editingVisitor.lastname}</p>
                  <p className="text-sm text-gray-500">Date: {filters.date}</p>
                </div>

                <div className="space-y-3">
                  <Label>Présence</Label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setEditPresence(true)}
                      className={`px-4 py-2 rounded border-2 flex items-center space-x-2 transition-colors ${
                        editPresence === true
                          ? 'bg-green-500 border-green-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
                      }`}
                    >
                      <span className="text-lg">✓</span>
                      <span>Présent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPresence(false)}
                      className={`px-4 py-2 rounded border-2 flex items-center space-x-2 transition-colors ${
                        editPresence === false
                          ? 'bg-red-500 border-red-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-red-400'
                      }`}
                    >
                      <span className="text-lg">✗</span>
                      <span>Absent</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Commentaire</Label>
                  <Textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSavePresenceEdit} className="bg-indigo-600 hover:bg-indigo-700">
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer {selectedVisitor?.firstname} {selectedVisitor?.lastname} ?
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteVisitor} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default VisitorsTablePage;
