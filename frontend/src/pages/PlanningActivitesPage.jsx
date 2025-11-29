import React, { useState, useEffect } from 'react';
import EventsLayout from '@/components/EventsLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from '@/components/ui/textarea';
import { Plus, Save, Trash2, Calendar } from 'lucide-react';

const PlanningActivitesPage = () => {
  const [activites, setActivites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [villeSelectionnee, setVilleSelectionnee] = useState('');
  const [villes, setVilles] = useState([]);
  const [user, setUser] = useState(null);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(new Date().getFullYear());
  
  const statuts = ['À venir', 'Reporté', 'Annulé', 'Fait'];
  const annees = Array.from({ length: 11 }, (_, i) => 2025 + i); // 2025-2035

  useEffect(() => {
    // Charger l'utilisateur
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    
    // Charger les villes disponibles
    loadVilles(userData);
    
    // Déterminer la ville à afficher
    const canSeeAllCities = ['super_admin', 'pasteur'].includes(userData.role);
    
    if (canSeeAllCities) {
      // Super admin et pasteur : voir sélection de ville
      const ville = localStorage.getItem('selected_ville_planning');
      if (ville) {
        setVilleSelectionnee(ville);
        loadActivites(ville);
      }
    } else {
      // Responsable d'église ou gestion_projet : voir seulement leur ville
      const userCity = userData.city;
      if (userCity) {
        setVilleSelectionnee(userCity);
        loadActivites(userCity);
      }
    }
  }, []);

  const loadVilles = async (userData) => {
    try {
      // Charger les villes depuis la collection cities
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/cities`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      if (!response.ok) {
        // Fallback si pas d'accès à l'API cities
        setVilles(['Dijon', 'Rome', 'Besançon']);
        return;
      }
      
      const data = await response.json();
      const cityNames = data.map(city => city.name).sort();
      setVilles(cityNames);
    } catch (error) {
      console.error('Erreur chargement villes:', error);
      // Fallback
      setVilles(['Dijon', 'Rome', 'Besançon']);
    }
  };

  const loadActivites = async (ville, annee = null) => {
    try {
      const year = annee || anneeSelectionnee;
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/planning/activites?ville=${ville}&annee=${year}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur chargement');
      }
      
      const data = await response.json();
      setActivites(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des activités');
    }
  };

  const handleVilleSelection = (ville) => {
    setVilleSelectionnee(ville);
    localStorage.setItem('selected_ville_planning', ville);
    loadActivites(ville, anneeSelectionnee);
  };

  const handleAnneeSelection = (annee) => {
    setAnneeSelectionnee(parseInt(annee));
    if (villeSelectionnee) {
      loadActivites(villeSelectionnee, parseInt(annee));
    }
  };
  };

  const handleAddActivite = () => {
    const today = new Date().toISOString().split('T')[0];
    const nouvelleActivite = {
      id: `temp-${Date.now()}`,
      nom: '',
      annee: anneeSelectionnee,
      semestre: 1,
      date_debut: today,
      date_fin: today,
      date: today, // Pour compatibilité
      ministeres: '',
      statut: 'À venir',
      commentaire: '',
      ville: villeSelectionnee,
      isNew: true
    };
    setActivites([nouvelleActivite, ...activites]);
    setEditingId(nouvelleActivite.id);
    setEditData(nouvelleActivite);
  };

  const handleEdit = (activite) => {
    setEditingId(activite.id);
    setEditData({ ...activite });
  };

  const handleCancel = (activite) => {
    if (activite.isNew) {
      setActivites(activites.filter(a => a.id !== activite.id));
    }
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async (activite) => {
    setLoading(true);
    try {
      const dataToSave = editingId ? editData : activite;
      
      if (activite.isNew) {
        // Créer nouvelle activité
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/planning/activites`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...dataToSave,
              id: undefined,
              isNew: undefined
            })
          }
        );
        
        if (!response.ok) {
          throw new Error('Erreur création');
        }
        
        const result = await response.json();
        toast.success('Activité créée');
        await loadActivites(villeSelectionnee);
      } else {
        // Modifier activité existante
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/planning/activites/${activite.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSave)
          }
        );
        
        if (!response.ok) {
          throw new Error('Erreur mise à jour');
        }
        
        toast.success('Activité mise à jour');
        await loadActivites(villeSelectionnee);
      }
      
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (activite) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
      return;
    }
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/planning/activites/${activite.id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur suppression');
      }
      
      toast.success('Activité supprimée');
      await loadActivites(villeSelectionnee);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleMinisteresChange = (value, add = true) => {
    if (add) {
      setEditData({
        ...editData,
        ministeres: [...(editData.ministeres || []), value]
      });
    } else {
      setEditData({
        ...editData,
        ministeres: (editData.ministeres || []).filter(m => m !== value)
      });
    }
  };

  // Calculer les statistiques d'avancement
  const calculateStats = () => {
    const total = activites.length;
    const fait = activites.filter(a => a.statut === 'Fait').length;
    const aVenir = activites.filter(a => a.statut === 'À venir').length;
    const reporte = activites.filter(a => a.statut === 'Reporté').length;
    const annule = activites.filter(a => a.statut === 'Annulé').length;
    const pourcentage = total > 0 ? Math.round((fait / total) * 100) : 0;
    
    // Activités en retard (date passée et pas fait)
    const today = new Date();
    const enRetard = activites.filter(a => {
      const dateActivite = new Date(a.date);
      return dateActivite < today && a.statut !== 'Fait';
    }).length;
    
    return { total, fait, aVenir, reporte, annule, pourcentage, enRetard };
  };

  const stats = villeSelectionnee ? calculateStats() : { total: 0, fait: 0, aVenir: 0, reporte: 0, annule: 0, pourcentage: 0, enRetard: 0 };

  // Fonction pour déterminer la couleur de la ligne
  const getRowColor = (activite) => {
    const today = new Date();
    const dateActivite = new Date(activite.date);
    
    if (activite.statut === 'Fait') {
      return 'bg-green-50'; // Vert pour fait
    } else if (dateActivite < today) {
      return 'bg-red-50'; // Rouge pour en retard
    } else if (activite.statut === 'Reporté') {
      return 'bg-yellow-50'; // Jaune pour reporté
    } else if (activite.statut === 'Annulé') {
      return 'bg-gray-100'; // Gris pour annulé
    }
    return 'bg-white'; // Blanc pour à venir
  };

  // Vérifier si l'utilisateur peut changer de ville
  const canChangeCity = user && ['super_admin', 'pasteur'].includes(user.role);

  // Si pas de ville sélectionnée ET peut changer de ville, afficher la sélection
  if (!villeSelectionnee && canChangeCity) {
    return (
      <EventsLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <h1 className="text-3xl font-bold mb-2">Planning des Activités</h1>
            <p className="text-gray-600">Sélectionnez une ville pour commencer</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {villes.map((ville) => (
              <Button
                key={ville}
                onClick={() => handleVilleSelection(ville)}
                size="lg"
                className="h-24"
              >
                {ville}
              </Button>
            ))}
          </div>
        </div>
      </EventsLayout>
    );
  }
  
  // Si pas de ville sélectionnée et ne peut pas changer (responsable), message d'erreur
  if (!villeSelectionnee) {
    return (
      <EventsLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Erreur</h1>
            <p className="text-gray-600 mt-2">Aucune ville assignée à votre compte.</p>
          </div>
        </div>
      </EventsLayout>
    );
  }

  return (
    <EventsLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Planning des Activités</h1>
            <p className="text-gray-600">Ville: {villeSelectionnee}</p>
          </div>
          <div className="flex gap-2">
            {canChangeCity && (
              <Button variant="outline" onClick={() => {
                setVilleSelectionnee('');
                localStorage.removeItem('selected_ville_planning');
              }}>
                Changer de ville
              </Button>
            )}
            <Button onClick={handleAddActivite}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle activité
            </Button>
          </div>
        </div>

        {/* Filtre Année */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <Label>Année du planning</Label>
          <Select value={anneeSelectionnee.toString()} onValueChange={handleAnneeSelection}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {annees.map((annee) => (
                <SelectItem key={annee} value={annee.toString()}>{annee}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Indicateur d'avancement */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">📊 Avancement du Planning</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Total */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            
            {/* Fait */}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{stats.fait}</div>
              <div className="text-sm text-gray-600">Fait</div>
            </div>
            
            {/* À venir */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-600">{stats.aVenir}</div>
              <div className="text-sm text-gray-600">À venir</div>
            </div>
            
            {/* Reporté */}
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{stats.reporte}</div>
              <div className="text-sm text-gray-600">Reporté</div>
            </div>
            
            {/* Annulé */}
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <div className="text-3xl font-bold text-gray-500">{stats.annule}</div>
              <div className="text-sm text-gray-600">Annulé</div>
            </div>
            
            {/* En retard */}
            <div className="text-center p-4 bg-red-100 rounded-lg">
              <div className="text-3xl font-bold text-red-700">{stats.enRetard}</div>
              <div className="text-sm text-gray-600">En retard</div>
            </div>
          </div>
          
          {/* Barre de progression */}
          <div className="mt-4 relative">
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div 
                className={`h-6 transition-all duration-500 flex items-center justify-end pr-2 ${
                  stats.pourcentage >= 80 ? 'bg-green-500' :
                  stats.pourcentage >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${stats.pourcentage}%` }}
              >
                <span className="text-white font-bold text-sm">{stats.pourcentage}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Semestre</TableHead>
                <TableHead className="w-[250px]">Nom de l'activité</TableHead>
                <TableHead className="w-[130px]">Date début</TableHead>
                <TableHead className="w-[130px]">Date fin</TableHead>
                <TableHead className="w-[200px]">Ministères</TableHead>
                <TableHead className="w-[130px]">Statut</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Aucune activité. Cliquez sur "Nouvelle activité" pour commencer.
                  </TableCell>
                </TableRow>
              ) : (
                activites.map((activite) => {
                  const isEditing = editingId === activite.id;
                  const data = isEditing ? editData : activite;
                  
                  return (
                    <TableRow key={activite.id} className={getRowColor(activite)}>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={data.nom}
                            onChange={(e) => setEditData({ ...data, nom: e.target.value })}
                            placeholder="Nom de l'activité"
                          />
                        ) : (
                          <span className="font-medium">{activite.nom}</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={data.date}
                            onChange={(e) => setEditData({ ...data, date: e.target.value })}
                          />
                        ) : (
                          new Date(activite.date).toLocaleDateString('fr-FR')
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={data.ministeres || ''}
                            onChange={(e) => setEditData({ ...data, ministeres: e.target.value })}
                            placeholder="Ex: Jeunesse, Musique"
                          />
                        ) : (
                          <span className="text-sm">{activite.ministeres || '-'}</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={data.statut}
                            onValueChange={(v) => setEditData({ ...data, statut: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statuts.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            activite.statut === 'Fait' ? 'bg-green-100 text-green-800' :
                            activite.statut === 'À venir' ? 'bg-blue-100 text-blue-800' :
                            activite.statut === 'Reporté' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {activite.statut}
                          </span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <Textarea
                            value={data.commentaire}
                            onChange={(e) => setEditData({ ...data, commentaire: e.target.value })}
                            placeholder="Commentaire..."
                            rows={2}
                          />
                        ) : (
                          <span className="text-sm text-gray-600">{activite.commentaire}</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave(activite)}
                              disabled={loading}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancel(activite)}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(activite)}
                            >
                              ✏️
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(activite)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </EventsLayout>
  );
};

export default PlanningActivitesPage;
