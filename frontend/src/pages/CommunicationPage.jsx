import React, { useState, useEffect } from 'react';
import EventsLayout from '../components/EventsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft, Upload, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const CommunicationPage = () => {
  const navigate = useNavigate();
  const [campagnes, setCampagnes] = useState([]);
  const [newCampagne, setNewCampagne] = useState({
    titre: '',
    type: 'email',
    message: '',
    image_url: '',
    destinataires: [],
    date_envoi: '',
    enable_rsvp: false
  });
  const [contacts, setContacts] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadCampagnes();
  }, []);

  const loadCampagnes = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/campagnes`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        setCampagnes(data);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        const formattedContacts = data.map(row => ({
          prenom: row.prenom || row.Prenom || row.Prénom || '',
          nom: row.nom || row.Nom || '',
          email: row.email || row.Email || '',
          telephone: row.telephone || row.Telephone || row.Téléphone || row.phone || ''
        }));
        
        setContacts(formattedContacts);
        setNewCampagne({...newCampagne, destinataires: formattedContacts});
        toast.success(`${formattedContacts.length} contacts importés`);
      } catch (error) {
        toast.error('Erreur lecture fichier');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddTestContact = () => {
    const testContact = {
      prenom: 'Test',
      nom: 'Utilisateur',
      email: 'test@example.com',
      telephone: ''
    };
    const updatedContacts = [...contacts, testContact];
    setContacts(updatedContacts);
    setNewCampagne({...newCampagne, destinataires: updatedContacts});
    toast.success('Contact test ajouté');
  };

  const handleCreateCampagne = async (e) => {
    e.preventDefault();
    if (newCampagne.destinataires.length === 0) {
      toast.error('Veuillez importer des contacts via Excel ou ajouter un contact test');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/campagnes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCampagne)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(`Erreur: ${data.detail || 'Création échouée'}`);
        return;
      }
      
      toast.success('Campagne créée');
      
      // Envoyer immédiatement si pas de date planifiée
      if (!newCampagne.date_envoi) {
        const sendResult = await handleEnvoyer(data.id);
        if (sendResult) {
          // Réinitialiser seulement si envoi réussi
          setNewCampagne({ titre: '', type: 'email', message: '', image_url: '', destinataires: [], date_envoi: '', enable_rsvp: false });
          setContacts([]);
        }
      } else {
        await loadCampagnes();
        setNewCampagne({ titre: '', type: 'email', message: '', image_url: '', destinataires: [], date_envoi: '', enable_rsvp: false });
        setContacts([]);
      }
    } catch (error) {
      console.error('Erreur complète:', error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const mockUrl = URL.createObjectURL(file);
      setNewCampagne({...newCampagne, image_url: mockUrl});
      toast.success('Image ajoutée');
    } catch (error) {
      toast.error('Erreur upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEnvoyer = async (campagneId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/campagnes/${campagneId}/envoyer`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(`Erreur envoi: ${data.detail || 'Échec'}`);
        return false;
      }
      
      toast.success(`${data.count} message(s) envoyé(s)`);
      await loadCampagnes();
      return true;
    } catch (error) {
      console.error('Erreur envoi:', error);
      toast.error(`Erreur: ${error.message}`);
      return false;
    }
  };

  const personalizeMessage = (message) => {
    return message
      .replace('{prenom}', '<span class="text-blue-600">{prénom}</span>')
      .replace('{nom}', '<span class="text-blue-600">{nom}</span>');
  };

  return (
    <EventsLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/events-management')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Communication en Masse</h1>
            <p className="text-gray-500">Envoyez des emails et SMS à vos membres</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Nouvelle campagne</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCampagne} className="space-y-4">
                  <div>
                    <Label>Titre de la campagne *</Label>
                    <Input
                      value={newCampagne.titre}
                      onChange={(e) => setNewCampagne({...newCampagne, titre: e.target.value})}
                      placeholder="Ex: Invitation culte spécial"
                      required
                    />
                  </div>

                  <div>
                    <Label>Type de communication *</Label>
                    <Select value={newCampagne.type} onValueChange={(val) => setNewCampagne({...newCampagne, type: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">📧 Email uniquement</SelectItem>
                        <SelectItem value="sms">📱 SMS uniquement</SelectItem>
                        <SelectItem value="both">📧📱 Email + SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Ajouter une image/affiche (optionnel)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    {uploadingImage && <p className="text-xs text-gray-500 mt-1">Chargement...</p>}
                    {newCampagne.image_url && (
                      <div className="mt-2 relative inline-block">
                        <img src={newCampagne.image_url} alt="Preview" className="max-w-full h-32 object-contain border rounded" />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1"
                          onClick={() => setNewCampagne({...newCampagne, image_url: ''})}
                        >
                          X
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Message * (utilisez {'{prenom}'} et {'{nom}'} pour personnaliser)</Label>
                    <Textarea
                      rows={6}
                      value={newCampagne.message}
                      onChange={(e) => setNewCampagne({...newCampagne, message: e.target.value})}
                      placeholder="Bonjour {prenom}, vous êtes invité(e) à..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Aperçu: <span dangerouslySetInnerHTML={{ __html: personalizeMessage(newCampagne.message) }} />
                    </p>
                  </div>

                  <div>
                    <Label>Importer contacts (Excel/CSV) *</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                      />
                      {contacts.length > 0 ? (
                        <Button type="button" variant="outline" disabled>
                          {contacts.length} contact(s)
                        </Button>
                      ) : (
                        <Button type="button" variant="outline" onClick={handleAddTestContact}>
                          + Contact test
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Format Excel: colonnes "prenom", "nom", "email", "telephone" OU cliquez "+ Contact test"
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="rsvp"
                      checked={newCampagne.enable_rsvp}
                      onCheckedChange={(checked) => setNewCampagne({...newCampagne, enable_rsvp: checked})}
                    />
                    <Label htmlFor="rsvp" className="cursor-pointer">
                      Activer les réponses RSVP (Oui/Non/Peut-être)
                    </Label>
                  </div>

                  <Button type="submit" className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Créer et Envoyer
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Campagnes récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {campagnes.slice(0, 5).map((camp) => (
                    <div key={camp.id} className="p-3 border rounded text-sm">
                      <div className="font-semibold">{camp.titre}</div>
                      <div className="text-xs text-gray-500">
                        {camp.type === 'email' ? '📧' : camp.type === 'sms' ? '📱' : '📧📱'} •{' '}
                        {camp.statut === 'envoye' ? '✅ Envoyé' : '📝 Brouillon'}
                      </div>
                    </div>
                  ))}
                  {campagnes.length === 0 && (
                    <p className="text-center text-gray-500 py-4">Aucune campagne</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </EventsLayout>
  );
};

export default CommunicationPage;