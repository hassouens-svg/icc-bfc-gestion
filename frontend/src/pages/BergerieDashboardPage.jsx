import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  UserPlus, Sprout, Home, Eye, CheckCircle, XCircle
} from 'lucide-react';
import { toast } from 'sonner';

const BergerieDashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const ville = searchParams.get('ville') || '';
  const monthNum = searchParams.get('month') || '01';
  const currentYear = new Date().getFullYear();
  
  const monthNames = {
    '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
    '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
    '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
  };
  
  const monthName = monthNames[monthNum] || monthNum;
  
  // States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    total_visitors: 0, 
    formation_pcnc: 0, 
    formation_au_coeur_bible: 0, 
    formation_star: 0,
    by_type: [],
    by_channel: []
  });
  const [visitors, setVisitors] = useState([]);
  
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

  // États pour les présences
  const [presences, setPresences] = useState({});
  const [presenceDate, setPresenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [fidelisationRate, setFidelisationRate] = useState(0);

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
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/reproduction/${encodeURIComponent(ville)}/${monthNum}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setVisitors(data.visitors || []);
        setObjectifs(data.objectifs || []);
        setContacts(data.contacts || []);
        
        const visitorsData = data.visitors || [];
        const totalVisitors = visitorsData.filter(v => !v.tracking_stopped).length;
        const formationPcnc = visitorsData.filter(v => v.formation_pcnc).length;
        const formationBible = visitorsData.filter(v => v.formation_au_coeur_bible).length;
        const formationStar = visitorsData.filter(v => v.formation_star).length;
        
        const byType = {};
        visitorsData.forEach(v => {
          const types = v.types || [v.visitor_type || 'Non défini'];
          types.forEach(type => {
            byType[type] = (byType[type] || 0) + 1;
          });
        });
        
        const byChannel = {};
        visitorsData.forEach(v => {
          const channel = v.arrival_channel || 'Non défini';
          byChannel[channel] = (byChannel[channel] || 0) + 1;
        });
        
        setStats({
          total_visitors: totalVisitors,
          formation_pcnc: formationPcnc,
          formation_au_coeur_bible: formationBible,
          formation_star: formationStar,
          by_type: Object.entries(byType).map(([_id, count]) => ({ _id, count })),
          by_channel: Object.entries(byChannel).map(([_id, count]) => ({ _id, count })),
          total_disciples_oui: data.stats?.total_disciples_oui || 0,
          total_disciples_en_cours: data.stats?.total_disciples_en_cours || 0,
          total_evangelises: data.stats?.total_evangelises || 0
        });
        
        const disciplesMap = {};
        visitorsData.forEach(v => {
          disciplesMap[v.id] = v.est_disciple || 'Non';
        });
        setDisciples(disciplesMap);

        // Charger les présences
        const presencesMap = {};
        visitorsData.forEach(v => {
          presencesMap[v.id] = v.presences || [];
        });
        setPresences(presencesMap);

        // Calculer le taux de fidélisation
        if (visitorsData.length > 0) {
          const totalPresences = visitorsData.reduce((acc, v) => acc + (v.presences?.length || 0), 0);
          const maxPresences = visitorsData.length * 4; // Approximation
          setFidelisationRate(maxPresences > 0 ? Math.round((totalPresences / maxPresences) * 100) : 0);
        }
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
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  // === MARQUER PRÉSENCE ===
  const handleMarkPresence = async (visitorId, isPresent) => {
    try {
      await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/presence`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitor_id: visitorId,
            date: presenceDate,
            present: isPresent,
            ville: ville,
            bergerie_month: monthNum
          })
        }
      );
      toast.success(isPresent ? 'Présent marqué' : 'Absent marqué');
      loadAllData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Public */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/bergeries')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-purple-600">Bergerie {monthName}</h1>
              <p className="text-xs text-gray-500">{ville} • {stats.total_visitors} personnes</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
            <Eye className="h-3 w-3" />
            <span className="text-xs font-medium">Public</span>
          </div>
        </div>
      </header>

      {/* Navigation Onglets - TOUJOURS VISIBLE */}
      <nav className="bg-white border-b sticky top-[52px] z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'visitors', label: 'Nouveaux', icon: Users },
              { id: 'tableau', label: 'Vue Tableau', icon: Table },
              { id: 'presences', label: 'Présences', icon: Calendar },
              { id: 'disciples', label: 'Disciples', icon: UserCheck },
              { id: 'reproduction', label: 'Reproduction', icon: Sprout },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Contenu Principal */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
        <div className="space-y-4">
          
          {/* === ONGLET DASHBOARD === */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Verset */}
              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📖</div>
                    <div>
                      <p className="text-xs font-semibold text-purple-800">Jérémie 3:15</p>
                      <p className="text-sm italic text-gray-700">
                        "Je vous donnerai des bergers selon mon cœur..."
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Nouveaux Arrivants</p>
                        <p className="text-2xl font-bold">{stats.total_visitors}</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Canaux</p>
                        <p className="text-2xl font-bold">{stats.by_channel?.length || 0}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-2 sm:col-span-1">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Fidélisation</p>
                        <p className="text-2xl font-bold text-green-600">{fidelisationRate}%</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* KPIs Formations */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">KPIs Formations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 border rounded bg-blue-50 text-center">
                      <p className="text-xl font-bold text-blue-600">{stats.formation_pcnc}</p>
                      <p className="text-xs text-gray-500">PCNC</p>
                    </div>
                    <div className="p-2 border rounded bg-green-50 text-center">
                      <p className="text-xl font-bold text-green-600">{stats.formation_au_coeur_bible}</p>
                      <p className="text-xs text-gray-500">Bible</p>
                    </div>
                    <div className="p-2 border rounded bg-purple-50 text-center">
                      <p className="text-xl font-bold text-purple-600">{stats.formation_star}</p>
                      <p className="text-xs text-gray-500">STAR</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Par type */}
              {stats.by_type && stats.by_type.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Par Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {stats.by_type.map((item) => (
                        <div key={item._id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                          <span>{item._id}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* === ONGLET NOUVEAUX ARRIVANTS === */}
          {activeTab === 'visitors' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Nouveaux Arrivants ({visitors.length})</h2>
                <Button size="sm" onClick={() => setShowAddVisitorDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une personne
                </Button>
              </div>
              
              <div className="space-y-2">
                {visitors.length === 0 ? (
                  <Card><CardContent className="py-8 text-center text-gray-500">Aucun nouveau arrivant</CardContent></Card>
                ) : (
                  visitors.map((visitor) => (
                    <Card key={visitor.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{visitor.firstname} {visitor.lastname}</p>
                            <p className="text-sm text-gray-500">
                              {visitor.phone || '-'} • {visitor.visitor_type || visitor.types?.join(', ') || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right text-xs text-gray-400">
                            {visitor.visit_date ? new Date(visitor.visit_date).toLocaleDateString('fr-FR') : '-'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* === ONGLET VUE TABLEAU === */}
          {activeTab === 'tableau' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Vue Tableau</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3">Nom</th>
                          <th className="text-left p-3">Prénom</th>
                          <th className="text-left p-3 hidden sm:table-cell">Téléphone</th>
                          <th className="text-left p-3">Type</th>
                          <th className="text-left p-3 hidden sm:table-cell">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitors.map((v) => (
                          <tr key={v.id} className="border-t hover:bg-gray-50">
                            <td className="p-3 font-medium">{v.lastname}</td>
                            <td className="p-3">{v.firstname}</td>
                            <td className="p-3 hidden sm:table-cell">{v.phone || '-'}</td>
                            <td className="p-3">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {v.visitor_type || 'NA'}
                              </span>
                            </td>
                            <td className="p-3 hidden sm:table-cell text-gray-500">
                              {v.visit_date ? new Date(v.visit_date).toLocaleDateString('fr-FR') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* === ONGLET PRÉSENCES === */}
          {activeTab === 'presences' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-xl font-bold">Marquer les Présences</h2>
                <Input
                  type="date"
                  value={presenceDate}
                  onChange={(e) => setPresenceDate(e.target.value)}
                  className="w-40"
                />
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {visitors.map((v) => (
                      <div key={v.id} className="flex justify-between items-center p-3">
                        <div>
                          <p className="font-medium">{v.firstname} {v.lastname}</p>
                          <p className="text-xs text-gray-500">{v.visitor_type || 'NA'}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:bg-green-50"
                            onClick={() => handleMarkPresence(v.id, true)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleMarkPresence(v.id, false)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* === ONGLET DISCIPLES === */}
          {activeTab === 'disciples' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Suivi Disciples</h2>
              
              {/* Compteurs */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="bg-green-50">
                  <CardContent className="py-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.total_disciples_oui || 0}</p>
                    <p className="text-xs text-gray-600">Oui</p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50">
                  <CardContent className="py-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">{stats.total_disciples_en_cours || 0}</p>
                    <p className="text-xs text-gray-600">En Cours</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50">
                  <CardContent className="py-3 text-center">
                    <p className="text-2xl font-bold text-gray-600">
                      {visitors.length - (stats.total_disciples_oui || 0) - (stats.total_disciples_en_cours || 0)}
                    </p>
                    <p className="text-xs text-gray-600">Non</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Liste */}
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {visitors.map((v) => (
                      <div key={v.id} className="flex justify-between items-center p-3">
                        <div>
                          <p className="font-medium">{v.firstname} {v.lastname}</p>
                          <p className="text-xs text-gray-500">{v.phone || '-'}</p>
                        </div>
                        <Select
                          value={disciples[v.id] || 'Non'}
                          onValueChange={(value) => handleUpdateDisciple(v.id, value)}
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
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Contacts évangélisés */}
              {contacts.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart className="h-4 w-4 text-purple-600" />
                      Personnes Contactées ({contacts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {contacts.map((c) => (
                        <div key={c.id} className="p-3">
                          <p className="font-medium">{c.prenom} {c.nom}</p>
                          <p className="text-xs text-gray-500">{c.telephone || '-'} • {c.type_contact}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* === ONGLET REPRODUCTION === */}
          {activeTab === 'reproduction' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sprout className="h-6 w-6 text-green-600" />
                Reproduction
              </h2>
              
              {/* Objectifs */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-600" />
                      Objectifs de Multiplication
                    </span>
                    <Button size="sm" className="bg-green-600" onClick={() => setShowObjectifDialog(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Personnes reçues: <strong>{stats.total_visitors}</strong>
                  </p>
                  
                  {objectifs.length === 0 ? (
                    <p className="text-center text-gray-500 py-4 text-sm">Aucun objectif</p>
                  ) : (
                    <div className="space-y-2">
                      {objectifs.map((obj) => {
                        const [year, month] = (obj.mois_cible || '').split('-');
                        const pct = obj.nombre_reel && obj.objectif_nombre 
                          ? Math.round((obj.nombre_reel / obj.objectif_nombre) * 100) : 0;
                        return (
                          <div key={obj.id} className="flex justify-between items-center p-2 bg-white rounded">
                            <span className="text-sm">{monthNames[month]} {year}</span>
                            <span className="text-sm">Obj: {obj.objectif_nombre}</span>
                            <span className="text-sm">Réel: {obj.nombre_reel || '-'}</span>
                            <span className={`text-sm font-bold px-2 py-1 rounded ${
                              pct >= 100 ? 'bg-green-100 text-green-700' :
                              pct >= 50 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contacts */}
              <Card className="border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-purple-600" />
                      Personnes Contactées
                    </span>
                    <Button size="sm" className="bg-purple-600" onClick={() => setShowContactDialog(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contacts.length === 0 ? (
                    <p className="text-center text-gray-500 py-4 text-sm">Aucun contact</p>
                  ) : (
                    <div className="space-y-2">
                      {contacts.map((c) => (
                        <div key={c.id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <p className="font-medium text-sm">{c.prenom} {c.nom}</p>
                            <p className="text-xs text-gray-500">
                              {c.telephone || '-'} • {c.type_contact}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteContact(c.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <Dialog open={showObjectifDialog} onOpenChange={setShowObjectifDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un Objectif</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mois Cible</Label>
              <Select value={newObjectif.mois_cible} onValueChange={(v) => setNewObjectif(p => ({ ...p, mois_cible: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {generateMonths().map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Objectif</Label>
              <Input type="number" value={newObjectif.objectif_nombre} onChange={(e) => setNewObjectif(p => ({ ...p, objectif_nombre: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowObjectifDialog(false)}>Annuler</Button>
            <Button className="bg-green-600" onClick={handleSaveObjectif}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un Contact</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Prénom</Label><Input value={newContact.prenom} onChange={(e) => setNewContact(p => ({ ...p, prenom: e.target.value }))} /></div>
              <div><Label>Nom</Label><Input value={newContact.nom} onChange={(e) => setNewContact(p => ({ ...p, nom: e.target.value }))} /></div>
            </div>
            <div><Label>Téléphone</Label><Input value={newContact.telephone} onChange={(e) => setNewContact(p => ({ ...p, telephone: e.target.value }))} /></div>
            <div>
              <Label>Type</Label>
              <Select value={newContact.type_contact} onValueChange={(v) => setNewContact(p => ({ ...p, type_contact: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Evangelisation">Évangélisation</SelectItem>
                  <SelectItem value="Autres">Autres</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>Annuler</Button>
            <Button className="bg-purple-600" onClick={handleSaveContact}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddVisitorDialog} onOpenChange={setShowAddVisitorDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un Visiteur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Prénom</Label><Input value={newVisitor.firstname} onChange={(e) => setNewVisitor(p => ({ ...p, firstname: e.target.value }))} /></div>
              <div><Label>Nom</Label><Input value={newVisitor.lastname} onChange={(e) => setNewVisitor(p => ({ ...p, lastname: e.target.value }))} /></div>
            </div>
            <div><Label>Téléphone</Label><Input value={newVisitor.phone} onChange={(e) => setNewVisitor(p => ({ ...p, phone: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVisitorDialog(false)}>Annuler</Button>
            <Button onClick={handleAddVisitor}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BergerieDashboardPage;
