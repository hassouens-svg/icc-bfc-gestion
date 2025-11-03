import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getVisitors, getUser, createVisitor } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';

const VisitorsPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newVisitor, setNewVisitor] = useState({
    firstname: '',
    lastname: '',
    city: user?.city || '',
    types: [],
    phone: '',
    email: '',
    arrival_channel: '',
    visit_date: new Date().toISOString().split('T')[0],
  });

  const visitorTypes = ['Nouveau Arrivant', 'Nouveau Converti', 'De Passage'];
  const arrivalChannels = ['Evangelisation', 'Réseaux sociaux', 'Invitation par un membre (hors evangelisation)', 'Par soi même'];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadVisitors();
  }, [user, navigate]);

  useEffect(() => {
    // Filter visitors based on search term
    if (searchTerm) {
      const filtered = visitors.filter(v =>
        v.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.lastname.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVisitors(filtered);
    } else {
      setFilteredVisitors(visitors);
    }
  }, [searchTerm, visitors]);

  const loadVisitors = async () => {
    try {
      const data = await getVisitors();
      setVisitors(data);
      setFilteredVisitors(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des visiteurs');
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
    
    if (!newVisitor.firstname || !newVisitor.lastname || newVisitor.types.length === 0 || !newVisitor.arrival_channel) {
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
        arrival_channel: '',
        visit_date: new Date().toISOString().split('T')[0],
      });
      loadVisitors();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
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
            <h2 className="text-3xl font-bold text-gray-900" data-testid="visitors-title">Liste des visiteurs</h2>
            <p className="text-gray-500 mt-1">Accueil et Intégration - Consultation uniquement</p>
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

          <Card>
            <CardHeader>
              <CardTitle>Visiteurs ({filteredVisitors.length})</CardTitle>
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
                        <td colSpan="4" className="text-center text-gray-500 py-8">Aucun visiteur trouvé</td>
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
            <h2 className="text-3xl font-bold text-gray-900" data-testid="visitors-title">Visiteurs</h2>
            <p className="text-gray-500 mt-1">Gérez vos visiteurs</p>
          </div>
          {(user?.role !== 'accueil') && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-visitor-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Visiteur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajouter un nouveau visiteur</DialogTitle>
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
                    <Label>Type de visiteur *</Label>
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
                      <Label htmlFor="new-phone">Téléphone</Label>
                      <Input
                        id="new-phone"
                        type="tel"
                        value={newVisitor.phone}
                        onChange={(e) => setNewVisitor({...newVisitor, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-email">Email</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newVisitor.email}
                        onChange={(e) => setNewVisitor({...newVisitor, email: e.target.value})}
                      />
                    </div>
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
                    <Label htmlFor="new-visit-date">Date de visite *</Label>
                    <Input
                      id="new-visit-date"
                      type="date"
                      value={newVisitor.visit_date}
                      onChange={(e) => setNewVisitor({...newVisitor, visit_date: e.target.value})}
                    />
                  </div>

                  <Button type="submit" className="w-full" data-testid="submit-new-visitor">
                    Créer le visiteur
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
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
            <CardTitle>Liste des visiteurs ({filteredVisitors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredVisitors.length === 0 ? (
                <p className="text-center text-gray-500 py-8" data-testid="no-visitors">Aucun visiteur trouvé</p>
              ) : (
                filteredVisitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => navigate(`/visitor/${visitor.id}`)}
                    data-testid={`visitor-item-${visitor.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-lg">{visitor.firstname} {visitor.lastname}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {visitor.types.map((type, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {type}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {visitor.arrival_channel} • {visitor.visit_date}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default VisitorsPage;
