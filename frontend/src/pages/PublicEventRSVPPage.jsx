import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, CheckCircle, X, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

const PublicEventRSVPPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/events/${eventId}`);
      if (!response.ok) {
        toast.error('Événement introuvable');
        return;
      }
      const data = await response.json();
      setEvent(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (status) => {
    setSubmitting(true);

    try {
      const response = await fetch(`${backendUrl}/api/events/${eventId}/rsvp-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Anonymous',
          status: status,
          guests_count: 1
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur');
      }

      setSubmitted(true);
      toast.success('Réponse enregistrée avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-2">Événement introuvable</h2>
            <p className="text-gray-600">Cet événement n'existe pas ou a été supprimé.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Merci !</h2>
            <p className="text-gray-600">
              Votre réponse a été enregistrée. Nous avons hâte de vous voir !
            </p>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-indigo-800 font-medium">{event.title}</p>
              <p className="text-sm text-indigo-600">{event.date} {event.time && `à ${event.time}`}</p>
              {event.location && <p className="text-sm text-indigo-600">{event.location}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="overflow-hidden">
          {event.image_url && (
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-64 object-cover"
            />
          )}
          <CardHeader>
            <CardTitle className="text-3xl">{event.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {event.description && (
              <p className="text-gray-600">{event.description}</p>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <span className="font-medium">{event.date}</span>
              </div>
              {event.time && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="h-5 w-5 text-indigo-600" />
                  <span>{event.time}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="h-5 w-5 text-indigo-600" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">Confirmez votre présence</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom complet *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jean Dupont"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jean@exemple.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nombre de personnes</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.guests_count}
                    onChange={(e) => setFormData({ ...formData, guests_count: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message (optionnel)</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Un message pour les organisateurs..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? 'Envoi...' : 'Confirmer ma présence'}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          Propulsé par My Events Church
        </div>
      </div>
    </div>
  );
};

export default PublicEventRSVPPage;
