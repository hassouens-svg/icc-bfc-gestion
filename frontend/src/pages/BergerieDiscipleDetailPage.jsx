import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../components/ui/dialog';
import { 
  Users, ArrowLeft, Plus, Trash2, Edit, Calendar, Target, Heart, 
  UserCheck, Search, Phone, Briefcase, MessageSquare, Save
} from 'lucide-react';
import { toast } from 'sonner';

const BergerieDiscipleDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [bergerie, setBergerie] = useState(null);
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [showAddInfo, setShowAddInfo] = useState(false);
  const [showAddObjectif, setShowAddObjectif] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState(null);
  const [newMember, setNewMember] = useState({ prenom: '', nom: '', telephone: '', profession: '' });
  const [newInfo, setNewInfo] = useState({ date: new Date().toISOString().split('T')[0], texte: '' });
  const [newObjectif, setNewObjectif] = useState({ mois: '', objectif: '' });
  const [newContact, setNewContact] = useState({ nom: '', prenom: '', telephone: '', date: new Date().toISOString().split('T')[0], type: 'Évangélisation' });
  
  // Stats
  const [objectifs, setObjectifs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({ disciples_oui: 0, disciples_en_cours: 0, disciples_non: 0 });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      // D'abord, essayer de charger les infos de la bergerie depuis l'API
      const bergerieResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/${id}`);
      if (bergerieResponse.ok) {
        const bergerieData = await bergerieResponse.json();
        setBergerie(bergerieData);
      } else {
        // Fallback: charger depuis localStorage
        const storedBergerie = localStorage.getItem('selected_bergerie_disciple');
        if (storedBergerie) {
          setBergerie(JSON.parse(storedBergerie));
        }
      }
      
      // Charger les membres depuis l'API
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/${id}/membres`);
      if (response.ok) {
        const data = await response.json();
        setMembres(data.membres || []);
        setObjectifs(data.objectifs || []);
        setContacts(data.contacts || []);
      } else {
        // Données de démonstration
        loadDemoData();
      }
    } catch (error) {
      console.error('Error:', error);
      loadDemoData();
    } finally {
      setLoading(false);
    }
  };

  const loadDemoData = () => {
    // Données de démonstration basées sur le Google Sheet
    const demoMembres = [
      { id: 'm1', prenom: 'Marie', nom: 'Esther', telephone: '', profession: '', est_disciple: 'En Cours', informations: [] },
      { id: 'm2', prenom: 'Jade', nom: '', telephone: '', profession: '', est_disciple: 'Non', informations: [] },
      { id: 'm3', prenom: 'Julie', nom: '', telephone: '', profession: '', est_disciple: 'Oui', informations: [] },
      { id: 'm4', prenom: 'Marie', nom: 'Augustine', telephone: '', profession: '', est_disciple: 'En Cours', informations: [] },
      { id: 'm5', prenom: 'Marlyne', nom: '', telephone: '', profession: '', est_disciple: 'Non', informations: [] },
    ];
    setMembres(demoMembres);
    calculateStats(demoMembres);
  };

  const calculateStats = (membresList) => {
    const oui = membresList.filter(m => m.est_disciple === 'Oui').length;
    const enCours = membresList.filter(m => m.est_disciple === 'En Cours').length;
    const non = membresList.filter(m => !m.est_disciple || m.est_disciple === 'Non').length;
    setStats({ disciples_oui: oui, disciples_en_cours: enCours, disciples_non: non });
  };

  useEffect(() => {
    calculateStats(membres);
  }, [membres]);

  const handleAddMember = async () => {
    if (!newMember.prenom) {
      toast.error('Le prénom est requis');
      return;
    }
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/${id}/membres`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });
      
      if (response.ok) {
        const data = await response.json();
        setMembres([...membres, { ...newMember, id: data.id, est_disciple: 'Non', informations: [] }]);
        toast.success('Membre ajouté!');
      } else {
        // Fallback local
        setMembres([...membres, { ...newMember, id: `m${Date.now()}`, est_disciple: 'Non', informations: [] }]);
        toast.success('Membre ajouté (local)');
      }
    } catch (error) {
      setMembres([...membres, { ...newMember, id: `m${Date.now()}`, est_disciple: 'Non', informations: [] }]);
      toast.success('Membre ajouté (local)');
    }
    
    setShowAddMember(false);
    setNewMember({ prenom: '', nom: '', telephone: '', profession: '' });
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/membres/${selectedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedMember)
      });
    } catch (error) {
      console.error('Error:', error);
    }
    
    setMembres(membres.map(m => m.id === selectedMember.id ? selectedMember : m));
    toast.success('Membre mis à jour!');
    setShowEditMember(false);
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Supprimer ce membre?')) return;
    
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/membres/${memberId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error:', error);
    }
    
    setMembres(membres.filter(m => m.id !== memberId));
    toast.success('Membre supprimé');
  };

  const handleUpdateDisciple = async (memberId, status) => {
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/membres/${memberId}/disciple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ est_disciple: status })
      });
    } catch (error) {
      console.error('Error:', error);
    }
    
    setMembres(membres.map(m => m.id === memberId ? { ...m, est_disciple: status } : m));
    toast.success('Statut mis à jour');
  };

  const handleAddInfo = async () => {
    if (!selectedMember || !newInfo.texte) return;
    
    const info = { ...newInfo, id: `i${Date.now()}` };
    const updatedMember = {
      ...selectedMember,
      informations: [...(selectedMember.informations || []), info]
    };
    
    setMembres(membres.map(m => m.id === selectedMember.id ? updatedMember : m));
    setSelectedMember(updatedMember);
    toast.success('Information ajoutée!');
    setShowAddInfo(false);
    setNewInfo({ date: new Date().toISOString().split('T')[0], texte: '' });
  };

  const handleAddObjectif = async () => {
    if (!newObjectif.mois || !newObjectif.objectif) {
      toast.error('Tous les champs sont requis');
      return;
    }
    
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/${id}/objectifs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newObjectif)
      });
    } catch (error) {
      console.error('Error:', error);
    }
    
    setObjectifs([...objectifs, { ...newObjectif, id: `o${Date.now()}`, reel: 0 }]);
    toast.success('Objectif ajouté!');
    setShowAddObjectif(false);
    setNewObjectif({ mois: '', objectif: '' });
  };

  const handleAddContact = async () => {
    if (!newContact.prenom) {
      toast.error('Le prénom est requis');
      return;
    }
    
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/${id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });
    } catch (error) {
      console.error('Error:', error);
    }
    
    setContacts([...contacts, { ...newContact, id: `c${Date.now()}` }]);
    toast.success('Contact ajouté!');
    setShowAddContact(false);
    setNewContact({ nom: '', prenom: '', telephone: '', date: new Date().toISOString().split('T')[0], type: 'Évangélisation' });
  };

  const filteredMembres = membres.filter(m =>
    `${m.prenom} ${m.nom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditMember = (member) => {
    setSelectedMember({ ...member });
    setShowEditMember(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/bergeries-disciples')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{bergerie?.nom || 'Bergerie'}</h1>
                <p className="text-sm text-gray-500">
                  👤 {bergerie?.responsable} • 📍 {bergerie?.ville} • {membres.length} membre(s)
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/')} variant="outline">
              Accueil
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="membres" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="membres">
              <Users className="h-4 w-4 mr-2" />
              Membres
            </TabsTrigger>
            <TabsTrigger value="suivi">
              <UserCheck className="h-4 w-4 mr-2" />
              Suivi Disciples
            </TabsTrigger>
            <TabsTrigger value="reproduction">
              <Target className="h-4 w-4 mr-2" />
              Reproduction
            </TabsTrigger>
          </TabsList>

          {/* ONGLET MEMBRES */}
          <TabsContent value="membres" className="space-y-6">
            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un membre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setShowAddMember(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une personne
              </Button>
            </div>

            {/* Liste des membres */}
            <div className="grid gap-3">
              {filteredMembres.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Aucun membre trouvé</p>
                  </CardContent>
                </Card>
              ) : (
                filteredMembres.map((membre) => (
                  <Card key={membre.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 cursor-pointer" onClick={() => openEditMember(membre)}>
                          <p className="font-semibold text-lg">{membre.prenom} {membre.nom}</p>
                          <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                            {membre.telephone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {membre.telephone}
                              </span>
                            )}
                            {membre.profession && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" /> {membre.profession}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              membre.est_disciple === 'Oui' ? 'bg-green-100 text-green-700' :
                              membre.est_disciple === 'En Cours' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              Disciple: {membre.est_disciple || 'Non'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditMember(membre)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteMember(membre.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* ONGLET SUIVI DISCIPLES */}
          <TabsContent value="suivi" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="py-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.disciples_oui}</p>
                  <p className="text-sm text-green-700">Oui</p>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="py-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">{stats.disciples_en_cours}</p>
                  <p className="text-sm text-orange-700">En Cours</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="py-4 text-center">
                  <p className="text-3xl font-bold text-gray-600">{stats.disciples_non}</p>
                  <p className="text-sm text-gray-700">Non</p>
                </CardContent>
              </Card>
            </div>

            {/* Liste pour modifier statut */}
            <Card>
              <CardHeader>
                <CardTitle>Statut Disciple des Membres</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {membres.map((membre) => (
                  <div key={membre.id} className="flex justify-between items-center py-3">
                    <span className="font-medium">{membre.prenom} {membre.nom}</span>
                    <Select
                      value={membre.est_disciple || 'Non'}
                      onValueChange={(value) => handleUpdateDisciple(membre.id, value)}
                    >
                      <SelectTrigger className={`w-32 ${
                        membre.est_disciple === 'Oui' ? 'bg-green-50 border-green-300' :
                        membre.est_disciple === 'En Cours' ? 'bg-orange-50 border-orange-300' :
                        'bg-gray-50'
                      }`}>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET REPRODUCTION */}
          <TabsContent value="reproduction" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="py-4 text-center">
                  <Users className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                  <p className="text-2xl font-bold text-blue-600">{membres.length}</p>
                  <p className="text-xs text-blue-700">Membres actuels</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="py-4 text-center">
                  <Target className="h-6 w-6 mx-auto text-green-600 mb-1" />
                  <p className="text-2xl font-bold text-green-600">{stats.disciples_oui}</p>
                  <p className="text-xs text-green-700">Disciples</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="py-4 text-center">
                  <Heart className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                  <p className="text-2xl font-bold text-purple-600">{contacts.length}</p>
                  <p className="text-xs text-purple-700">Contacts</p>
                </CardContent>
              </Card>
            </div>

            {/* Objectifs de Multiplication */}
            <Card className="border-green-200">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Objectifs de Multiplication
                  </CardTitle>
                  <Button size="sm" className="bg-green-600" onClick={() => setShowAddObjectif(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {objectifs.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Aucun objectif défini</p>
                ) : (
                  <div className="space-y-2">
                    {objectifs.map((obj) => (
                      <div key={obj.id} className="flex justify-between items-center p-3 bg-green-50 rounded border">
                        <span className="font-medium">{obj.mois}</span>
                        <span>Objectif: <strong>{obj.objectif}</strong></span>
                        <span>Réel: <strong>{obj.reel || membres.length}</strong></span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personnes Contactées */}
            <Card className="border-purple-200">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-purple-600" />
                    Personnes Contactées ({contacts.length})
                  </CardTitle>
                  <Button size="sm" className="bg-purple-600" onClick={() => setShowAddContact(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Aucun contact enregistré</p>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((c) => (
                      <div key={c.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{c.prenom} {c.nom}</p>
                          <p className="text-sm text-gray-500">{c.telephone} • {c.type} • {c.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* DIALOGS */}
      
      {/* Ajouter Membre */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter une personne</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Prénom *</Label><Input value={newMember.prenom} onChange={(e) => setNewMember({...newMember, prenom: e.target.value})} /></div>
              <div><Label>Nom</Label><Input value={newMember.nom} onChange={(e) => setNewMember({...newMember, nom: e.target.value})} /></div>
            </div>
            <div><Label>Téléphone</Label><Input value={newMember.telephone} onChange={(e) => setNewMember({...newMember, telephone: e.target.value})} /></div>
            <div><Label>Profession</Label><Input value={newMember.profession} onChange={(e) => setNewMember({...newMember, profession: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMember(false)}>Annuler</Button>
            <Button onClick={handleAddMember} className="bg-green-600">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modifier Membre */}
      <Dialog open={showEditMember} onOpenChange={setShowEditMember}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Modifier - {selectedMember?.prenom} {selectedMember?.nom}</DialogTitle></DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Prénom</Label><Input value={selectedMember.prenom} onChange={(e) => setSelectedMember({...selectedMember, prenom: e.target.value})} /></div>
                <div><Label>Nom</Label><Input value={selectedMember.nom} onChange={(e) => setSelectedMember({...selectedMember, nom: e.target.value})} /></div>
              </div>
              <div><Label>Téléphone</Label><Input value={selectedMember.telephone || ''} onChange={(e) => setSelectedMember({...selectedMember, telephone: e.target.value})} /></div>
              <div><Label>Profession</Label><Input value={selectedMember.profession || ''} onChange={(e) => setSelectedMember({...selectedMember, profession: e.target.value})} /></div>
              
              {/* Section Informations */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <Label className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Informations</Label>
                  <Button size="sm" variant="outline" onClick={() => setShowAddInfo(true)}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {(selectedMember.informations || []).length === 0 ? (
                    <p className="text-sm text-gray-500">Aucune information</p>
                  ) : (
                    selectedMember.informations.map((info, idx) => (
                      <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                        <span className="text-gray-400">{info.date}:</span> {info.texte}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditMember(false)}>Fermer</Button>
            <Button onClick={handleUpdateMember} className="bg-green-600"><Save className="h-4 w-4 mr-2" />Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ajouter Information */}
      <Dialog open={showAddInfo} onOpenChange={setShowAddInfo}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter une information</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Date</Label><Input type="date" value={newInfo.date} onChange={(e) => setNewInfo({...newInfo, date: e.target.value})} /></div>
            <div><Label>Information</Label><Textarea value={newInfo.texte} onChange={(e) => setNewInfo({...newInfo, texte: e.target.value})} placeholder="Saisissez l'information..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddInfo(false)}>Annuler</Button>
            <Button onClick={handleAddInfo}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ajouter Objectif */}
      <Dialog open={showAddObjectif} onOpenChange={setShowAddObjectif}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un objectif</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Mois</Label>
              <Select value={newObjectif.mois} onValueChange={(v) => setNewObjectif({...newObjectif, mois: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                <SelectContent>
                  {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map(m => (
                    <SelectItem key={m} value={`${m} 2026`}>{m} 2026</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Objectif (nombre de membres)</Label><Input type="number" value={newObjectif.objectif} onChange={(e) => setNewObjectif({...newObjectif, objectif: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddObjectif(false)}>Annuler</Button>
            <Button onClick={handleAddObjectif} className="bg-green-600">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ajouter Contact */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un contact</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Prénom *</Label><Input value={newContact.prenom} onChange={(e) => setNewContact({...newContact, prenom: e.target.value})} /></div>
              <div><Label>Nom</Label><Input value={newContact.nom} onChange={(e) => setNewContact({...newContact, nom: e.target.value})} /></div>
            </div>
            <div><Label>Téléphone</Label><Input value={newContact.telephone} onChange={(e) => setNewContact({...newContact, telephone: e.target.value})} /></div>
            <div><Label>Type</Label>
              <Select value={newContact.type} onValueChange={(v) => setNewContact({...newContact, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Évangélisation">Évangélisation</SelectItem>
                  <SelectItem value="Invitation">Invitation</SelectItem>
                  <SelectItem value="Autres">Autres</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={newContact.date} onChange={(e) => setNewContact({...newContact, date: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddContact(false)}>Annuler</Button>
            <Button onClick={handleAddContact} className="bg-purple-600">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BergerieDiscipleDetailPage;
