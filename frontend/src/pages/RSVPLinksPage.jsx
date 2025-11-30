import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EventsLayout from '../components/EventsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, Link as LinkIcon, Share2, Copy, Users, Image, Trash2, BarChart, Calendar, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '../utils/api';

const RSVPLinksPage = () => {
  const user = getUser();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    image_url: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (!user) {
      navigate('/events-login');
      return;
    }
    loadEvents();
  }, [user, navigate]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/events`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setEvents(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des événements');
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
      toast.success('Image uploadée avec succès');
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${backendUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEvent)
      });

      if (!response.ok) throw new Error('Création échouée');

      toast.success('Événement créé avec succès');
      setIsDialogOpen(false);
      setNewEvent({ title: '', description: '', date: '', time: '', location: '', image_url: '' });
      loadEvents();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    try {
      const response = await fetch(`${backendUrl}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Suppression échouée');

      toast.success('Événement supprimé');
      loadEvents();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getPublicRSVPLink = (eventId) => {
    return `${window.location.origin}/rsvp/${eventId}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Lien copié dans le presse-papiers');
  };

  const shareViaWhatsApp = (event) => {
    const link = getPublicRSVPLink(event.id);
    const message = encodeURIComponent(`🎉 ${event.title}\n\n📅 ${event.date} ${event.time ? 'à ' + event.time : ''}\n📍 ${event.location || ''}\n\nRépondre maintenant en cliquant ici: ${link}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareViaFacebook = (event) => {
    const link = getPublicRSVPLink(event.id);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
  };

  const viewStats = (event) => {
    setSelectedEvent(event);
    loadEventStats(event.id);
  };

  const [eventStats, setEventStats] = useState(null);

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
      console.error('Erreur:', error);
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
        {/* Header */}
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

        {/* Events Grid */}
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
                {event.image_url && (
                  <img 
                    src={event.image_url} 
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{event.title}</span>
                  </CardTitle>
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

                  <div className="pt-3 border-t space-y-2">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => copyToClipboard(getPublicRSVPLink(event.id))}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copier
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => shareViaWhatsApp(event)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => viewStats(event)}
                      >
                        <BarChart className="h-4 w-4 mr-1" />
                        Stats
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
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

      {/* Create Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un Nouvel Événement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="space-y-2">
              <Label>Titre de l'événement *</Label>
              <Input
                required
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Ex: Culte Spécial de Noël"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Décrivez votre événement..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  required
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Ex: Église ICC Dijon"
              />
            </div>

            <div className="space-y-2">
              <Label>Image de l'événement</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && <span className="text-sm text-gray-500">Upload...</span>}
              </div>
              {newEvent.image_url && (
                <img src={newEvent.image_url} alt="Preview" className="mt-2 h-32 object-cover rounded" />
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={uploadingImage}>
                Créer l'Événement
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Statistiques: {selectedEvent.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {eventStats ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Total Réponses</p>
                            <p className="text-3xl font-bold text-indigo-600">{eventStats.total || 0}</p>
                          </div>
                          <Users className="h-12 w-12 text-indigo-200" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Confirmés</p>
                            <p className="text-3xl font-bold text-green-600">{eventStats.confirmed || 0}</p>
                          </div>
                          <CheckCircle className="h-12 w-12 text-green-200" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {eventStats.responses && eventStats.responses.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 text-sm">Nom</th>
                            <th className="text-left p-3 text-sm">Contact</th>
                            <th className="text-left p-3 text-sm">Statut</th>
                            <th className="text-left p-3 text-sm">Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventStats.responses.map((rsvp, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="p-3">{rsvp.name}</td>
                              <td className="p-3 text-sm text-gray-600">{rsvp.email || rsvp.phone || '-'}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  rsvp.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                                }`}>
                                  {rsvp.status}
                                </span>
                              </td>
                              <td className="p-3 text-sm text-gray-600">{rsvp.source || 'Direct'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500">Chargement des statistiques...</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </EventsLayout>
  );
};

export default RSVPLinksPage;
