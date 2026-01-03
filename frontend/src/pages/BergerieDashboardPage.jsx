import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { 
  Users, ArrowLeft, Calendar, TrendingUp, Plus, Target, 
  UserCheck, Phone, Trash2, BarChart3, Heart, Table,
  UserPlus, Sprout, Edit
} from 'lucide-react';
import { toast } from 'sonner';

// Fonction pour obtenir le nom de la bergerie
const getBergerieName = (monthNum) => {
  const monthNames = {
    '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
    '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
    '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
  };
  return monthNames[monthNum] || monthNum;
};

const BergerieDashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Récupérer les params
  const ville = searchParams.get('ville') || '';
  const monthNum = searchParams.get('month') || '01';
  const currentYear = new Date().getFullYear();
  
  const monthName = getBergerieName(monthNum);
  
  // States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    total_visitors: 0, 
    total_referents: 0, 
    formation_pcnc: 0, 
    formation_au_coeur_bible: 0, 
    formation_star: 0,
    by_type: [],
    by_channel: []
  });
  const [visitors, setVisitors] = useState([]);
  const [bergers, setBergers] = useState([]);
  
  // États pour les objectifs (Reproduction)
  const [objectifs, setObjectifs] = useState([]);
  const [showObjectifDialog, setShowObjectifDialog] = useState(false);
  const [newObjectif, setNewObjectif] = useState({
    mois_cible: '',
    objectif_nombre: '',
    nombre_reel: ''
  });
  
  // États pour les contacts (Reproduction)
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
  
  // État pour ajouter un ancien visiteur
  const [showAddVisitorDialog, setShowAddVisitorDialog] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    visitor_type: 'Nouveau arrivant'
  });

  const monthNames = {
    '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
    '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
    '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
  };

  useEffect(() => {
    if (!ville || !monthNum) {
      navigate('/bergeries');
      return;
    }
    loadAllData();
  }, [ville, monthNum]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Charger les données de reproduction (utilise endpoint public)
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/reproduction/${encodeURIComponent(ville)}/${monthNum}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setVisitors(data.visitors || []);
        setObjectifs(data.objectifs || []);
        setContacts(data.contacts || []);
        setBergers(data.bergers || []);
        
        // Calculer les stats comme dans DashboardPage
        const visitorsData = data.visitors || [];
        const totalVisitors = visitorsData.filter(v => !v.tracking_stopped).length;
        const formationPcnc = visitorsData.filter(v => v.formation_pcnc).length;
        const formationBible = visitorsData.filter(v => v.formation_au_coeur_bible).length;
        const formationStar = visitorsData.filter(v => v.formation_star).length;
        
        // Grouper par type
        const byType = {};
        visitorsData.forEach(v => {
          const types = v.types || [v.visitor_type || 'Non défini'];
          types.forEach(type => {
            byType[type] = (byType[type] || 0) + 1;
          });
        });
        
        // Grouper par canal
        const byChannel = {};
        visitorsData.forEach(v => {
          const channel = v.arrival_channel || 'Non défini';
          byChannel[channel] = (byChannel[channel] || 0) + 1;
        });
        
        setStats({
          total_visitors: totalVisitors,
          total_referents: data.bergers?.length || 0,
          formation_pcnc: formationPcnc,
          formation_au_coeur_bible: formationBible,
          formation_star: formationStar,
          by_type: Object.entries(byType).map(([_id, count]) => ({ _id, count })),
          by_channel: Object.entries(byChannel).map(([_id, count]) => ({ _id, count })),
          // Stats disciples
          total_disciples_oui: data.stats?.total_disciples_oui || 0,
          total_disciples_en_cours: data.stats?.total_disciples_en_cours || 0,
          total_evangelises: data.stats?.total_evangelises || 0
        });
        
        // Créer le map des disciples
        const disciplesMap = {};
        visitorsData.forEach(v => {
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
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/objectifs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/contacts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bergerie_month: monthNum,
            ville: ville,
            ...newContact,
            statut: newContact.statut === 'none' ? '' : newContact.statut
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
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/contacts/${contactId}`,
        { method: 'DELETE' }
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
      
      setDisciples(prev => ({ ...prev, [visitorId]: newStatus }));
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // === AJOUTER ANCIEN VISITEUR ===
  const handleAddVisitor = async () => {
    if (!newVisitor.firstname || !newVisitor.lastname) {
      toast.error('Veuillez remplir le nom et prénom');
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
        setShowAddVisitorDialog(false);
        setNewVisitor({ firstname: '', lastname: '', phone: '', email: '', visitor_type: 'Nouveau arrivant' });
        loadAllData();
      } else {
        throw new Error('Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  // Générer les mois pour les objectifs
  const generateMonths = () => {
    const months = [];
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Verset biblique pour les Bergers */}
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📖</div>
              <div>
                <p className="text-sm font-semibold text-purple-800 mb-2">Jérémie 3:15</p>
                <p className="text-base italic text-gray-700 leading-relaxed">
                  "Je vous donnerai des bergers selon mon cœur, qui vous paîtront avec intelligence et avec sagesse."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Header - EXACTEMENT comme dans DashboardPage original */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-bold text-gray-900">
                Tableau de bord - {currentYear}-{monthNum}
              </h2>
            </div>
            <p className="text-gray-500 mt-1">Vue d'ensemble de votre activité</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/bergeries')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button 
              onClick={() => navigate(`/marquer-presences?ville=${encodeURIComponent(ville)}&month=${monthNum}`)} 
              className="bg-green-600 hover:bg-green-700"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Marquer les Présences
            </Button>
          </div>
        </div>

        {/* Stats Cards - EXACTEMENT comme dans DashboardPage original */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Nouveaux Arrivants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_visitors || 0}</div>
              <p className="text-xs text-muted-foreground">Nouveaux Arrivants actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bergers</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-medium text-gray-700">Saisir les responsables (max 5)</p>
                </div>
                <div className="text-sm space-y-1">
                  {bergers && bergers.length > 0 ? (
                    bergers.map((berger, idx) => (
                      <div key={idx} className="text-gray-700">
                        {idx + 1}. {berger.username || berger.firstname || 'Berger'}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 italic">Aucun responsable ajouté</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canaux</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.by_channel?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Sources d'arrivée</p>
            </CardContent>
          </Card>
        </div>

        {/* KPIs Formations - EXACTEMENT comme dans DashboardPage original */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              KPIs Formations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-blue-50">
                <p className="text-sm text-gray-600">Formation PCNC</p>
                <p className="text-3xl font-bold text-blue-600">{stats.formation_pcnc || 0}</p>
                <p className="text-xs text-gray-500 mt-1">personnes formées</p>
              </div>
              <div className="p-4 border rounded-lg bg-green-50">
                <p className="text-sm text-gray-600">Au Cœur de la Bible</p>
                <p className="text-3xl font-bold text-green-600">{stats.formation_au_coeur_bible || 0}</p>
                <p className="text-xs text-gray-500 mt-1">personnes formées</p>
              </div>
              <div className="p-4 border rounded-lg bg-purple-50">
                <p className="text-sm text-gray-600">Formation STAR</p>
                <p className="text-3xl font-bold text-purple-600">{stats.formation_star || 0}</p>
                <p className="text-xs text-gray-500 mt-1">personnes devenues stars</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides - AVEC BOUTONS SÉPARÉS */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20"
                onClick={() => setActiveTab('visitors')}
              >
                <Users className="h-6 w-6 mr-2" />
                Voir les nouveaux arrivants
              </Button>
              <Button 
                variant="outline" 
                className="h-20"
                onClick={() => navigate(`/visitors-table?promo=${monthNum}`)}
              >
                <Table className="h-6 w-6 mr-2" />
                Vue Tableau
              </Button>
              <Button 
                variant="outline" 
                className="h-20"
                onClick={() => setActiveTab('disciples')}
              >
                <UserCheck className="h-6 w-6 mr-2" />
                Suivi Disciples
              </Button>
              <Button 
                className="h-20 bg-green-600 hover:bg-green-700"
                onClick={() => setActiveTab('reproduction')}
              >
                <Sprout className="h-6 w-6 mr-2" />
                Reproduction
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Onglets pour les sections détaillées */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="visitors">Nouveaux Arrivants</TabsTrigger>
            <TabsTrigger value="disciples">Suivi Disciples</TabsTrigger>
            <TabsTrigger value="reproduction" className="bg-green-50 text-green-700 data-[state=active]:bg-green-100">
              <Sprout className="h-4 w-4 mr-1" />
              Reproduction
            </TabsTrigger>
          </TabsList>

          {/* === ONGLET DASHBOARD === */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* By Type */}
            {stats.by_type && stats.by_type.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Par type de nouveaux arrivants et nouveaux convertis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.by_type.map((item) => (
                      <div key={item._id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                        <span className="font-medium">{item._id}</span>
                        <span className="text-gray-600">{item.count} personne(s)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === ONGLET NOUVEAUX ARRIVANTS === */}
          <TabsContent value="visitors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Nouveaux Arrivants ({visitors.length})</span>
                  <Button 
                    size="sm"
                    onClick={() => setShowAddVisitorDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ancien visiteur
                  </Button>
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
                        onClick={() => navigate(`/visitors/${visitor.id}`)}
                      >
                        <div>
                          <p className="font-medium">{visitor.firstname} {visitor.lastname}</p>
                          <p className="text-sm text-gray-500">
                            {visitor.phone || 'Pas de téléphone'} • {visitor.visitor_type || visitor.types?.join(', ') || 'Nouveau arrivant'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">Voir</Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === ONGLET SUIVI DISCIPLES (NOUVEAU - SÉPARÉ) === */}
          <TabsContent value="disciples" className="space-y-4">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  Suivi des Disciples
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Compteurs */}
                <div className="grid grid-cols-3 gap-4 mb-6">
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
                      {(stats.total_visitors || visitors.length) - (stats.total_disciples_oui || 0) - (stats.total_disciples_en_cours || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Non encore</p>
                  </div>
                </div>
                
                {/* Liste avec sélecteur disciple */}
                <div className="space-y-2">
                  {visitors.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Aucun visiteur</p>
                  ) : (
                    visitors.map((visitor) => (
                      <div 
                        key={visitor.id}
                        className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{visitor.firstname} {visitor.lastname}</p>
                          <p className="text-sm text-gray-500">{visitor.phone || '-'}</p>
                        </div>
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
                            <SelectItem value="Oui">Oui ✓</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))
                  )}
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
                  Personnes reçues initialement: <strong className="text-green-700">{stats.total_visitors || visitors.length}</strong>
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
                                        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/objectifs/${obj.id}`,
                                        {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
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
                          </div>
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
                  value={newContact.statut || 'none'}
                  onValueChange={(v) => setNewContact(prev => ({ ...prev, statut: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
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

        {/* Dialog Ajouter Ancien Visiteur */}
        <Dialog open={showAddVisitorDialog} onOpenChange={setShowAddVisitorDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un Ancien Visiteur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prénom *</Label>
                  <Input
                    value={newVisitor.firstname}
                    onChange={(e) => setNewVisitor(prev => ({ ...prev, firstname: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Nom *</Label>
                  <Input
                    value={newVisitor.lastname}
                    onChange={(e) => setNewVisitor(prev => ({ ...prev, lastname: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input
                  value={newVisitor.phone}
                  onChange={(e) => setNewVisitor(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newVisitor.email}
                  onChange={(e) => setNewVisitor(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={newVisitor.visitor_type}
                  onValueChange={(v) => setNewVisitor(prev => ({ ...prev, visitor_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nouveau arrivant">Nouveau arrivant</SelectItem>
                    <SelectItem value="Nouveau converti">Nouveau converti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddVisitorDialog(false)}>Annuler</Button>
              <Button onClick={handleAddVisitor}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default BergerieDashboardPage;
