import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser, getVisitors } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { 
  Users, ArrowLeft, Calendar, TrendingUp, Plus, Target, 
  UserCheck, Phone, MessageSquare, Check, Clock, Trash2,
  BarChart3, BookOpen, Heart
} from 'lucide-react';
import { toast } from 'sonner';

const BergerieDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  
  // Récupérer les params
  const searchParams = new URLSearchParams(location.search);
  const ville = searchParams.get('ville') || user?.city || '';
  const monthNum = searchParams.get('month') || '01';
  
  const monthNames = {
    '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
    '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
    '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
  };
  
  const bergerieName = `Bergerie ${monthNames[monthNum] || monthNum}`;
  
  // States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [reproductionData, setReproductionData] = useState(null);
  const [visitors, setVisitors] = useState([]);
  
  // États pour les objectifs
  const [objectifs, setObjectifs] = useState([]);
  const [showObjectifDialog, setShowObjectifDialog] = useState(false);
  const [newObjectif, setNewObjectif] = useState({
    mois_cible: '',
    objectif_nombre: '',
    nombre_reel: ''
  });
  
  // États pour les contacts
  const [contacts, setContacts] = useState([]);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [newContact, setNewContact] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    date_contact: new Date().toISOString().split('T')[0],
    type_contact: 'Evangelisation',
    precision_autres: '',
    statut: '',
    notes: ''
  });
  
  // États pour les disciples
  const [disciples, setDisciples] = useState({});

  useEffect(() => {
    loadAllData();
  }, [ville, monthNum]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Charger toutes les données de reproduction
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/reproduction/${ville}/${monthNum}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setReproductionData(data);
        setVisitors(data.visitors || []);
        setObjectifs(data.objectifs || []);
        setContacts(data.contacts || []);
        
        // Créer le map des disciples
        const disciplesMap = {};
        data.visitors.forEach(v => {
          disciplesMap[v.id] = v.est_disciple || 'Non';
        });
        setDisciples(disciplesMap);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // === GESTION DES OBJECTIFS ===
  const handleSaveObjectif = async () => {
    if (!newObjectif.mois_cible || !newObjectif.objectif_nombre) {
      toast.error('Veuillez remplir le mois et l\'objectif');
      return;
    }
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/objectifs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            bergerie_month: monthNum,
            ville: ville,
            annee: new Date().getFullYear(),
            mois_cible: newObjectif.mois_cible,
            objectif_nombre: parseInt(newObjectif.objectif_nombre),
            nombre_reel: newObjectif.nombre_reel ? parseInt(newObjectif.nombre_reel) : null
          })
        }
      );
      
      if (response.ok) {
        toast.success('Objectif enregistré');
        setShowObjectifDialog(false);
        setNewObjectif({ mois_cible: '', objectif_nombre: '', nombre_reel: '' });
        loadAllData();
      } else {
        throw new Error('Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  // === GESTION DES CONTACTS ===
  const handleSaveContact = async () => {
    if (!newContact.nom || !newContact.prenom) {
      toast.error('Veuillez remplir le nom et prénom');
      return;
    }
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/contacts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            bergerie_month: monthNum,
            ville: ville,
            ...newContact
          })
        }
      );
      
      if (response.ok) {
        toast.success('Contact ajouté');
        setShowContactDialog(false);
        setNewContact({
          nom: '',
          prenom: '',
          telephone: '',
          date_contact: new Date().toISOString().split('T')[0],
          type_contact: 'Evangelisation',
          precision_autres: '',
          statut: '',
          notes: ''
        });
        loadAllData();
      } else {
        throw new Error('Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Supprimer ce contact ?')) return;
    
    try {
      await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/contacts/${contactId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      toast.success('Contact supprimé');
      loadAllData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // === GESTION DES DISCIPLES ===
  const handleUpdateDisciple = async (visitorId, newStatus) => {
    try {
      await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/disciples/${visitorId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            est_disciple: newStatus,
            date_devenu_disciple: newStatus === 'Oui' ? new Date().toISOString().split('T')[0] : null
          })
        }
      );
      
      setDisciples(prev => ({ ...prev, [visitorId]: newStatus }));
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // Générer les mois pour les objectifs
  const generateMonths = () => {
    const months = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year <= currentYear + 1; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        months.push({
          value: `${year}-${monthStr}`,
          label: `${monthNames[monthStr]} ${year}`
        });
      }
    }
    return months;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  const stats = reproductionData?.stats || {};

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{bergerieName}</h1>
            <p className="text-gray-500 mt-1">{ville} - Tableau de bord</p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/bergeries?ville=${ville}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Toutes les Bergeries
          </Button>
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="arrivants">Nouveaux Arrivants</TabsTrigger>
            <TabsTrigger value="tableau">Vue Tableau</TabsTrigger>
            <TabsTrigger value="reproduction" className="bg-green-50 text-green-700">
              🌱 Reproduction
            </TabsTrigger>
          </TabsList>

          {/* === ONGLET DASHBOARD === */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Total Personnes Reçues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.total_recus || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    Devenus Disciples
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.total_disciples_oui || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    En Cours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{stats.total_disciples_en_cours || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4 text-purple-500" />
                    Évangélisés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats.total_evangelises || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="h-16 bg-blue-600 hover:bg-blue-700"
                    onClick={() => navigate(`/marquer-presences?bergerie=${monthNum}&ville=${ville}`)}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Marquer Présences
                  </Button>
                  <Button 
                    className="h-16 bg-green-600 hover:bg-green-700"
                    onClick={() => setActiveTab('reproduction')}
                  >
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Voir Reproduction
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-16"
                    onClick={() => setActiveTab('arrivants')}
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Voir les Arrivants
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ONGLET NOUVEAUX ARRIVANTS === */}
          <TabsContent value="arrivants" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Nouveaux Arrivants ({visitors.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {visitors.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Aucun nouveau arrivant</p>
                  ) : (
                    visitors.map((visitor) => (
                      <div 
                        key={visitor.id}
                        className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/visitor/${visitor.id}`)}
                      >
                        <div>
                          <p className="font-medium">{visitor.firstname} {visitor.lastname}</p>
                          <p className="text-sm text-gray-500">
                            {visitor.phone} • {visitor.visit_date}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            disciples[visitor.id] === 'Oui' ? 'bg-green-100 text-green-700' :
                            disciples[visitor.id] === 'En Cours' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {disciples[visitor.id] === 'Oui' ? '✅ Disciple' : 
                             disciples[visitor.id] === 'En Cours' ? '⏳ En cours' : 
                             '➖ Non'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ONGLET VUE TABLEAU === */}
          <TabsContent value="tableau" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vue Tableau - Suivi des Présences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4">Nom</th>
                        <th className="text-left py-3 px-4">Prénom</th>
                        <th className="text-left py-3 px-4">Téléphone</th>
                        <th className="text-center py-3 px-4">Statut Disciple</th>
                        <th className="text-left py-3 px-4">Date Arrivée</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.map((visitor) => (
                        <tr key={visitor.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{visitor.lastname}</td>
                          <td className="py-3 px-4">{visitor.firstname}</td>
                          <td className="py-3 px-4">{visitor.phone || '-'}</td>
                          <td className="py-3 px-4">
                            <Select
                              value={disciples[visitor.id] || 'Non'}
                              onValueChange={(value) => handleUpdateDisciple(visitor.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Non">Non</SelectItem>
                                <SelectItem value="En Cours">En Cours</SelectItem>
                                <SelectItem value="Oui">Oui</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-4">
                            {visitor.visit_date ? new Date(visitor.visit_date).toLocaleDateString('fr-FR') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ONGLET REPRODUCTION (NOUVEAU) === */}
          <TabsContent value="reproduction" className="space-y-6">
            {/* Section Objectifs de Multiplication */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Objectifs de Multiplication
                  </span>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setShowObjectifDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter Objectif
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Personnes reçues initialement: <strong className="text-green-700">{stats.total_recus || 0}</strong>
                </p>
                
                {objectifs.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    Aucun objectif défini. Cliquez sur "Ajouter Objectif" pour commencer.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Mois Cible</th>
                          <th className="text-center py-2 px-3">Objectif</th>
                          <th className="text-center py-2 px-3">Réel</th>
                          <th className="text-center py-2 px-3">% Atteinte</th>
                        </tr>
                      </thead>
                      <tbody>
                        {objectifs.map((obj) => {
                          const [year, month] = (obj.mois_cible || '').split('-');
                          const pourcentage = obj.nombre_reel && obj.objectif_nombre 
                            ? Math.round((obj.nombre_reel / obj.objectif_nombre) * 100) 
                            : 0;
                          return (
                            <tr key={obj.id} className="border-b">
                              <td className="py-2 px-3">{monthNames[month]} {year}</td>
                              <td className="text-center py-2 px-3 font-bold">{obj.objectif_nombre}</td>
                              <td className="text-center py-2 px-3">
                                <Input
                                  type="number"
                                  value={obj.nombre_reel || ''}
                                  className="w-20 text-center mx-auto"
                                  onChange={async (e) => {
                                    const newValue = parseInt(e.target.value) || null;
                                    try {
                                      await fetch(
                                        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/objectifs/${obj.id}`,
                                        {
                                          method: 'PUT',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                                          },
                                          body: JSON.stringify({
                                            ...obj,
                                            bergerie_month: monthNum,
                                            ville: ville,
                                            annee: parseInt(year),
                                            nombre_reel: newValue
                                          })
                                        }
                                      );
                                      loadAllData();
                                    } catch (error) {
                                      toast.error('Erreur');
                                    }
                                  }}
                                />
                              </td>
                              <td className="text-center py-2 px-3">
                                <span className={`px-2 py-1 rounded text-sm font-bold ${
                                  pourcentage >= 100 ? 'bg-green-100 text-green-700' :
                                  pourcentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {pourcentage}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Suivi Disciples */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  Suivi des Disciples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.total_disciples_oui || 0}</p>
                    <p className="text-sm text-gray-600">Disciples (Oui)</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-orange-600">{stats.total_disciples_en_cours || 0}</p>
                    <p className="text-sm text-gray-600">En Cours</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-600">
                      {(stats.total_recus || 0) - (stats.total_disciples_oui || 0) - (stats.total_disciples_en_cours || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Non encore</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 italic">
                  Pour modifier le statut d'un disciple, allez dans l'onglet "Vue Tableau"
                </p>
              </CardContent>
            </Card>

            {/* Section Évangélisation / Contacts */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-purple-600" />
                    Personnes Contactées (Évangélisation & Autres)
                  </span>
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => setShowContactDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    Aucun contact enregistré. Cliquez sur "Ajouter" pour enregistrer une évangélisation.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{contact.prenom} {contact.nom}</p>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              contact.type_contact === 'Evangelisation' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {contact.type_contact}
                              {contact.type_contact === 'Autres' && contact.precision_autres && 
                                ` (${contact.precision_autres})`
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            {contact.telephone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {contact.telephone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(contact.date_contact).toLocaleDateString('fr-FR')}
                            </span>
                            {contact.statut && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                {contact.statut}
                              </span>
                            )}
                          </div>
                          {contact.notes && (
                            <p className="text-sm text-gray-600 mt-1 italic">{contact.notes}</p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Ajouter Objectif */}
        <Dialog open={showObjectifDialog} onOpenChange={setShowObjectifDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un Objectif</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Mois Cible</Label>
                <Select
                  value={newObjectif.mois_cible}
                  onValueChange={(v) => setNewObjectif(prev => ({ ...prev, mois_cible: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un mois" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateMonths().map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Objectif (nombre de personnes)</Label>
                <Input
                  type="number"
                  value={newObjectif.objectif_nombre}
                  onChange={(e) => setNewObjectif(prev => ({ ...prev, objectif_nombre: e.target.value }))}
                  placeholder="Ex: 15"
                />
              </div>
              <div>
                <Label>Nombre Réel (optionnel)</Label>
                <Input
                  type="number"
                  value={newObjectif.nombre_reel}
                  onChange={(e) => setNewObjectif(prev => ({ ...prev, nombre_reel: e.target.value }))}
                  placeholder="Laisser vide si pas encore connu"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowObjectifDialog(false)}>Annuler</Button>
              <Button onClick={handleSaveObjectif} className="bg-green-600 hover:bg-green-700">Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Ajouter Contact */}
        <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Ajouter une Personne Contactée</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prénom *</Label>
                  <Input
                    value={newContact.prenom}
                    onChange={(e) => setNewContact(prev => ({ ...prev, prenom: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Nom *</Label>
                  <Input
                    value={newContact.nom}
                    onChange={(e) => setNewContact(prev => ({ ...prev, nom: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input
                  value={newContact.telephone}
                  onChange={(e) => setNewContact(prev => ({ ...prev, telephone: e.target.value }))}
                />
              </div>
              <div>
                <Label>Date du Contact</Label>
                <Input
                  type="date"
                  value={newContact.date_contact}
                  onChange={(e) => setNewContact(prev => ({ ...prev, date_contact: e.target.value }))}
                />
              </div>
              <div>
                <Label>Type de Contact</Label>
                <Select
                  value={newContact.type_contact}
                  onValueChange={(v) => setNewContact(prev => ({ ...prev, type_contact: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Evangelisation">Évangélisation</SelectItem>
                    <SelectItem value="Autres">Autres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newContact.type_contact === 'Autres' && (
                <div>
                  <Label>Précision (Autres)</Label>
                  <Input
                    value={newContact.precision_autres}
                    onChange={(e) => setNewContact(prev => ({ ...prev, precision_autres: e.target.value }))}
                    placeholder="Ex: Rencontre famille, ami..."
                  />
                </div>
              )}
              <div>
                <Label>Statut</Label>
                <Select
                  value={newContact.statut}
                  onValueChange={(v) => setNewContact(prev => ({ ...prev, statut: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    <SelectItem value="Réceptif">Réceptif</SelectItem>
                    <SelectItem value="Prière de salut">Prière de salut</SelectItem>
                    <SelectItem value="Venu à l'église">Venu à l'église</SelectItem>
                    <SelectItem value="Intégré">Intégré</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  value={newContact.notes}
                  onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes ou commentaires..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowContactDialog(false)}>Annuler</Button>
              <Button onClick={handleSaveContact} className="bg-purple-600 hover:bg-purple-700">Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default BergerieDashboardPage;
