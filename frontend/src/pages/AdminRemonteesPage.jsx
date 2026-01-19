import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowLeft, MessageSquare, User, Building2, Calendar, Eye, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminRemonteesPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [remontees, setRemontees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVille, setSelectedVille] = useState('all');
  const [cities, setCities] = useState([]);
  const [selectedRemontee, setSelectedRemontee] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Vérifier les permissions
  const canAccess = user?.role && ['super_admin', 'pasteur'].includes(user.role);

  useEffect(() => {
    if (!canAccess) {
      navigate('/login');
      return;
    }
    loadCities();
    loadRemontees();
  }, [canAccess, navigate]);

  const loadCities = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cities`);
      const data = await response.json();
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadRemontees = async () => {
    try {
      const villeParam = selectedVille !== 'all' ? `?ville=${selectedVille}` : '';
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/remontees${villeParam}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setRemontees(data);
      }
    } catch (error) {
      console.error('Error loading remontees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      loadRemontees();
    }
  }, [selectedVille]);

  const markAsRead = async (id) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/remontees/${id}/read`,
        { 
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
        }
      );
      if (response.ok) {
        toast.success('Marqué comme lu');
        loadRemontees();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const deleteRemontee = async (id) => {
    if (!window.confirm('Supprimer cette remontée ?')) return;
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/remontees/${id}`,
        { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
        }
      );
      if (response.ok) {
        toast.success('Supprimé');
        loadRemontees();
        setShowDetailDialog(false);
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = remontees.filter(r => !r.is_read).length;

  if (!canAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-indigo-600" />
                  Remontées des Stars
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-500">Inquiétudes, questions et suggestions</p>
              </div>
            </div>
            
            <Select value={selectedVille} onValueChange={setSelectedVille}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {cities.map((city, idx) => {
                  const cityName = typeof city === 'object' ? city.name : city;
                  return (
                    <SelectItem key={idx} value={cityName}>{cityName}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : remontees.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune remontée pour le moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {remontees.map((remontee) => (
              <Card 
                key={remontee.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !remontee.is_read ? 'border-l-4 border-l-indigo-500 bg-indigo-50/30' : ''
                }`}
                onClick={() => {
                  setSelectedRemontee(remontee);
                  setShowDetailDialog(true);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          remontee.is_anonyme ? 'bg-gray-200' : 'bg-indigo-100'
                        }`}>
                          <User className={`h-5 w-5 ${remontee.is_anonyme ? 'text-gray-500' : 'text-indigo-600'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {remontee.is_anonyme ? 'Anonyme' : `${remontee.prenom} ${remontee.nom}`}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{remontee.ville}</span>
                            {remontee.departement && remontee.departement !== 'Non spécifié' && (
                              <>
                                <span>•</span>
                                <span>{remontee.departement}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">{remontee.message}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">{formatDate(remontee.created_at)}</p>
                      {!remontee.is_read && (
                        <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                          Nouveau
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Détail */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              Détail de la remontée
            </DialogTitle>
          </DialogHeader>
          {selectedRemontee && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedRemontee.is_anonyme ? 'bg-gray-200' : 'bg-indigo-100'
                }`}>
                  <User className={`h-6 w-6 ${selectedRemontee.is_anonyme ? 'text-gray-500' : 'text-indigo-600'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedRemontee.is_anonyme ? 'Anonyme' : `${selectedRemontee.prenom} ${selectedRemontee.nom}`}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {selectedRemontee.ville}
                    </span>
                    {selectedRemontee.departement && selectedRemontee.departement !== 'Non spécifié' && (
                      <span className="text-indigo-600">{selectedRemontee.departement}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(selectedRemontee.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-white border rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedRemontee.message}</p>
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                {!selectedRemontee.is_read && (
                  <Button 
                    onClick={() => markAsRead(selectedRemontee.id)} 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marquer comme lu
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => deleteRemontee(selectedRemontee.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRemonteesPage;
