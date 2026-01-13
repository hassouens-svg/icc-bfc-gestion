import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PublicBergerieLayout from '../components/PublicBergerieLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../components/ui/dialog';
import { Plus, Search, Trash2 } from 'lucide-react';
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
  
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkVisitors, setBulkVisitors] = useState([
    { firstname: '', lastname: '', phone: '', visit_date: new Date().toISOString().split('T')[0], types: ['Nouveau Arrivant'] }
  ]);

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

  const handleDeleteVisitor = async (visitorId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce visiteur ?')) return;
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/visitors/public/${visitorId}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        toast.success('Visiteur supprimé');
        loadVisitors();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const addBulkRow = () => {
    if (bulkVisitors.length < 40) {
      setBulkVisitors([...bulkVisitors, { 
        firstname: '', lastname: '', phone: '', 
        visit_date: new Date().toISOString().split('T')[0], 
        types: ['Nouveau Arrivant'] 
      }]);
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
    const validVisitors = bulkVisitors.filter(v => v.firstname && v.lastname);
    
    if (validVisitors.length === 0) {
      toast.error('Veuillez remplir au moins un visiteur');
      return;
    }

    try {
      for (const visitor of validVisitors) {
        await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/visitors/public`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...visitor,
              city: ville,
              assigned_month: `${new Date().getFullYear()}-${monthNum}`,
              arrival_channel: 'Ancien Visiteur'
            })
          }
        );
      }
      
      toast.success(`${validVisitors.length} visiteur(s) ajouté(s)`);
      setIsBulkDialogOpen(false);
      setBulkVisitors([{ firstname: '', lastname: '', phone: '', visit_date: new Date().toISOString().split('T')[0], types: ['Nouveau Arrivant'] }]);
      loadVisitors();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
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
        {/* Header - identique à VisitorsPage.jsx */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Nouveaux Arrivants</h2>
            <p className="text-gray-500 mt-1">Gérez vos nouveaux arrivants et nouveaux convertis</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une personne
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajouter des personnes (jusqu'à 40)</DialogTitle>
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
                          placeholder="Téléphone"
                          value={visitor.phone}
                          onChange={(e) => updateBulkRow(index, 'phone', e.target.value)}
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
        </div>

        {/* Filters - identique à VisitorsPage.jsx */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Recherche</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nom ou prénom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visitors List - identique à VisitorsPage.jsx avec icône poubelle */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des nouveaux arrivants et nouveaux convertis ({filteredVisitors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredVisitors.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun nouveaux arrivants et nouveaux convertis trouvé</p>
              ) : (
                filteredVisitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div 
                      className="flex-1 cursor-pointer" 
                      onClick={() => navigate(`/bergerie/visitor/${visitor.id}?ville=${encodeURIComponent(ville)}&month=${monthNum}`)}
                    >
                      <div className="flex items-center gap-2">
                        {visitor.ejp && (
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold bg-purple-600 text-white shadow-lg flex-shrink-0" title="EJP">
                            EJP
                          </span>
                        )}
                        <p className="font-medium text-lg">{visitor.firstname} {visitor.lastname}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(visitor.types || [visitor.visitor_type]).filter(Boolean).map((type, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {type}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {visitor.arrival_channel || 'Non défini'} • {visitor.visit_date || '-'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVisitor(visitor.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicBergerieLayout>
  );
};

export default PublicBergerieVisitorsPage;
