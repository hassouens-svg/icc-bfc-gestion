import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getVisitors, getUser, createVisitor, deleteVisitor } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const VisitorsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cityParam = searchParams.get('city');
  const user = getUser();
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCity, setFilterCity] = useState(cityParam || (user?.city || ''));
  const [filterStatus, setFilterStatus] = useState('actif');
  const [filterPromo, setFilterPromo] = useState('all');
  const [sortOrder, setSortOrder] = useState('date_arrivee'); // 'date_arrivee' ou 'date_creation'
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  
  const [newVisitor, setNewVisitor] = useState({
    firstname: '',
    lastname: '',
    city: user?.city || '',
    types: [],
    phone: '',
    email: '',
    address: '',
    arrival_channel: '',
    age_range: '',
    visit_date: new Date().toISOString().split('T')[0],
  });

  // Bulk ancien visitors
  const [bulkVisitors, setBulkVisitors] = useState([
    { firstname: '', lastname: '', phone: '', visit_date: new Date().toISOString().split('T')[0], types: ['Nouveau Arrivant'] }
  ]);

  const visitorTypes = ['Nouveau Arrivant', 'Nouveau Converti', 'De Passage'];
  const arrivalChannels = ['Evangelisation', 'Réseaux sociaux', 'Invitation par un membre (hors evangelisation)', 'Par soi même'];
  const ageRanges = ['13-18 ans', '18-25 ans', '25-35 ans', '35-50 ans', '+50 ans'];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadVisitors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Filter visitors based on search term, date, and status
    let filtered = [...visitors];
    
    // Filter by search term
    // Filter by city
    if (filterCity && filterCity !== 'all') {
      filtered = filtered.filter(v => v.city === filterCity);
    }
    
    // Filter by promo (assigned_month)
    if (filterPromo && filterPromo !== 'all') {
      filtered = filtered.filter(v => v.assigned_month === filterPromo);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(v =>
        (v.firstname && v.firstname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.lastname && v.lastname.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filter by status (for accueil role)
    const currentUser = getUser();
    if (currentUser?.role === 'accueil') {
      if (filterStatus === 'actif') {
        filtered = filtered.filter(v => !v.tracking_stopped);
      } else if (filterStatus === 'arrete') {
        filtered = filtered.filter(v => v.tracking_stopped);
      }
      
      // Filter by date
      if (filterDate) {
        filtered = filtered.filter(v => v.visit_date && v.visit_date === filterDate);
      }
    }
    
    // Sort based on sortOrder
    if (sortOrder === 'date_arrivee') {
      // Tri par date d'arrivée (visit_date) - plus récent en premier
      filtered.sort((a, b) => {
        const dateA = new Date(a.visit_date || 0);
        const dateB = new Date(b.visit_date || 0);
        return dateB - dateA;
      });
    } else if (sortOrder === 'date_creation') {
      // Tri par ordre de création (created_at) - plus récent en premier
      filtered.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });
    }
    
    setFilteredVisitors(filtered);
  }, [searchTerm, filterDate, filterCity, filterStatus, filterPromo, visitors, sortOrder]);

  const loadVisitors = async () => {
    try {
      // Load all visitors including stopped ones for accueil role
      const includeStopped = user?.role === 'accueil';
      const data = await getVisitors(includeStopped);
      setVisitors(data);
      // Don't set filteredVisitors here, let useEffect handle it
    } catch (error) {
      console.error('Erreur lors du chargement des visiteurs:', error);
      // Don't show error toast to avoid infinite loop
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeToggle = (type) => {
    setNewVisitor(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const handleCreateVisitor = async (e) => {
    e.preventDefault();
    
    if (!newVisitor.firstname || !newVisitor.lastname || newVisitor.types.length === 0 || !newVisitor.arrival_channel || !newVisitor.phone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await createVisitor(newVisitor);
      toast.success('Visiteur créé avec succès!');
      setIsDialogOpen(false);
      setNewVisitor({
        firstname: '',
        lastname: '',
        city: user?.city || '',
        types: [],
        phone: '',
        email: '',
        address: '',
        arrival_channel: '',
        age_range: '',
        visit_date: new Date().toISOString().split('T')[0],
      });
      loadVisitors();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    }
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

  const addBulkRow = () => {
    if (bulkVisitors.length < 40) {
      setBulkVisitors([...bulkVisitors, { 
        firstname: '', 
        lastname: '', 
        phone: '', 
        visit_date: new Date().toISOString().split('T')[0], 
        types: ['Nouveau Arrivant'] 
      }]);
    } else {
      toast.error('Maximum 40 visiteurs à la fois');
    }
  };

  const removeBulkRow = (index) => {
    setBulkVisitors(bulkVisitors.filter((_, i) => i !== index));
  };

  const updateBulkRow = (index, field, value) => {
    const updated = [...bulkVisitors];
    updated[index][field] = value;
    setBulkVisitors(updated);
  };

  const handleBulkCreate = async (e) => {
    e.preventDefault();
    
    // Validation
    const invalidRows = bulkVisitors.filter(v => !v.firstname || !v.lastname || !v.phone);
    if (invalidRows.length > 0) {
      toast.error('Tous les champs (Prénom, Nom, Téléphone) sont obligatoires');
      return;
    }

    try {
      const visitorsToCreate = bulkVisitors.map(v => ({
        firstname: v.firstname,
        lastname: v.lastname,
        city: user?.city || '',
        types: v.types,
        phone: v.phone,
        email: 'ancien@egliseconnect.com',
        address: '',
        arrival_channel: 'Ancien Visiteur',
        visit_date: v.visit_date,
        is_ancien: true
      }));

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/visitors/bulk-ancien`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(visitorsToCreate)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création en masse');
      }

      const data = await response.json();
      
      // Close dialog and reset form first
      setIsBulkDialogOpen(false);
      setBulkVisitors([{ firstname: '', lastname: '', phone: '', visit_date: new Date().toISOString().split('T')[0], types: ['Nouveau Arrivant'] }]);
      
      // Show success message
      toast.success(data.message || 'Visiteurs créés avec succès!');
      
      // Reload visitors immediately
      await loadVisitors();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la création en masse');
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

  // For "accueil" role, show simplified list
  if (user?.role === 'accueil') {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900" data-testid="visitors-title">Liste des nouveaux arrivants et nouveaux convertiss</h2>
            <p className="text-gray-500 mt-1">Accueil et Intégration - Consultation uniquement</p>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* City Filter - Only for super_admin and pasteur */}
                {['super_admin', 'pasteur'].includes(user?.role) && (
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Select value={filterCity} onValueChange={setFilterCity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les villes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les villes</SelectItem>
                        <SelectItem value="Dijon">Dijon</SelectItem>
                        <SelectItem value="Rome">Rome</SelectItem>
                        <SelectItem value="Chalon-sur-Saone">Chalon-sur-Saone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Search */}
                <div className="space-y-2">
                  <Label>Recherche</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nom ou prénom..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="search-input"
                    />
                  </div>
                </div>

                {/* Promo Filter - Show for roles that can see multiple promos */}
                {['super_admin', 'pasteur', 'superviseur_promos', 'responsable_eglise'].includes(user?.role) && (
                  <div className="space-y-2">
                    <Label>Promo</Label>
                    <Select value={filterPromo} onValueChange={setFilterPromo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les promos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les promos</SelectItem>
                        {Array.from(new Set(visitors.map(v => v.assigned_month).filter(Boolean)))
                          .sort((a, b) => b.localeCompare(a))
                          .map(month => {
                            const [year, monthNum] = month.split('-');
                            const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
                            const monthName = monthNames[parseInt(monthNum) - 1];
                            return (
                              <SelectItem key={month} value={month}>
                                {monthName} {year}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Date Filter */}
                <div className="space-y-2">
                  <Label>Date d'arrivée</Label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actif">Actifs</SelectItem>
                      <SelectItem value="arrete">Arrêtés</SelectItem>
                      <SelectItem value="tous">Tous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order Filter */}
                <div className="space-y-2">
                  <Label>Tri</Label>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_arrivee">Date d'arrivée (récent)</SelectItem>
                      <SelectItem value="date_creation">Ordre d'enregistrement (récent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nouveaux Arrivants ({filteredVisitors.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Nom</th>
                      <th className="text-left py-3 px-4">Prénom</th>
                      <th className="text-left py-3 px-4">Canal d'arrivée</th>
                      <th className="text-left py-3 px-4">Date d'arrivée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisitors.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-gray-500 py-8">Aucun nouveaux arrivants et nouveaux convertis trouvé</td>
                      </tr>
                    ) : (
                      filteredVisitors.map((visitor) => (
                        <tr
                          key={visitor.id}
                          className="border-b hover:bg-gray-50"
                          data-testid={`visitor-item-${visitor.id}`}
                        >
                          <td className="py-3 px-4 font-medium">{visitor.lastname}</td>
                          <td className="py-3 px-4">{visitor.firstname}</td>
                          <td className="py-3 px-4">{visitor.arrival_channel}</td>
                          <td className="py-3 px-4">
                            {visitor.visit_date ? new Date(visitor.visit_date).toLocaleDateString('fr-FR') : '-'}
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
      </Layout>
    );
  }

  // Full view for other roles
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900" data-testid="visitors-title">Nouveaux Arrivants</h2>
            <p className="text-gray-500 mt-1">Gérez vos nouveaux arrivants et nouveaux convertiss</p>
          </div>
          {(user?.role !== 'accueil') && (
            <div className="flex gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="add-visitor-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Visiteur
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajouter un nouveau nouveaux arrivants et nouveaux convertis</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateVisitor} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-firstname">Prénom *</Label>
                      <Input
                        id="new-firstname"
                        value={newVisitor.firstname}
                        onChange={(e) => setNewVisitor({...newVisitor, firstname: e.target.value})}
                        data-testid="new-firstname-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-lastname">Nom *</Label>
                      <Input
                        id="new-lastname"
                        value={newVisitor.lastname}
                        onChange={(e) => setNewVisitor({...newVisitor, lastname: e.target.value})}
                        data-testid="new-lastname-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Type de nouveaux arrivants et nouveaux convertis *</Label>
                    <div className="space-y-2">
                      {visitorTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`new-${type}`}
                            checked={newVisitor.types.includes(type)}
                            onCheckedChange={() => handleTypeToggle(type)}
                          />
                          <Label htmlFor={`new-${type}`} className="font-normal cursor-pointer">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-phone">Téléphone *</Label>
                      <Input
                        id="new-phone"
                        type="tel"
                        required
                        value={newVisitor.phone}
                        onChange={(e) => setNewVisitor({...newVisitor, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-email">Email (optionnel)</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newVisitor.email}
                        onChange={(e) => setNewVisitor({...newVisitor, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-address">Adresse (optionnel)</Label>
                    <Input
                      id="new-address"
                      type="text"
                      value={newVisitor.address}
                      onChange={(e) => setNewVisitor({...newVisitor, address: e.target.value})}
                      placeholder="Adresse complète"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-channel">Canal d'arrivée *</Label>
                    <Select value={newVisitor.arrival_channel} onValueChange={(value) => setNewVisitor({...newVisitor, arrival_channel: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                      <SelectContent>
                        {arrivalChannels.map((channel) => (
                          <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-age-range">Tranche d'âge</Label>
                    <Select 
                      value={newVisitor.age_range}
                      onValueChange={(value) => setNewVisitor({...newVisitor, age_range: value})}
                    >
                      <SelectTrigger id="new-age-range">
                        <SelectValue placeholder="Sélectionnez une tranche d'âge" />
                      </SelectTrigger>
                      <SelectContent>
                        {ageRanges.map((range) => (
                          <SelectItem key={range} value={range}>{range}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-visit-date">Date de visite *</Label>
                    <Input
                      id="new-visit-date"
                      type="date"
                      value={newVisitor.visit_date}
                      onChange={(e) => setNewVisitor({...newVisitor, visit_date: e.target.value})}
                    />
                  </div>

                  <Button type="submit" className="w-full" data-testid="submit-new-visitor">
                    Créer le nouveaux arrivants et nouveaux convertis
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            
            {/* Ancien Visiteur Dialog */}
            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Ancien Visiteur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajouter des Anciens Visiteurs (jusqu'à 40)</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleBulkCreate} className="space-y-4">
                  <div className="max-h-96 overflow-y-auto border rounded p-2">
                    {bulkVisitors.map((visitor, index) => (
                      <div key={index} className="grid grid-cols-6 gap-2 mb-2 items-center border-b pb-2">
                        <Input
                          placeholder="Prénom *"
                          value={visitor.firstname}
                          onChange={(e) => updateBulkRow(index, 'firstname', e.target.value)}
                          required
                        />
                        <Input
                          placeholder="Nom *"
                          value={visitor.lastname}
                          onChange={(e) => updateBulkRow(index, 'lastname', e.target.value)}
                          required
                        />
                        <Input
                          placeholder="Téléphone *"
                          value={visitor.phone}
                          onChange={(e) => updateBulkRow(index, 'phone', e.target.value)}
                          required
                        />
                        <Input
                          type="date"
                          value={visitor.visit_date}
                          onChange={(e) => updateBulkRow(index, 'visit_date', e.target.value)}
                        />
                        <Select 
                          value={visitor.types?.[0] || 'Nouveau Arrivant'} 
                          onValueChange={(value) => updateBulkRow(index, 'types', [value])}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Nouveau Arrivant">NA</SelectItem>
                            <SelectItem value="Nouveau Converti">NC</SelectItem>
                            <SelectItem value="De Passage">DP</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeBulkRow(index)}
                          disabled={bulkVisitors.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={addBulkRow}
                      disabled={bulkVisitors.length >= 40}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une ligne ({bulkVisitors.length}/40)
                    </Button>
                    <Button type="submit">
                      Enregistrer tous ({bulkVisitors.length})
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
        </div>

        {/* Visitors List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des nouveaux arrivants et nouveaux convertiss ({filteredVisitors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredVisitors.length === 0 ? (
                <p className="text-center text-gray-500 py-8" data-testid="no-visitors">Aucun nouveaux arrivants et nouveaux convertis trouvé</p>
              ) : (
                filteredVisitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition"
                    data-testid={`visitor-item-${visitor.id}`}
                  >
                    <div className="flex-1" onClick={() => navigate(`/visitor/${visitor.id}`)} className="cursor-pointer">
                      <p className="font-medium text-lg">{visitor.firstname} {visitor.lastname}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {visitor.types.map((type, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {type}
                          </span>
                        ))}
                        {visitor.ejp && (
                          <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-bold">
                            EJP
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {visitor.arrival_channel} • {visitor.visit_date}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {['super_admin', 'responsable_eglise', 'admin', 'promotions', 'referent'].includes(user.role) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVisitor(visitor);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
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

export default VisitorsPage;
