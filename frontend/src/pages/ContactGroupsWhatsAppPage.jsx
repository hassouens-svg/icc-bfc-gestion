import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EventsLayout from '@/components/EventsLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FolderOpen, Plus, Trash2, Edit, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as XLSX from 'xlsx';

const ContactGroupsWhatsAppPage = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    contacts: []
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/contact-groups-whatsapp`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
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
        
        setNewGroup({...newGroup, contacts: formattedContacts});
        toast.success(`${formattedContacts.length} contact(s) importé(s)`);
      } catch (error) {
        toast.error('Erreur lors de la lecture du fichier');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error('Veuillez entrer un nom pour la Box');
      return;
    }

    if (newGroup.contacts.length === 0) {
      toast.error('Veuillez ajouter au moins un contact');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/contact-groups-whatsapp`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newGroup)
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la création');
      }

      toast.success('Box WhatsApp créée avec succès');
      setNewGroup({ name: '', contacts: [] });
      setShowCreateForm(false);
      loadGroups();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette Box ?')) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/contact-groups-whatsapp/${groupId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      toast.success('Box supprimée');
      loadGroups();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <EventsLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FolderOpen className="h-8 w-8 text-emerald-600" />
              💬 Boxes WhatsApp
            </h1>
            <p className="text-gray-500 mt-1">
              Gérer vos groupes de contacts WhatsApp
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Box
          </Button>
        </div>

        {/* Formulaire de création */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Créer une nouvelle Box WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="group-name">Nom de la Box</Label>
                <Input
                  id="group-name"
                  placeholder="Ex: Membres actifs"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="file-upload">Importer les contacts (Excel)</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Fichier Excel avec colonnes: prenom, nom, telephone
                </p>
              </div>

              {newGroup.contacts.length > 0 && (
                <div className="border rounded p-3 bg-gray-50">
                  <p className="text-sm font-medium mb-2">
                    {newGroup.contacts.length} contact(s) importé(s)
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {newGroup.contacts.slice(0, 5).map((contact, index) => (
                      <p key={index} className="text-xs text-gray-600">
                        {contact.prenom} {contact.nom} - {contact.telephone}
                      </p>
                    ))}
                    {newGroup.contacts.length > 5 && (
                      <p className="text-xs text-gray-500">
                        ... et {newGroup.contacts.length - 5} autre(s)
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateGroup}
                  disabled={!newGroup.name || newGroup.contacts.length === 0}
                >
                  Créer la Box
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewGroup({ name: '', contacts: [] });
                  }}
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-emerald-500" />
                  {group.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  {group.contacts.length} contact(s)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigate('/events/whatsapp');
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Utiliser
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {groups.length === 0 && !showCreateForm && (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucune Box WhatsApp pour le moment</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer votre première Box
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </EventsLayout>
  );
};

export default ContactGroupsWhatsAppPage;
