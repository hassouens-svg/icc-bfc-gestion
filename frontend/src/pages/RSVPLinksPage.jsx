import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EventsLayout from '../components/EventsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, LinkIcon, Share2, Copy, Users, Calendar, MapPin, Clock, Trash2, BarChart, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '../utils/api';

const RSVPLinksPage = () => {
  const user = getUser();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    image_url: '',
    require_names: false
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [eventStats, setEventStats] = useState(null);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Check if user is logged in
  if (!user) {
    useEffect(() => {
      navigate('/login');
    }, [navigate]);
    return null;
  }

  // Check access
  const allowedRoles = ['super_admin', 'pasteur', 'responsable_eglise', 'gestion_projet'];
  if (!allowedRoles.includes(user?.role)) {
    return (
      <EventsLayout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-6xl">🔒</div>
                <h2 className="text-2xl font-bold">Accès Réservé</h2>
                <p className="text-gray-600">
                  Ce module est réservé aux pasteurs, super admins, responsables d'église et gestion projet.
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                  Retour au Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </EventsLayout>
    );
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${backendUrl}/api/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error('Session expirée');
          navigate('/login');
          return;
        }
        throw new Error('Erreur');
      }
      
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${backendUrl}/api/upload-event-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload échoué');

      const data = await response.json();
      setNewEvent({ ...newEvent, image_url: data.image_url });
      toast.success('Image uploadée');
    } catch (error) {
      toast.error('Erreur upload');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      // Clean up empty strings to null for optional fields
      const eventData = {
        ...newEvent,
        description: newEvent.description || null,
        time: newEvent.time || null,
        location: newEvent.location || null,
        image_url: newEvent.image_url || null
      };

      const response = await fetch(`${backendUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.detail || 'Création échouée';
        throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }

      toast.success('✅ Événement créé avec succès !');
      setIsDialogOpen(false);
      setNewEvent({ title: '', description: '', date: '', time: '', location: '', image_url: '', require_names: false });
      loadEvents();
    } catch (error) {
      console.error('Create event error:', error);
      toast.error(error.message || 'Erreur création');
    }
  };

  const handleEditEvent = (event) => {
    setIsEditMode(true);
    setEditingEventId(event.id);
    setNewEvent({
      title: event.title,
      description: event.description || '',
      date: event.date,
      time: event.time || '',
      location: event.location || '',
      image_url: event.image_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        ...newEvent,
        description: newEvent.description || null,
        time: newEvent.time || null,
        location: newEvent.location || null,
        image_url: newEvent.image_url || null
      };

      const response = await fetch(`${backendUrl}/api/events/${editingEventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error('Mise à jour échouée');
      }

      toast.success('✅ Événement mis à jour !');
      setIsDialogOpen(false);
      setIsEditMode(false);
      setEditingEventId(null);
      setNewEvent({ title: '', description: '', date: '', time: '', location: '', image_url: '' });
      loadEvents();
    } catch (error) {
      console.error('Update event error:', error);
      toast.error('Erreur mise à jour');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Supprimer cet événement ?')) return;

    try {
      const response = await fetch(`${backendUrl}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.detail || `Erreur ${response.status}`;
        throw new Error(errorMsg);
      }

      toast.success('Événement supprimé');
      loadEvents();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Erreur suppression: ${error.message}`);
    }
  };

  const getPublicRSVPLink = (eventId) => {
    return `${window.location.origin}/rsvp/${eventId}`;
  };

  const copyToClipboard = (link) => {
    // Créer un élément temporaire avec le lien HTML
    const textToCopy = `Répondre maintenant en cliquant ici: ${link}`;
    
    // Copier le texte avec le lien
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success('Texte avec lien copié !');
    }).catch(() => {
      // Fallback si le clipboard API ne fonctionne pas
      const tempInput = document.createElement('input');
      tempInput.value = textToCopy;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      toast.success('Texte avec lien copié !');
    });
  };

  const shareViaWhatsApp = (event) => {
    const link = getPublicRSVPLink(event.id);
    const message = encodeURIComponent(`🎉 ${event.title}\n\n📅 ${event.date} ${event.time ? 'à ' + event.time : ''}\n📍 ${event.location || ''}\n\nRépondre maintenant en cliquant ici: ${link}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const viewStats = (event) => {
    setSelectedEvent(event);
    loadEventStats(event.id);
  };

  const loadEventStats = async (eventId) => {
    try {
      const response = await fetch(`${backendUrl}/api/events/${eventId}/rsvp`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setEventStats(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <EventsLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </EventsLayout>
    );
  }

  return (
    <EventsLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <LinkIcon className="h-8 w-8 text-pink-600" />
              Liens RSVP
            </h1>
            <p className="text-gray-500 mt-1">Créez des liens partageables pour vos événements</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel Événement
          </Button>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun événement</h3>
              <p className="text-gray-500 mb-4">Créez votre premier événement avec lien RSVP</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un Événement
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                {event.image_url ? (
                  <img 
                    src={event.image_url} 
                    alt={event.title} 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                {!event.image_url && (
                  <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <Calendar className="h-16 w-16 text-indigo-300" />
                  </div>
                )}
                <div className="hidden w-full h-48 bg-gradient-to-br from-indigo-100 to-purple-100 items-center justify-center">
                  <Calendar className="h-16 w-16 text-indigo-300" />
                </div>
                <CardHeader>
                  <CardTitle className="truncate">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{event.date}</span>
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t space-y-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Lien de partage:</p>
                      <a 
                        href={getPublicRSVPLink(event.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-800 underline break-all"
                      >
                        Répondre maintenant en cliquant ici
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => copyToClipboard(getPublicRSVPLink(event.id))}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copier
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => shareViaWhatsApp(event)}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => viewStats(event)}>
                        <BarChart className="h-4 w-4 mr-1" />
                        Stats
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditEvent(event)}>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(event.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setIsEditMode(false);
          setEditingEventId(null);
          setNewEvent({ title: '', description: '', date: '', time: '', location: '', image_url: '' });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Modifier l\'Événement' : 'Créer un Nouvel Événement'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={isEditMode ? handleUpdateEvent : handleCreateEvent} className="space-y-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input required value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Culte Spécial" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" required value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Heure</Label>
                <Input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} />
            </div>
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="require_names"
                checked={newEvent.require_names}
                onChange={(e) => setNewEvent({ ...newEvent, require_names: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="require_names" className="text-sm font-medium text-gray-700 cursor-pointer">
                Demander noms et prénoms dans le formulaire RSVP
              </label>
            </div>
            <div className="space-y-2">
              <Label>Image de l'événement</Label>
              {newEvent.image_url ? (
                <div className="relative">
                  <img 
                    src={newEvent.image_url} 
                    alt="Image de l'événement" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                    onClick={() => document.getElementById('imageUploadInput').click()}
                    disabled={uploadingImage}
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Modifier
                  </Button>
                  <input
                    id="imageUploadInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </div>
              ) : (
                <div>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    disabled={uploadingImage} 
                  />
                  <p className="text-xs text-gray-500 mt-1">Ajoutez une image pour votre événement</p>
                </div>
              )}
              {uploadingImage && (
                <p className="text-sm text-blue-600">Téléchargement en cours...</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={uploadingImage}>
                {isEditMode ? 'Mettre à jour' : 'Créer'}
              </Button>
              <Button type="button" variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setIsEditMode(false);
                setEditingEventId(null);
                setNewEvent({ title: '', description: '', date: '', time: '', location: '', image_url: '' });
              }}>
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Statistiques: {selectedEvent.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {eventStats ? (
                <>
                  <div className="space-y-3">
                    <Card className="border-0 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between gap-4 px-2">
                          <div className="flex flex-col items-center">
                            <p className="text-4xl font-bold text-blue-600">{eventStats.total || 0}</p>
                            <p className="text-xs text-gray-600 mt-1">Envoyés</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <p className="text-4xl font-bold text-green-600">{eventStats.confirmed || 0}</p>
                            <p className="text-xs text-gray-600 mt-1">Oui</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <p className="text-4xl font-bold text-red-600">{eventStats.declined || 0}</p>
                            <p className="text-xs text-gray-600 mt-1">Non</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <p className="text-4xl font-bold text-orange-500">{eventStats.maybe || 0}</p>
                            <p className="text-xs text-gray-600 mt-1">Peut-être</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <p className="text-4xl font-bold text-gray-400">{(eventStats.total - (eventStats.confirmed + eventStats.declined + eventStats.maybe)) || 0}</p>
                            <p className="text-xs text-gray-600 mt-1 text-center">Sans<br/>réponse</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-yellow-50">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-around gap-4">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <span className="text-3xl">⭐</span>
                              <p className="text-3xl font-bold text-yellow-600">
                                {eventStats.responses ? eventStats.responses.filter(r => r.is_star).length : 0}
                              </p>
                            </div>
                            <p className="text-xs text-gray-700 mt-1">STAR</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <span className="text-3xl">👤</span>
                              <p className="text-3xl font-bold text-gray-600">
                                {eventStats.responses ? eventStats.responses.filter(r => !r.is_star).length : 0}
                              </p>
                            </div>
                            <p className="text-xs text-gray-700 mt-1">Non STAR</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {eventStats.responses && eventStats.responses.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 text-sm">Prénom</th>
                            <th className="text-left p-3 text-sm">Nom</th>
                            <th className="text-center p-3 text-sm">⭐</th>
                            <th className="text-left p-3 text-sm">Contact</th>
                            <th className="text-left p-3 text-sm">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventStats.responses.map((rsvp, idx) => (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                              <td className="p-3">{rsvp.first_name || '-'}</td>
                              <td className="p-3">{rsvp.last_name || '-'}</td>
                              <td className="p-3 text-center">
                                {rsvp.is_star && <span className="text-xl">⭐</span>}
                              </td>
                              <td className="p-3 text-sm">{rsvp.email || rsvp.phone || '-'}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  rsvp.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                  rsvp.status === 'declined' ? 'bg-red-100 text-red-800' : 
                                  rsvp.status === 'maybe' ? 'bg-orange-100 text-orange-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {rsvp.status === 'confirmed' ? 'Oui' : rsvp.status === 'declined' ? 'Non' : rsvp.status === 'maybe' ? 'Peut-être' : rsvp.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500">Chargement...</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </EventsLayout>
  );
};

export default RSVPLinksPage;