import React, { useState, useEffect } from 'react';
import EventsLayout from '@/components/EventsLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageSquare, Send, Info, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const CommunicationSMSPage = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [newSMS, setNewSMS] = useState({
    titre: '',
    message: '',
    destinataires: [],
    enable_rsvp: false
  });
  const [campagnes, setCampagnes] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [contactGroups, setContactGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');

  useEffect(() => {
    loadCampagnes();
    loadContactGroups();
  }, []);

  const loadContactGroups = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/contact-groups-sms`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setContactGroups(data);
      }
    } catch (error) {
      console.error('Erreur chargement boxes SMS:', error);
    }
  };

  const handleSelectGroup = (groupId) => {
    const group = contactGroups.find(g => g.id === groupId);
    if (group) {
      setContacts(group.contacts);
      setNewSMS({...newSMS, destinataires: group.contacts});
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
      const smsCampagnes = data.filter(c => c.type === 'sms' || c.type === 'both');
      setCampagnes(smsCampagnes);
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
        setNewSMS({...newSMS, destinataires: formattedContacts});
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
      nom: 'Mobile',
      email: '',
      telephone: '0646989818'
    };
    const updatedContacts = [...contacts, testContact];
    setContacts(updatedContacts);
    setNewSMS({...newSMS, destinataires: updatedContacts});
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

    if (newContacts.length > 0) {
      const updatedContacts = [...contacts, ...newContacts];
      setContacts(updatedContacts);
      setNewSMS({...newSMS, destinataires: updatedContacts});
      toast.success(`${newContacts.length} numéro(s) ajouté(s)`);
    } else {
      toast.error('Aucun numéro valide détecté');
    }
  };

  const handleSendSMS = async (e) => {
    e.preventDefault();
    
    if (newSMS.destinataires.length === 0) {
      toast.error('Veuillez ajouter au moins un destinataire');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/events/campagnes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...newSMS,
            type: 'sms',
            image_url: '',
            date_envoi: ''
          })
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(`Erreur: ${data.detail || 'Création échouée'}`);
        return;
      }

      toast.success('Campagne SMS créée');

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

      toast.success(`✅ ${sendData.count} SMS envoyé(s)`);
      
      setNewSMS({ titre: '', message: '', destinataires: [], enable_rsvp: false });
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
            <MessageSquare className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold">📱 Envoi de SMS en Masse</h1>
          </div>
          <p className="text-gray-600">
            Envoyez des SMS personnalisés via Brevo à votre communauté
          </p>
        </div>

        {/* Guide Brevo */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>💡 Comment configurer l'envoi de SMS avec Brevo ?</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowGuide(!showGuide)}
            >
              {showGuide ? 'Masquer' : 'Voir le guide'}
            </Button>
          </AlertTitle>
          {showGuide && (
            <AlertDescription className="mt-3 space-y-3">
              <div className="bg-white p-4 rounded border">
                <h4 className="font-semibold mb-2">📌 Étape 1 : Créer un compte Brevo</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Allez sur <a href="https://www.brevo.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">www.brevo.com</a></li>
                  <li>Créez un compte gratuit (offre 300 emails/jour gratuits)</li>
                  <li>Vérifiez votre email</li>
                </ol>
              </div>

              <div className="bg-white p-4 rounded border">
                <h4 className="font-semibold mb-2">📌 Étape 2 : Activer les SMS</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Connectez-vous à votre compte Brevo</li>
                  <li>Allez dans "Transactional" → "SMS"</li>
                  <li>Activez le service SMS (nécessite validation + crédit)</li>
                  <li>Achetez des crédits SMS (environ 0,05€ par SMS en France)</li>
                </ol>
              </div>

              <div className="bg-white p-4 rounded border">
                <h4 className="font-semibold mb-2">📌 Étape 3 : Configurer le numéro expéditeur</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Dans Brevo, allez dans "SMS" → "Expéditeurs"</li>
                  <li>Ajoutez votre numéro expéditeur : <strong>0646989818</strong></li>
                  <li>Vérifiez le numéro (SMS de confirmation)</li>
                  <li>Attendez la validation Brevo (24-48h)</li>
                </ol>
              </div>

              <div className="bg-white p-4 rounded border">
                <h4 className="font-semibold mb-2">📌 Étape 4 : Obtenir votre clé API</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Cliquez sur votre nom en haut à droite</li>
                  <li>Allez dans "Clés API SMTP & API"</li>
                  <li>Copiez votre clé API (elle commence par "xkeysib-")</li>
                  <li>Cette clé est déjà configurée dans l'application ✅</li>
                </ol>
              </div>

              <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                <h4 className="font-semibold mb-2 text-yellow-800">⚠️ Important à savoir</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                  <li><strong>Coût :</strong> ~0,05€ par SMS en France (variable selon le pays)</li>
                  <li><strong>Limite :</strong> 160 caractères par SMS (au-delà = 2 SMS)</li>
                  <li><strong>Format :</strong> Les numéros doivent être au format international (+33...)</li>
                  <li><strong>Validation :</strong> Le numéro expéditeur doit être validé par Brevo</li>
                  <li><strong>Délai :</strong> Envoi quasi instantané une fois configuré</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded border border-green-200">
                <h4 className="font-semibold mb-2 text-green-800">✅ Configuration actuelle</h4>
                <p className="text-sm text-green-800">
                  • Clé API : Configurée ✅<br />
                  • Numéro expéditeur : 0646989818 ✅<br />
                  • SDK Brevo : Installé ✅<br />
                  • Prêt à envoyer : Une fois le numéro validé par Brevo
                </p>
              </div>
            </AlertDescription>
          )}
        </Alert>

        {/* Formulaire */}
        <form onSubmit={handleSendSMS} className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Nouvelle Campagne SMS</h2>
          
          <div className="space-y-4">
            <div>
              <Label>Titre de la campagne *</Label>
              <Input
                value={newSMS.titre}
                onChange={(e) => setNewSMS({...newSMS, titre: e.target.value})}
                placeholder="Ex: Rappel culte de dimanche"
                required
              />
            </div>

            <div>
              <Label>Message SMS * (max 160 caractères)</Label>
              <Textarea
                value={newSMS.message}
                onChange={(e) => setNewSMS({...newSMS, message: e.target.value})}
                placeholder="Bonjour {prenom}, rappel: culte dimanche 10h à l'église. À bientôt!"
                rows={4}
                maxLength={160}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {newSMS.message.length}/160 caractères • 
                💡 Utilisez {'{prenom}'} et {'{nom}'} pour personnaliser
              </p>
            </div>

            <div>
              <Label>Destinataires *</Label>
              
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
              
              <div className="border rounded-lg p-3 bg-gray-50">
                <Label className="text-sm font-medium mb-2 block">
                  📋 Coller vos contacts ici (un par ligne)
                </Label>
                <Textarea
                  placeholder="Format accepté (un contact par ligne):&#10;&#10;Prénom Nom 0612345678&#10;Jean Dupont +33687654321&#10;Marie Martin 0698765432&#10;&#10;OU juste les numéros:&#10;0612345678&#10;&#10;Maximum 300 contacts"
                  rows={8}
                  className="bg-white font-mono text-sm"
                  onChange={(e) => {
                    const text = e.target.value;
                    const lines = text.split('\n').filter(line => line.trim());
                    
                    if (lines.length > 300) {
                      toast.error('Maximum 300 contacts autorisés');
                      return;
                    }
                    
                    const newContacts = [];
                    lines.forEach((line, index) => {
                      line = line.trim();
                      const phoneMatch = line.match(/[\d\s+()-]{8,}/);
                      
                      if (phoneMatch) {
                        const phoneClean = phoneMatch[0].replace(/[^\d+]/g, '');
                        if (phoneClean.length >= 8) {
                          // Extraire prénom et nom si présents
                          const beforePhone = line.substring(0, line.indexOf(phoneMatch[0])).trim();
                          const parts = beforePhone.split(/\s+/);
                          
                          let prenom = 'Contact';
                          let nom = `${index + 1}`;
                          
                          if (parts.length >= 2) {
                            prenom = parts[0];
                            nom = parts.slice(1).join(' ');
                          } else if (parts.length === 1 && parts[0]) {
                            prenom = parts[0];
                            nom = '';
                          }
                          
                          newContacts.push({
                            prenom: prenom,
                            nom: nom,
                            email: '',
                            telephone: phoneClean
                          });
                        }
                      }
                    });
                    
                    setContacts(newContacts);
                    setNewSMS({...newSMS, destinataires: newContacts});
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {contacts.length}/300 contacts détectés • Formats : 0612345678 ou +33612345678
                  {contacts.length >= 300 && <span className="text-red-600 ml-2">⚠️ Limite atteinte</span>}
                </p>
              </div>
            </div>

            {/* Case RSVP */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enable_rsvp_sms"
                checked={newSMS.enable_rsvp || false}
                onChange={(e) => setNewSMS({...newSMS, enable_rsvp: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <Label htmlFor="enable_rsvp_sms" className="cursor-pointer">
                ✅ Ajouter lien RSVP (Oui / Non / Peut-être)
              </Label>
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Send className="w-4 h-4 mr-2" />
              Créer et Envoyer SMS
            </Button>
          </div>
        </form>

        {/* Historique */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📲 SMS Récents</h2>
          {campagnes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucun SMS envoyé</p>
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
                      <p className="text-sm text-gray-500 mt-1">
                        {campagne.message?.substring(0, 50)}...
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

export default CommunicationSMSPage;
