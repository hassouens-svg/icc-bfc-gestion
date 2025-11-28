import React, { useState, useEffect } from 'react';
import EventsLayout from '@/components/EventsLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FolderOpen, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

const ContactGroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    contacts_text: ''
  });
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/contact-groups`,
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

  const parseContacts = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const contacts = [];
    
    lines.forEach((line, index) => {
      line = line.trim();
      const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
      
      if (emailMatch) {
        const email = emailMatch[0];
        const beforeEmail = line.substring(0, line.indexOf(email)).trim();
        const parts = beforeEmail.split(/\s+/);
        
        let prenom = 'Contact';
        let nom = `${index + 1}`;
        
        if (parts.length >= 2) {
          prenom = parts[0];
          nom = parts.slice(1).join(' ');
        } else if (parts.length === 1 && parts[0]) {
          prenom = parts[0];
          nom = '';
        }
        
        contacts.push({ prenom, nom, email, telephone: '' });
      }
    });
    
    return contacts;
  };

  const handleCreate = async () => {
    if (!newGroup.name || !newGroup.contacts_text) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const contacts = parseContacts(newGroup.contacts_text);
    if (contacts.length === 0) {
      toast.error('Aucun email valide détecté');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/contact-groups`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: newGroup.name,
            contacts: contacts
          })
        }
      );

      if (response.ok) {
        toast.success(`Box "${newGroup.name}" créée avec ${contacts.length} contact(s)`);
        setNewGroup({ name: '', contacts_text: '' });
        setShowCreate(false);
        loadGroups();
      }
    } catch (error) {
      toast.error('Erreur création');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Supprimer la box "${name}" ?`)) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/contact-groups/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.ok) {
        toast.success('Box supprimée');
        loadGroups();
      }
    } catch (error) {
      toast.error('Erreur suppression');
    }
  };

  return (
    <EventsLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="outline" onClick={() => window.history.back()}>
                ← Retour
              </Button>
              <h1 className="text-3xl font-bold">📦 Boxes Email</h1>
            </div>
            <p className="text-gray-600">Créez des groupes de contacts email réutilisables</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Box
          </Button>
        </div>

        {/* Formulaire création */}
        {showCreate && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Créer une Box</h2>
            
            <div className="space-y-4">
              <div>
                <Label>Nom de la Box *</Label>
                <Input
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  placeholder="Ex: Jeunes, Équipe louange, Pasteurs..."
                  maxLength={50}
                />
              </div>

              <div>
                <Label>Contacts (Prénom Nom email) *</Label>
                <Textarea
                  value={newGroup.contacts_text}
                  onChange={(e) => setNewGroup({...newGroup, contacts_text: e.target.value})}
                  placeholder="Format: Prénom Nom email@domain.com (un par ligne)&#10;&#10;Jean Dupont jean@church.org&#10;Marie Martin marie@church.org&#10;Paul Dubois paul@church.org"
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {parseContacts(newGroup.contacts_text).length} contact(s) détecté(s)
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreate}>
                  <Save className="w-4 h-4 mr-2" />
                  Créer la Box
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowCreate(false);
                  setNewGroup({ name: '', contacts_text: '' });
                }}>
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-gray-500">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Aucune box créée</p>
              <p className="text-sm">Cliquez sur "Nouvelle Box" pour commencer</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-purple-600" />
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {group.contacts?.length || 0} contact(s)
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(group.id, group.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Aperçu contacts */}
                <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                  {group.contacts?.slice(0, 5).map((contact, idx) => (
                    <div key={idx} className="text-xs text-gray-600">
                      • {contact.prenom} {contact.nom} - {contact.email}
                    </div>
                  ))}
                  {group.contacts?.length > 5 && (
                    <div className="text-xs text-gray-400 mt-1">
                      ... et {group.contacts.length - 5} autre(s)
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </EventsLayout>
  );
};

export default ContactGroupsPage;
