import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser, getVisitors } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Target, Heart, Plus, Phone, Calendar, Trash2, Sprout } from 'lucide-react';
import { toast } from 'sonner';

const ReproductionPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [loading, setLoading] = useState(true);
  const [totalVisitors, setTotalVisitors] = useState(0);
  
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

  const monthNames = {
    '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
    '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
    '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
  };

  // Extraire le mois de la bergerie
  const getBergerieMonth = () => {
    if (!user?.assigned_month) return '01';
    // assigned_month peut être un tableau ou une chaîne
    const monthValue = Array.isArray(user.assigned_month) ? user.assigned_month[0] : user.assigned_month;
    if (!monthValue) return '01';
    const parts = monthValue.split('-');
    return parts.length > 1 ? parts[1] : parts[0];
  };

  const bergerieMonth = getBergerieMonth();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Charge une seule fois au montage

  const loadData = async () => {
    const currentUser = getUser(); // Récupérer l'utilisateur frais
    // assigned_month peut être un tableau ou une chaîne
    const monthValue = currentUser?.assigned_month 
      ? (Array.isArray(currentUser.assigned_month) ? currentUser.assigned_month[0] : currentUser.assigned_month)
      : '2024-01';
    const bergerieMonth = monthValue.split('-')[1] || monthValue;
      
    try {
      // Charger les visiteurs pour le compteur
      const visitorsData = await getVisitors();
      setTotalVisitors(visitorsData.filter(v => !v.tracking_stopped).length);
      
      // Charger les objectifs
      const objResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/objectifs/${currentUser?.city}/${bergerieMonth}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (objResponse.ok) {
        setObjectifs(await objResponse.json());
      }
      
      // Charger les contacts
      const contactsResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/contacts/${currentUser?.city}/${bergerieMonth}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (contactsResponse.ok) {
        setContacts(await contactsResponse.json());
      }
    } catch (error) {
      console.error('Erreur:', error);
      // N'afficher le toast qu'une seule fois
      if (!loading) return;
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
            bergerie_month: bergerieMonth,
            ville: user.city,
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
        loadData();
      } else {
        throw new Error('Erreur');
      }
    } catch (error) {
      console.log('Error in ReproductionPage.handleSaveObjectif');
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleUpdateObjectifReel = async (obj, newValue) => {
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
            bergerie_month: bergerieMonth,
            ville: user.city,
            nombre_reel: newValue
          })
        }
      );
      loadData();
    } catch (error) {
      console.log('Error in ReproductionPage.handleUpdateObjectifReel');
      toast.error('Erreur');
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
            bergerie_month: bergerieMonth,
            ville: user.city,
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
        loadData();
      } else {
        throw new Error('Erreur');
      }
    } catch (error) {
      console.log('Error in ReproductionPage.handleSaveContact');
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
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      toast.success('Contact supprimé');
      loadData();
    } catch (error) {
      console.log('Error in ReproductionPage.handleDeleteContact');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Navigation rapide pour mobile - TOUJOURS visible sur mobile */}
        <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 md:hidden bg-white sticky top-0 z-50 pt-2 border-b">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-shrink-0"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-shrink-0"
            onClick={() => navigate('/visitors')}
          >
            Nouveaux
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-shrink-0"
            onClick={() => navigate('/visitors-table')}
          >
            Vue Tableau
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-shrink-0"
            onClick={() => navigate('/suivi-disciples')}
          >
            Disciples
          </Button>
          <Button 
            variant="default" 
            size="sm"
            className="flex-shrink-0 bg-green-600"
            onClick={() => navigate('/reproduction')}
          >
            Reproduction
          </Button>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sprout className="h-8 w-8 text-green-600" />
            Reproduction
          </h2>
          <p className="text-gray-500 mt-1">Objectifs de multiplication et évangélisation</p>
        </div>

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
              Personnes reçues initialement: <strong className="text-green-700">{totalVisitors}</strong>
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
                              onChange={(e) => handleUpdateObjectifReel(obj, parseInt(e.target.value) || null)}
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
                        {contact.statut && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {contact.statut}
                          </span>
                        )}
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
      </div>
    </Layout>
  );
};

export default ReproductionPage;
