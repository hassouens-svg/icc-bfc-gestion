import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PublicBergerieLayout from '../components/PublicBergerieLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Sprout, Target, Heart, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

const monthNames = {
  '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
  '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
  '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
};

const PublicBergerieReproductionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const ville = searchParams.get('ville') || '';
  const monthNum = searchParams.get('month') || '01';
  const currentYear = new Date().getFullYear();
  
  const guestContextStr = localStorage.getItem('guest_bergerie_context');
  const guestContext = guestContextStr ? JSON.parse(guestContextStr) : {
    ville,
    month_num: monthNum,
    month_name: monthNames[monthNum] || monthNum,
    nom: `Bergerie ${monthNames[monthNum] || monthNum}`
  };

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_visitors: 0, total_disciples_oui: 0, total_evangelises: 0 });
  const [objectifs, setObjectifs] = useState([]);
  const [contacts, setContacts] = useState([]);
  
  const [showObjectifDialog, setShowObjectifDialog] = useState(false);
  const [newObjectif, setNewObjectif] = useState({ mois_cible: '', objectif_nombre: '', nombre_reel: '' });
  
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [newContact, setNewContact] = useState({
    nom: '', prenom: '', telephone: '',
    date_contact: new Date().toISOString().split('T')[0],
    type_contact: 'Evangelisation', notes: ''
  });

  useEffect(() => {
    if (!ville || !monthNum) {
      navigate('/bergeries');
      return;
    }
    loadData();
  }, [ville, monthNum]);

  const loadData = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/reproduction/${encodeURIComponent(ville)}/${monthNum}`
      );
      if (response.ok) {
        const data = await response.json();
        setObjectifs(data.objectifs || []);
        setContacts(data.contacts || []);
        setStats({
          total_visitors: (data.visitors || []).filter(v => !v.tracking_stopped).length,
          total_disciples_oui: data.stats?.total_disciples_oui || 0,
          total_evangelises: data.stats?.total_evangelises || (data.contacts || []).length
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveObjectif = async () => {
    if (!newObjectif.mois_cible || !newObjectif.objectif_nombre) {
      toast.error('Mois et objectif requis');
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
            annee: currentYear,
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
        loadData();
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleSaveContact = async () => {
    if (!newContact.nom || !newContact.prenom) {
      toast.error('Nom et prénom requis');
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
            ...newContact
          })
        }
      );
      
      if (response.ok) {
        toast.success('Contact ajouté');
        setShowContactDialog(false);
        setNewContact({
          nom: '', prenom: '', telephone: '',
          date_contact: new Date().toISOString().split('T')[0],
          type_contact: 'Evangelisation', notes: ''
        });
        loadData();
      }
    } catch (error) {
      toast.error('Erreur');
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
      loadData();
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
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sprout className="h-8 w-8 text-green-600" />
            Reproduction
          </h2>
          <p className="text-gray-500 mt-1">Bergerie {monthNames[monthNum]} • {ville}</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4 text-center">
              <Users className="h-6 w-6 mx-auto text-blue-600 mb-1" />
              <p className="text-2xl font-bold text-blue-600">{stats.total_visitors}</p>
              <p className="text-xs text-blue-700">Personnes Reçues</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-4 text-center">
              <Target className="h-6 w-6 mx-auto text-green-600 mb-1" />
              <p className="text-2xl font-bold text-green-600">{stats.total_disciples_oui}</p>
              <p className="text-xs text-green-700">Disciples</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="py-4 text-center">
              <Heart className="h-6 w-6 mx-auto text-purple-600 mb-1" />
              <p className="text-2xl font-bold text-purple-600">{stats.total_evangelises}</p>
              <p className="text-xs text-purple-700">Contacts</p>
            </CardContent>
          </Card>
        </div>

        {/* Objectifs de Multiplication */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Objectifs de Multiplication
              </span>
              <Button size="sm" className="bg-green-600" onClick={() => setShowObjectifDialog(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {objectifs.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Aucun objectif défini</p>
            ) : (
              <div className="space-y-2">
                {objectifs.map((obj) => {
                  const [year, month] = (obj.mois_cible || '').split('-');
                  const pct = obj.nombre_reel && obj.objectif_nombre 
                    ? Math.round((obj.nombre_reel / obj.objectif_nombre) * 100) : 0;
                  return (
                    <div key={obj.id} className="flex justify-between items-center p-3 bg-white rounded border">
                      <span className="font-medium">{monthNames[month]} {year}</span>
                      <span>Obj: <strong>{obj.objectif_nombre}</strong></span>
                      <span>Réel: <strong>{obj.nombre_reel || '-'}</strong></span>
                      <span className={`px-2 py-1 rounded text-sm font-bold ${
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

        {/* Personnes Contactées */}
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-purple-600" />
                Personnes Contactées ({contacts.length})
              </span>
              <Button size="sm" className="bg-purple-600" onClick={() => setShowContactDialog(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
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
                      <p className="text-sm text-gray-500">
                        {c.telephone || '-'} • {c.type_contact}
                        {c.date_contact && ` • ${new Date(c.date_contact).toLocaleDateString('fr-FR')}`}
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
                <Label>Objectif (nombre)</Label>
                <Input type="number" value={newObjectif.objectif_nombre} onChange={(e) => setNewObjectif(p => ({ ...p, objectif_nombre: e.target.value }))} />
              </div>
              <div>
                <Label>Réalisé (optionnel)</Label>
                <Input type="number" value={newObjectif.nombre_reel} onChange={(e) => setNewObjectif(p => ({ ...p, nombre_reel: e.target.value }))} />
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
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Prénom *</Label><Input value={newContact.prenom} onChange={(e) => setNewContact(p => ({ ...p, prenom: e.target.value }))} /></div>
                <div><Label>Nom *</Label><Input value={newContact.nom} onChange={(e) => setNewContact(p => ({ ...p, nom: e.target.value }))} /></div>
              </div>
              <div><Label>Téléphone</Label><Input value={newContact.telephone} onChange={(e) => setNewContact(p => ({ ...p, telephone: e.target.value }))} /></div>
              <div>
                <Label>Type de Contact</Label>
                <Select value={newContact.type_contact} onValueChange={(v) => setNewContact(p => ({ ...p, type_contact: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Evangelisation">Évangélisation</SelectItem>
                    <SelectItem value="Invitation">Invitation</SelectItem>
                    <SelectItem value="Autres">Autres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="date" value={newContact.date_contact} onChange={(e) => setNewContact(p => ({ ...p, date_contact: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowContactDialog(false)}>Annuler</Button>
              <Button className="bg-purple-600" onClick={handleSaveContact}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PublicBergerieLayout>
  );
};

export default PublicBergerieReproductionPage;
