import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getVisitors, getUser, deleteVisitor } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Trash2, Filter, X } from 'lucide-react';
import { toast } from 'sonner';

const VisitorsTablePage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  
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
      serviceType: 'all',
      presence: 'all',
      category: 'all',
      status: 'actif',
      search: ''
    });
  };

  const getPresenceForDate = (visitor, date, serviceType) => {
    if (!date) return '-';
    
    const presences = serviceType === 'dimanche' ? visitor.presences_dimanche : visitor.presences_jeudi;
    const presence = presences?.find(p => p.date === date);
    
    if (!presence) return '❌';
    return presence.present ? '✅' : '❌';
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

              {/* Service Type */}
              <div className="space-y-2">
                <Label>Service</Label>
                <Select value={filters.serviceType} onValueChange={(value) => setFilters({...filters, serviceType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="dimanche">Dimanche</SelectItem>
                    <SelectItem value="jeudi">Jeudi</SelectItem>
                  </SelectContent>
                </Select>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    {filters.date && (
                      <>
                        {(filters.serviceType === 'all' || filters.serviceType === 'dimanche') && (
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Dim {filters.date}
                          </th>
                        )}
                        {(filters.serviceType === 'all' || filters.serviceType === 'jeudi') && (
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Jeu {filters.date}
                          </th>
                        )}
                      </>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commentaires</th>
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
                    filteredVisitors.map((visitor) => (
                      <tr key={visitor.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{visitor.lastname}</td>
                        <td className="px-4 py-3 text-sm">{visitor.firstname}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {visitor.types.map((type, idx) => (
                              <span key={idx} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                {type}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            visitor.tracking_stopped 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {visitor.tracking_stopped ? 'Arrêté' : 'Actif'}
                          </span>
                        </td>
                        {filters.date && (
                          <>
                            {(filters.serviceType === 'all' || filters.serviceType === 'dimanche') && (
                              <td className="px-4 py-3 text-center text-sm">
                                {getPresenceForDate(visitor, filters.date, 'dimanche')}
                              </td>
                            )}
                            {(filters.serviceType === 'all' || filters.serviceType === 'jeudi') && (
                              <td className="px-4 py-3 text-center text-sm">
                                {getPresenceForDate(visitor, filters.date, 'jeudi')}
                              </td>
                            )}
                          </>
                        )}
                        <td className="px-4 py-3 text-sm">
                          <div className="max-w-xs truncate">
                            {visitor.comments && visitor.comments.length > 0 
                              ? visitor.comments[visitor.comments.length - 1].text 
                              : '-'}
                          </div>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

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
