import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PublicBergerieLayout from '../components/PublicBergerieLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Users, Plus, Search, Phone, Mail, Calendar, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const monthNames = {
  '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
  '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
  '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
};

const PublicBergerieVisitorsPage = () => {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    visitor_type: 'Nouveau arrivant'
  });

  useEffect(() => {
    if (!ville || !monthNum) {
      navigate('/bergeries');
      return;
    }
    loadVisitors();
  }, [ville, monthNum]);

  useEffect(() => {
    const filtered = visitors.filter(v => 
      !v.tracking_stopped && 
      (`${v.firstname} ${v.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
       v.phone?.includes(searchTerm))
    );
    setFilteredVisitors(filtered);
  }, [visitors, searchTerm]);

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

  const handleAddVisitor = async () => {
    if (!newVisitor.firstname || !newVisitor.lastname) {
      toast.error('Prénom et nom requis');
      return;
    }
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/visitors/public`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newVisitor,
            city: ville,
            assigned_month: `${new Date().getFullYear()}-${monthNum}`,
            visit_date: new Date().toISOString().split('T')[0]
          })
        }
      );
      
      if (response.ok) {
        toast.success('Visiteur ajouté');
        setShowAddDialog(false);
        setNewVisitor({ firstname: '', lastname: '', phone: '', email: '', visitor_type: 'Nouveau arrivant' });
        loadVisitors();
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleUpdateDisciple = async (visitorId, newStatus) => {
    try {
      await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/disciples/${visitorId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            est_disciple: newStatus,
            date_devenu_disciple: newStatus === 'Oui' ? new Date().toISOString().split('T')[0] : null
          })
        }
      );
      toast.success('Statut mis à jour');
      loadVisitors();
    } catch (error) {
      toast.error('Erreur');
    }
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Nouveaux Arrivants</h2>
            <p className="text-gray-500 mt-1">
              {filteredVisitors.length} personne(s) • Bergerie {monthNames[monthNum]}
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Visitors List */}
        <div className="space-y-3">
          {filteredVisitors.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Aucun nouveau arrivant trouvé</p>
              </CardContent>
            </Card>
          ) : (
            filteredVisitors.map((visitor) => (
              <Card key={visitor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {visitor.firstname} {visitor.lastname}
                        </h3>
                        {visitor.ejp && (
                          <span className="px-2 py-0.5 bg-purple-600 text-white rounded-full text-xs font-bold">
                            EJP
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500">
                        {visitor.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {visitor.phone}
                          </span>
                        )}
                        {visitor.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {visitor.email}
                          </span>
                        )}
                        {visitor.visit_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {new Date(visitor.visit_date).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(visitor.types || [visitor.visitor_type]).filter(Boolean).map((type, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-4 w-4 text-gray-400" />
                        <Select
                          value={visitor.est_disciple || 'Non'}
                          onValueChange={(value) => handleUpdateDisciple(visitor.id, value)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Non">Non</SelectItem>
                            <SelectItem value="En Cours">En Cours</SelectItem>
                            <SelectItem value="Oui">Oui ✓</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un Nouveau Arrivant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prénom *</Label>
                  <Input
                    value={newVisitor.firstname}
                    onChange={(e) => setNewVisitor({ ...newVisitor, firstname: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Nom *</Label>
                  <Input
                    value={newVisitor.lastname}
                    onChange={(e) => setNewVisitor({ ...newVisitor, lastname: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input
                  value={newVisitor.phone}
                  onChange={(e) => setNewVisitor({ ...newVisitor, phone: e.target.value })}
                  placeholder="+33..."
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newVisitor.email}
                  onChange={(e) => setNewVisitor({ ...newVisitor, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={newVisitor.visitor_type}
                  onValueChange={(value) => setNewVisitor({ ...newVisitor, visitor_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nouveau arrivant">Nouveau Arrivant</SelectItem>
                    <SelectItem value="Nouveau Converti">Nouveau Converti</SelectItem>
                    <SelectItem value="De Passage">De Passage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Annuler</Button>
              <Button onClick={handleAddVisitor}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PublicBergerieLayout>
  );
};

export default PublicBergerieVisitorsPage;
