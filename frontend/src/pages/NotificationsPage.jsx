import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Bell, Send, Calendar, Users, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [cities, setCities] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newNotif, setNewNotif] = useState({
    title: '',
    message: '',
    department: '',
    city: '',
    event_id: '',
    target_users: [],
    target_roles: [],
    send_to_all: false,
    scheduled_at: ''
  });

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Départements disponibles
  const departments = [
    'Accueil Intégration',
    'Bergerie',
    'Familles d\'Impact',
    'Accès Spécifiques',
    'Accès Bergers',
    'Dynamique Évangélisation',
    'My Event Church'
  ];

  // Rôles disponibles
  const roles = [
    'super_admin',
    'pasteur',
    'admin',
    'accueil',
    'promotions',
    'referent',
    'responsable_promo',
    'responsable_eglise',
    'berger'
  ];

  useEffect(() => {
    loadNotifications();
    loadUsers();
    loadCities();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCities = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/cities`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCities(data);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const handleCreateNotification = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${backendUrl}/api/notifications/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newNotif)
      });

      if (!response.ok) throw new Error('Erreur création');

      const data = await response.json();
      toast.success('✅ Notification créée !');
      
      // Envoyer immédiatement si pas programmée
      if (!newNotif.scheduled_at) {
        await sendNotification(data.id);
      }
      
      setIsDialogOpen(false);
      setNewNotif({
        title: '',
        message: '',
        department: '',
        city: '',
        event_id: '',
        target_users: [],
        target_roles: [],
        send_to_all: false,
        scheduled_at: ''
      });
      loadNotifications();
    } catch (error) {
      toast.error('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (notifId) => {
    try {
      const response = await fetch(`${backendUrl}/api/notifications/${notifId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      toast.success(`📨 ${data.message}`);
      loadNotifications();
    } catch (error) {
      toast.error('Erreur envoi');
    }
  };

  const deleteNotification = async (notifId) => {
    if (!window.confirm('Supprimer cette notification?')) return;
    
    try {
      await fetch(`${backendUrl}/api/notifications/${notifId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('✅ Supprimée');
      loadNotifications();
    } catch (error) {
      toast.error('Erreur suppression');
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications Push
          </h1>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-indigo-600">
            <Bell className="h-4 w-4 mr-2" />
            Nouvelle Notification
          </Button>
        </div>

        {/* Historique des notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune notification envoyée</p>
            ) : (
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div key={notif.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold">{notif.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs ${
                            notif.status === 'sent' ? 'bg-green-100 text-green-800' :
                            notif.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            notif.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {notif.status === 'sent' ? 'Envoyée' :
                             notif.status === 'scheduled' ? 'Programmée' :
                             notif.status === 'failed' ? 'Échec' : 'En attente'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{notif.message}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          {notif.department && <span>📍 {notif.department}</span>}
                          {notif.city && <span>🏙️ {notif.city}</span>}
                          {notif.send_to_all && <span>👥 Tous les utilisateurs</span>}
                          <span>📤 {notif.sent_count || 0} envoyées</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {notif.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => sendNotification(notif.id)}
                            className="bg-green-600"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteNotification(notif.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog Création Notification */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setNewNotif({
              title: '',
              message: '',
              department: '',
              city: '',
              event_id: '',
              target_users: [],
              target_roles: [],
              send_to_all: false,
              scheduled_at: ''
            });
          }
          setIsDialogOpen(open);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une Notification</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Titre de la notification</Label>
                <Input
                  value={newNotif.title}
                  onChange={(e) => setNewNotif({...newNotif, title: e.target.value})}
                  placeholder="Ex: Nouvel événement ce dimanche"
                />
              </div>

              <div>
                <Label>Message</Label>
                <Textarea
                  value={newNotif.message}
                  onChange={(e) => setNewNotif({...newNotif, message: e.target.value})}
                  placeholder="Votre message ici..."
                  rows={4}
                />
              </div>

              {/* Ciblage */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">🎯 Ciblage</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="send_to_all"
                      checked={newNotif.send_to_all}
                      onChange={(e) => setNewNotif({...newNotif, send_to_all: e.target.checked})}
                      className="h-4 w-4"
                    />
                    <label htmlFor="send_to_all" className="cursor-pointer font-medium">
                      👥 Envoyer à tous les utilisateurs
                    </label>
                  </div>

                  {!newNotif.send_to_all && (
                    <>
                      <div>
                        <Label>Département</Label>
                        <select
                          value={newNotif.department}
                          onChange={(e) => setNewNotif({...newNotif, department: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="">Tous les départements</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Ville</Label>
                        <select
                          value={newNotif.city}
                          onChange={(e) => setNewNotif({...newNotif, city: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="">Toutes les villes</option>
                          {cities.map(city => (
                            <option key={city.id} value={city.city}>{city.city}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Rôles ciblés (maintenez Ctrl pour sélection multiple)</Label>
                        <select
                          multiple
                          value={newNotif.target_roles}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            setNewNotif({...newNotif, target_roles: selected});
                          }}
                          className="w-full px-3 py-2 border rounded-lg"
                          size={5}
                        >
                          {roles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Programmation */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">⏰ Programmation (optionnel)</h3>
                <div>
                  <Label>Date et heure d'envoi</Label>
                  <Input
                    type="datetime-local"
                    value={newNotif.scheduled_at}
                    onChange={(e) => setNewNotif({...newNotif, scheduled_at: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laissez vide pour envoyer immédiatement
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateNotification}
                  disabled={loading || !newNotif.title || !newNotif.message}
                  className="flex-1 bg-indigo-600"
                >
                  {loading ? 'Envoi...' : newNotif.scheduled_at ? 'Programmer' : 'Créer et Envoyer'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default NotificationsPage;
