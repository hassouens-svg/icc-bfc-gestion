import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EventsLayout from '@/components/EventsLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageCircle, Send, Info, ExternalLink, FolderOpen, CheckCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as XLSX from 'xlsx';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CommunicationWhatsAppPage = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [newWhatsApp, setNewWhatsApp] = useState({
    titre: '',
    message: '',
    destinataires: [],
    template_id: ''
  });
  const [campagnes, setCampagnes] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [contactGroups, setContactGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadCampagnes();
    loadContactGroups();
  }, []);

  const loadContactGroups = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/contact-groups-whatsapp`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setContactGroups(data);
      }
    } catch (error) {
      console.error('Erreur chargement boxes WhatsApp:', error);
    }
  };

  const handleSelectGroup = (groupId) => {
    const group = contactGroups.find(g => g.id === groupId);
    if (group) {
      setContacts(group.contacts);
      setNewWhatsApp({...newWhatsApp, destinataires: group.contacts});
      toast.success(`Box "${group.name}" sélectionnée (${group.contacts.length} contacts)`);
    }
  };

  const loadCampagnes = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/events/campagnes`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      const whatsappCampagnes = data.filter(c => c.type === 'whatsapp');
      setCampagnes(whatsappCampagnes);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        const formattedContacts = jsonData.map(row => ({
          prenom: row.prenom || '',
          nom: row.nom || '',
          email: '',
          telephone: row.telephone || ''
        }));
        
        setContacts(formattedContacts);
        setNewWhatsApp({...newWhatsApp, destinataires: formattedContacts});
        toast.success(`${formattedContacts.length} contact(s) importé(s)`);
      } catch (error) {
        toast.error('Erreur lors de la lecture du fichier');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddTestContact = () => {
    const testContact = {
      prenom: 'Test',
      nom: 'WhatsApp',
      email: '',
      telephone: '0646989818'
    };
    const updatedContacts = [...contacts, testContact];
    setContacts(updatedContacts);
    setNewWhatsApp({...newWhatsApp, destinataires: updatedContacts});
    toast.success('Contact test ajouté');
  };

  const handlePastePhones = (pastedText) => {
    if (!pastedText || !pastedText.trim()) {
      toast.error('Aucun texte à coller');
      return;
    }

    const lines = pastedText.split('\n').filter(line => line.trim());
    const newContacts = [];

    lines.forEach((line, index) => {
      line = line.trim();
      if (line.match(/[\d\s+()-]{8,}/)) {
        const phoneClean = line.replace(/[^\d+]/g, '');
        if (phoneClean.length >= 8) {
          newContacts.push({
            prenom: `Contact`,
            nom: `${index + 1}`,
            email: '',
            telephone: phoneClean
          });
        }
      }
    });

    if (newContacts.length === 0) {
      toast.error('Aucun numéro de téléphone détecté');
      return;
    }

    const updatedContacts = [...contacts, ...newContacts];
    setContacts(updatedContacts);
    setNewWhatsApp({...newWhatsApp, destinataires: updatedContacts});
    toast.success(`${newContacts.length} numéro(s) ajouté(s)`);
  };

  const handleSendWhatsApp = async () => {
    if (!newWhatsApp.titre.trim()) {
      toast.error('Veuillez entrer un titre de campagne');
      return;
    }

    if (!newWhatsApp.message.trim()) {
      toast.error('Veuillez entrer un message');
      return;
    }

    if (newWhatsApp.destinataires.length === 0) {
      toast.error('Veuillez ajouter au moins un contact');
      return;
    }

    setSending(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/events/whatsapp/send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newWhatsApp)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Erreur lors de l\'envoi');
      }

      toast.success(`✅ ${result.success_count} message(s) WhatsApp envoyé(s) avec succès !`);
      if (result.failed_count > 0) {
        toast.warning(`⚠️ ${result.failed_count} message(s) n'ont pas pu être envoyé(s)`);
      }

      // Reset form
      setNewWhatsApp({
        titre: '',
        message: '',
        destinataires: [],
        template_id: ''
      });
      setContacts([]);
      loadCampagnes();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  return (
    <EventsLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageCircle className="h-8 w-8 text-emerald-600" />
              💬 Campagne WhatsApp
            </h1>
            <p className="text-gray-500 mt-1">
              Envoyer des messages WhatsApp via Brevo
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowGuide(!showGuide)}
          >
            <Info className="h-4 w-4 mr-2" />
            {showGuide ? 'Masquer le guide' : 'Afficher le guide'}
          </Button>
        </div>

        {/* Guide d'intégration Brevo */}
        {showGuide && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>📱 Guide d'intégration Brevo WhatsApp</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <p><strong>Pour utiliser WhatsApp avec Brevo :</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Créez un compte sur <a href="https://www.brevo.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">Brevo <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li>Allez dans <strong>Conversations → WhatsApp</strong></li>
                <li>Connectez votre compte WhatsApp Business</li>
                <li>Créez des modèles de messages (templates) approuvés par WhatsApp</li>
                <li>Récupérez votre <strong>API Key</strong> dans Paramètres → API Keys</li>
                <li>Ajoutez votre clé API dans les variables d'environnement du backend : <code className="bg-gray-100 px-2 py-1 rounded">BREVO_API_KEY</code></li>
              </ol>
              <p className="text-sm text-gray-600 mt-3">
                ⚠️ <strong>Important :</strong> WhatsApp nécessite l'utilisation de modèles pré-approuvés. Vous devez d'abord créer et faire approuver vos templates dans Brevo avant de pouvoir envoyer des messages.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Formulaire d'envoi */}
        <Card>
          <CardHeader>
            <CardTitle>Créer une nouvelle campagne WhatsApp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Titre de la campagne */}
            <div>
              <Label htmlFor="titre">Titre de la campagne</Label>
              <Input
                id="titre"
                type="text"
                placeholder="Ex: Invitation événement spécial"
                value={newWhatsApp.titre}
                onChange={(e) => setNewWhatsApp({...newWhatsApp, titre: e.target.value})}
                className="mt-1"
              />
            </div>

            {/* Template ID (optionnel) */}
            <div>
              <Label htmlFor="template_id">ID du modèle Brevo (optionnel)</Label>
              <Input
                id="template_id"
                type="text"
                placeholder="Ex: welcome_template_1"
                value={newWhatsApp.template_id}
                onChange={(e) => setNewWhatsApp({...newWhatsApp, template_id: e.target.value})}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Si vous utilisez un template Brevo, entrez son ID ici
              </p>
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Votre message WhatsApp..."
                value={newWhatsApp.message}
                onChange={(e) => setNewWhatsApp({...newWhatsApp, message: e.target.value})}
                rows={5}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                {newWhatsApp.message.length} caractères
              </p>
            </div>

            {/* Import contacts */}
            <div className="border-t pt-4">
              <Label>Destinataires ({contacts.length})</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {/* Sélectionner une Box */}
                <div className="flex gap-2 items-center">
                  <FolderOpen className="h-4 w-4 text-gray-500" />
                  <Select value={selectedGroup} onValueChange={(value) => {
                    setSelectedGroup(value);
                    handleSelectGroup(value);
                  }}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Sélectionner une Box" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactGroups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} ({group.contacts.length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/events/contact-groups-whatsapp')}
                  >
                    Gérer les Boxes
                  </Button>
                </div>

                {/* Import Excel */}
                <div>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload-whatsapp"
                  />
                  <Label htmlFor="file-upload-whatsapp">
                    <Button variant="outline" size="sm" as="span" className="cursor-pointer">
                      Importer Excel
                    </Button>
                  </Label>
                </div>

                {/* Coller numéros */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = prompt('Collez vos numéros de téléphone (un par ligne) :');
                    if (text) handlePastePhones(text);
                  }}
                >
                  Coller numéros
                </Button>

                {/* Test */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddTestContact}
                >
                  Ajouter un test
                </Button>

                {/* Vider */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setContacts([]);
                    setNewWhatsApp({...newWhatsApp, destinataires: []});
                    toast.success('Contacts vidés');
                  }}
                >
                  Vider
                </Button>
              </div>

              {/* Liste des contacts */}
              {contacts.length > 0 && (
                <div className="mt-4 max-h-48 overflow-y-auto border rounded p-2 bg-gray-50">
                  {contacts.slice(0, 10).map((contact, index) => (
                    <div key={index} className="text-sm py-1 flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      <span className="font-medium">{contact.prenom} {contact.nom}</span>
                      <span className="text-gray-600">- {contact.telephone}</span>
                    </div>
                  ))}
                  {contacts.length > 10 && (
                    <p className="text-xs text-gray-500 mt-2">
                      ... et {contacts.length - 10} autre(s) contact(s)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bouton d'envoi */}
            <Button
              onClick={handleSendWhatsApp}
              disabled={sending || contacts.length === 0 || !newWhatsApp.message.trim()}
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" />
              {sending ? 'Envoi en cours...' : `Envoyer à ${contacts.length} contact(s)`}
            </Button>
          </CardContent>
        </Card>

        {/* Historique des campagnes */}
        {campagnes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historique des campagnes WhatsApp</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campagnes.slice(0, 5).map((campagne) => (
                  <div 
                    key={campagne.id}
                    className="border rounded p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/events/stats?campaignId=${campagne.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{campagne.titre}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {campagne.message.substring(0, 100)}...
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(campagne.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-600">
                          {campagne.destinataires_count || 0} envois
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </EventsLayout>
  );
};

export default CommunicationWhatsAppPage;
