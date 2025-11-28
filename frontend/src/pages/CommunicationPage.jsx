import React, { useState, useEffect } from 'react';
import EventsLayout from '../components/EventsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Mail, MessageSquare, Upload, Send, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '../utils/api';
import * as XLSX from 'xlsx';

const CommunicationPage = () => {
  const user = getUser();
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
      setCampagnes(data);
    } catch (error) {
      toast.error('Erreur chargement');
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
        
        // Map columns: prenom, nom, email, telephone
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

  const handleCreateCampagne = async (e) => {
    e.preventDefault();
    if (newCampagne.destinataires.length === 0) {
      toast.error('Veuillez importer des contacts');
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
      
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Erreur: ${errorData.detail || 'Création échouée'}`);
        return;
      }
      
      const data = await response.json();
      toast.success('Campagne créée');
      
      // Envoyer immédiatement si pas de date planifiée
      if (!newCampagne.date_envoi) {
        await handleEnvoyer(data.id);
      }
      
      loadCampagnes();
      setNewCampagne({ titre: '', type: 'email', message: '', image_url: '', destinataires: [], date_envoi: '', enable_rsvp: false });
      setContacts([]);
    } catch (error) {
      console.error('Erreur complète:', error);
      toast.error(`Erreur création: ${error.message}`);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // For testing purposes, we'll just create a mock URL
      // In production, this would upload to a cloud service
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
      toast.success(`${data.count} messages envoyés`);
      loadCampagnes();
    } catch (error) {
      toast.error('Erreur envoi');
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
        <div>
          <h1 className="text-3xl font-bold">Communication en Masse</h1>
          <p className="text-gray-500">Envoyez des emails et SMS avec suivi RSVP</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Nouvelle Campagne</CardTitle></CardHeader>
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
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <Button type="button" variant="outline" size="sm">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Format requis: colonnes "prenom", "nom", "email", "telephone"
                    </p>
                    {contacts.length > 0 && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                        ✓ {contacts.length} contacts importés
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rsvp"
                      checked={newCampagne.enable_rsvp}
                      onChange={(e) => setNewCampagne({...newCampagne, enable_rsvp: e.target.checked})}
                    />
                    <Label htmlFor="rsvp">Activer les réponses RSVP (Oui/Non/Peut-être)</Label>
                  </div>

                  <div>
                    <Label>Envoyer plus tard (optionnel)</Label>
                    <Input
                      type="datetime-local"
                      value={newCampagne.date_envoi}
                      onChange={(e) => setNewCampagne({...newCampagne, date_envoi: e.target.value})}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    {newCampagne.date_envoi ? 'Planifier l\'envoi' : 'Envoyer maintenant'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Campagnes récentes */}
          <div>
            <Card>
              <CardHeader><CardTitle>Campagnes récentes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campagnes.slice(0, 5).map((camp) => (
                    <div key={camp.id} className="border rounded p-3">
                      <div className="font-semibold text-sm">{camp.titre}</div>
                      <div className="text-xs text-gray-500">
                        {camp.type === 'email' ? '📧' : camp.type === 'sms' ? '📱' : '📧📱'} {camp.statut}
                      </div>
                      {camp.statut === 'envoye' && (
                        <div className="text-xs mt-1">
                          Envoyés: {camp.stats?.envoyes || 0} • Oui: {camp.stats?.oui || 0} • Non: {camp.stats?.non || 0}
                        </div>
                      )}
                      {camp.statut === 'brouillon' && (
                        <Button size="sm" onClick={() => handleEnvoyer(camp.id)} className="mt-2 w-full">
                          Envoyer
                        </Button>
                      )}
                    </div>
                  ))}
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