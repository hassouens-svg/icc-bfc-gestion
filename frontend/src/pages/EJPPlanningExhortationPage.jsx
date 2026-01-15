import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { ArrowLeft, Calendar, User, Plus, Trash2, Edit, Save } from 'lucide-react';
import { toast } from 'sonner';

const EJPPlanningExhortationPage = () => {
  const navigate = useNavigate();
  const [planning, setPlanning] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    date: '',
    exhortateur: ''
  });

  useEffect(() => {
    loadPlanning();
  }, []);

  const loadPlanning = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ejp/planning-exhortation`);
      if (response.ok) {
        const data = await response.json();
        // Trier par date
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setPlanning(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.exhortateur) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const url = editingId 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/ejp/planning-exhortation/${editingId}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/ejp/planning-exhortation`;
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingId ? 'Modifié avec succès' : 'Ajouté avec succès');
        setShowAddDialog(false);
        setEditingId(null);
        setFormData({ date: '', exhortateur: '' });
        loadPlanning();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      date: item.date,
      exhortateur: item.exhortateur
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette programmation ?')) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ejp/planning-exhortation/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast.success('Supprimé');
        loadPlanning();
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openAddDialog = () => {
    setEditingId(null);
    setFormData({ date: '', exhortateur: '' });
    setShowAddDialog(true);
  };

  // Grouper par mois
  const groupedByMonth = planning.reduce((acc, item) => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = { label: monthLabel, items: [] };
    }
    acc[monthKey].items.push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/ejp')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Planning Exhortation</h1>
                <p className="text-sm text-gray-500">EJP - Programmation des exhortateurs</p>
              </div>
            </div>
            <Button onClick={openAddDialog} className="bg-rose-600 hover:bg-rose-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          </div>
        ) : planning.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune programmation</p>
              <Button onClick={openAddDialog} className="mt-4 bg-rose-600 hover:bg-rose-700">
                Ajouter la première exhortation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByMonth).map(([key, group]) => (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg capitalize text-rose-700">
                    {group.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{formatDate(item.date)}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.exhortateur}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Ajouter/Modifier */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Modifier l\'exhortation' : 'Ajouter une exhortation'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
              {formData.date && (
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(formData.date)}
                </p>
              )}
            </div>
            <div>
              <Label>Nom de l'exhortateur</Label>
              <Input
                placeholder="Ex: Frère Paul"
                value={formData.exhortateur}
                onChange={(e) => setFormData({ ...formData, exhortateur: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} className="bg-rose-600 hover:bg-rose-700">
              <Save className="h-4 w-4 mr-2" />
              {editingId ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EJPPlanningExhortationPage;
