import React, { useState, useEffect } from 'react';
import EventsLayout from '@/components/EventsLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Mail, Upload, Send } from 'lucide-react';
import * as XLSX from 'xlsx';

const CommunicationEmailPage = () => {
  const [contacts, setContacts] = useState([]);
  const [newEmail, setNewEmail] = useState({
    titre: '',
    message: '',
    image_url: '',
    destinataires: [],
    date_envoi: ''
  });
  const [campagnes, setCampagnes] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadCampagnes();
  }, []);

  const loadCampagnes = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/events/campagnes`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (!response.ok) {
        console.error('Erreur chargement campagnes');
        return;
      }
      
      const data = await response.json();
      // Filtrer uniquement les emails
      const emailCampagnes = data.filter(c => c.type === 'email' || c.type === 'both');
      setCampagnes(emailCampagnes);
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
          email: row.email || '',
          telephone: ''
        }));
        
        setContacts(formattedContacts);
        setNewEmail({...newEmail, destinataires: formattedContacts});
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
      nom: 'Utilisateur',
      email: 'hassouens@gmail.com',
      telephone: ''
    };
    const updatedContacts = [...contacts, testContact];
    setContacts(updatedContacts);
    setNewEmail({...newEmail, destinataires: updatedContacts});
    toast.success('Contact test ajouté');
  };

  const handlePasteEmails = (pastedText) => {
    if (!pastedText || !pastedText.trim()) {
      toast.error('Aucun texte à coller');
      return;
    }

    const lines = pastedText.split('\n').filter(line => line.trim());
    const newContacts = [];

    lines.forEach((line, index) => {
      line = line.trim();
      const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) {
        newContacts.push({
          prenom: `Contact`,
          nom: `${index + 1}`,
          email: emailMatch[0],
          telephone: ''
        });
      }
    });

    if (newContacts.length > 0) {
      const updatedContacts = [...contacts, ...newContacts];
      setContacts(updatedContacts);
      setNewEmail({...newEmail, destinataires: updatedContacts});
      toast.success(`${newContacts.length} email(s) ajouté(s)`);
    } else {
      toast.error('Aucun email valide détecté');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/events/upload-image`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Upload échoué');
      }

      setNewEmail({...newEmail, image_url: data.url});
      toast.success('Image uploadée');
    } catch (error) {
      toast.error('Erreur upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    
    if (newEmail.destinataires.length === 0) {
      toast.error('Veuillez ajouter au moins un destinataire');
      return;
    }

    try {
      // Créer la campagne
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/events/campagnes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...newEmail,
            type: 'email',
            enable_rsvp: false
          })
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(`Erreur: ${data.detail || 'Création échouée'}`);
        return;
      }

      toast.success('Campagne créée');

      // Envoyer immédiatement
      const sendResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/events/campagnes/${data.id}/envoyer`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      const sendData = await sendResponse.json();
      
      if (!sendResponse.ok) {
        toast.error(`Erreur envoi: ${sendData.detail || 'Échec'}`);
        return;
      }

      toast.success(`✅ ${sendData.count} email(s) envoyé(s)`);
      
      // Réinitialiser
      setNewEmail({ titre: '', message: '', image_url: '', destinataires: [], date_envoi: '' });
      setContacts([]);
      await loadCampagnes();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  return (
    <EventsLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">📧 Envoi d'Emails en Masse</h1>
          </div>
          <p className="text-gray-600">
            Envoyez des emails personnalisés à votre communauté avec images et suivi
          </p>
        </div>

        {/* Formulaire d'envoi */}
        <form onSubmit={handleSendEmail} className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Nouvelle Campagne Email</h2>
          
          <div className="space-y-4">
            {/* Titre */}
            <div>
              <Label>Titre de la campagne *</Label>
              <Input
                value={newEmail.titre}
                onChange={(e) => setNewEmail({...newEmail, titre: e.target.value})}
                placeholder="Ex: Invitation culte de dimanche"
                required
              />
            </div>

            {/* Message */}
            <div>
              <Label>Message *</Label>
              <Textarea
                value={newEmail.message}
                onChange={(e) => setNewEmail({...newEmail, message: e.target.value})}
                placeholder="Bonjour {prenom},&#10;&#10;Nous avons le plaisir de vous inviter..."
                rows={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Utilisez {'{prenom}'} et {'{nom}'} pour personnaliser
              </p>
            </div>

            {/* Image */}
            <div>
              <Label>Image (optionnel)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              {uploadingImage && <p className="text-xs text-gray-500 mt-1">Upload en cours...</p>}
              {newEmail.image_url && (
                <p className="text-xs text-green-600 mt-1">✅ Image uploadée</p>
              )}
            </div>

            {/* Import contacts */}
            <div>
              <Label>Destinataires *</Label>
              
              {/* Option 1: Fichier Excel */}
              <div className="flex gap-2 mb-3">
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
              
              {/* Option 2: Copier-coller */}
              <div className="border rounded-lg p-3 bg-gray-50">
                <Label className="text-sm font-medium mb-2 block">
                  📋 Ou coller une liste d'emails
                </Label>
                <Textarea
                  placeholder="Collez vos emails ici (un par ligne):&#10;exemple@email.com&#10;contact@church.org"
                  rows={4}
                  className="bg-white"
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    handlePasteEmails(pastedText);
                  }}
                />
              </div>
            </div>

            {/* Bouton envoi */}
            <Button type="submit" className="w-full" size="lg">
              <Send className="w-4 h-4 mr-2" />
              Créer et Envoyer Email
            </Button>
          </div>
        </form>

        {/* Historique */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📨 Emails Récents</h2>
          {campagnes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucun email envoyé</p>
          ) : (
            <div className="space-y-3">
              {campagnes.slice(0, 10).map((campagne) => (
                <div key={campagne.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{campagne.titre}</h3>
                      <p className="text-sm text-gray-600">
                        {campagne.destinataires?.length || 0} destinataire(s)
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm ${
                      campagne.statut === 'envoye' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {campagne.statut === 'envoye' ? '✅ Envoyé' : '⏳ En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </EventsLayout>
  );
};

export default CommunicationEmailPage;
