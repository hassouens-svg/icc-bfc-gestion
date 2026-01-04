import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PublicBergerieLayout from '../components/PublicBergerieLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Filter, X, TrendingUp, RefreshCw, Pencil, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const monthNames = {
  '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
  '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
  '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
};

const PublicBergerieVisitorsTablePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const ville = searchParams.get('ville') || '';
  const monthNum = searchParams.get('month') || '01';
  
  const guestContextStr = localStorage.getItem('guest_bergerie_context');
  const guestContext = guestContextStr ? JSON.parse(guestContextStr) : {
    ville,
    month_num: monthNum,
    month_name: monthNames[monthNum] || monthNum,
    nom: `Bergerie ${monthNames[monthNum] || monthNum}`
  };

  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tauxFidelisation, setTauxFidelisation] = useState(0);
  
  const [filters, setFilters] = useState({
    date: '',
    presence: 'all',
    category: 'all',
    search: ''
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [editPresence, setEditPresence] = useState(null);
  const [editComment, setEditComment] = useState('');

  useEffect(() => {
    if (!ville || !monthNum) {
      navigate('/bergeries');
      return;
    }
    loadVisitors();
  }, [ville, monthNum]);

  useEffect(() => {
    applyFilters();
  }, [visitors, filters]);

  const loadVisitors = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/reproduction/${encodeURIComponent(ville)}/${monthNum}`
      );
      if (response.ok) {
        const data = await response.json();
        setVisitors(data.visitors || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = visitors.filter(v => !v.tracking_stopped);

    if (filters.category !== 'all') {
      filtered = filtered.filter(v => v.types?.includes(filters.category));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(v => 
        v.firstname?.toLowerCase().includes(searchLower) ||
        v.lastname?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.date) {
      filtered = filtered.map(v => {
        const allPresences = [...(v.presences_dimanche || []), ...(v.presences_jeudi || [])];
        const presenceOnDate = allPresences.find(p => p.date === filters.date);
        
        if (filters.presence === 'present') {
          return presenceOnDate?.present === true ? v : null;
        } else if (filters.presence === 'absent') {
          return presenceOnDate?.present === false ? v : null;
        }
        return v;
      }).filter(Boolean);
    }

    setFilteredVisitors(filtered);
    calculateFidelisation(filtered);
  };

  const calculateFidelisation = (visitorsList) => {
    if (visitorsList.length === 0) {
      setTauxFidelisation(0);
      return;
    }

    let totalPresences = 0;
    visitorsList.forEach(visitor => {
      const allPresences = [...(visitor.presences_dimanche || []), ...(visitor.presences_jeudi || [])];
      totalPresences += allPresences.filter(p => p.present === true).length;
    });

    const avgPresences = totalPresences / visitorsList.length;
    const taux = Math.round((avgPresences / 8) * 100);
    setTauxFidelisation(Math.min(taux, 100));
  };

  const getPresenceInfoForDate = (visitor, date) => {
    if (!date) return { present: null, absent: null, commentaire: '-' };
    
    const allPresences = [...(visitor.presences_dimanche || []), ...(visitor.presences_jeudi || [])];
    const presence = allPresences.find(p => p.date === date);
    
    if (!presence) return { present: null, absent: null, commentaire: '-' };
    
    return {
      present: presence.present === true ? '✅' : null,
      absent: presence.present === false ? '❌' : null,
      commentaire: presence.commentaire || '-'
    };
  };

  const handleEditPresence = (visitor) => {
    const presenceInfo = getPresenceInfoForDate(visitor, filters.date);
    setEditingVisitor(visitor);
    setEditPresence(presenceInfo.present === '✅' ? true : presenceInfo.absent === '❌' ? false : null);
    setEditComment(presenceInfo.commentaire === '-' ? '' : presenceInfo.commentaire);
    setEditDialogOpen(true);
  };

  const handleSavePresenceEdit = async () => {
    if (!editingVisitor || !filters.date) {
      toast.error('Aucune date sélectionnée');
      return;
    }

    try {
      await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/presence`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitor_id: editingVisitor.id,
            date: filters.date,
            present: editPresence,
            ville: ville,
            bergerie_month: monthNum,
            commentaire: editComment
          })
        }
      );
      
      toast.success('Présence mise à jour');
      setEditDialogOpen(false);
      loadVisitors();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const resetFilters = () => {
    setFilters({ date: '', presence: 'all', category: 'all', search: '' });
  };

  if (loading) {
    return (
      <PublicBergerieLayout guestContext={guestContext}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PublicBergerieLayout>
    );
  }

  return (
    <PublicBergerieLayout guestContext={guestContext}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Vue Tableau</h2>
            <p className="text-gray-500 mt-1">
              {filteredVisitors.length} personne(s) • Bergerie {monthNames[monthNum]}
            </p>
          </div>
        </div>

        {/* KPI Fidélisation */}
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-green-100 text-sm font-medium">Taux de Fidélisation</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={loadVisitors}
                    className="text-white hover:bg-white/20 h-8"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <h3 className="text-4xl font-bold mt-2">{tauxFidelisation}%</h3>
                <p className="text-green-100 text-sm mt-1">
                  {filters.date ? `Semaine du ${filters.date}` : 'Moyenne globale'}
                </p>
              </div>
              <TrendingUp className="h-16 w-16 opacity-20" />
            </div>
          </CardContent>
        </Card>

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Recherche</Label>
                <Input
                  placeholder="Nom..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="Nouveau Arrivant">Nouveau Arrivant</SelectItem>
                    <SelectItem value="Nouveau Converti">Nouveau Converti</SelectItem>
                    <SelectItem value="De Passage">De Passage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Présence</Label>
                <Select value={filters.presence} onValueChange={(v) => setFilters({ ...filters, presence: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Canal</th>
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
                        Aucun visiteur trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredVisitors.map((visitor) => {
                      const presenceInfo = getPresenceInfoForDate(visitor, filters.date);
                      return (
                        <tr key={visitor.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{visitor.lastname}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span>{visitor.firstname}</span>
                              {visitor.ejp && (
                                <span className="px-2 py-0.5 bg-purple-600 text-white rounded-full text-xs font-bold">EJP</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{visitor.types?.join(', ') || '-'}</td>
                          <td className="px-4 py-3 text-sm">{visitor.arrival_channel || '-'}</td>
                          {filters.date && (
                            <>
                              <td className="px-4 py-3 text-center text-lg">{presenceInfo.present || '-'}</td>
                              <td className="px-4 py-3 text-center text-lg">{presenceInfo.absent || '-'}</td>
                            </>
                          )}
                          <td className="px-4 py-3 text-sm text-gray-500 italic">{presenceInfo.commentaire}</td>
                          <td className="px-4 py-3 text-center">
                            {filters.date && (
                              <Button
                                onClick={() => handleEditPresence(visitor)}
                                variant="outline"
                                size="sm"
                                className="text-blue-600"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
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

        {/* Edit Dialog */}
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
                      className={`px-4 py-2 rounded border-2 flex items-center space-x-2 ${
                        editPresence === true
                          ? 'bg-green-500 border-green-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Présent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPresence(false)}
                      className={`px-4 py-2 rounded border-2 flex items-center space-x-2 ${
                        editPresence === false
                          ? 'bg-red-500 border-red-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-red-400'
                      }`}
                    >
                      <XCircle className="h-4 w-4" />
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
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSavePresenceEdit}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PublicBergerieLayout>
  );
};

export default PublicBergerieVisitorsTablePage;
