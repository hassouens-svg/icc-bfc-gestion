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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="h-10 w-10 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Merci !</h2>
              <p className="text-gray-600">
                Votre réponse a été enregistrée avec succès.
              </p>
            </div>
            <div className="text-center text-sm text-gray-400 pt-4">
              <p>Impact Centre Chrétien BFC-Italie</p>
              <p>My Events Church</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="h-10 w-10 text-purple-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-center text-gray-900">
              Confirmation de Présence
            </h1>

            {/* Image de l'événement - plus grande */}
            {event.image_url && (
              <div className="rounded-lg overflow-hidden mb-4">
                <img 
                  src={event.image_url} 
                  alt={event.title}
                  className="w-full h-64 object-cover"
                  onError={(e) => { 
                    console.error('Image failed to load:', event.image_url);
                    e.target.style.display = 'none'; 
                  }}
                />
              </div>
            )}
            {!event.image_url && (
              <div className="w-full h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-20 w-20 text-purple-300" />
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
              <div className="text-gray-400 mt-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                Merci de confirmer votre présence en cliquant sur l'un des boutons ci-dessous
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => handleResponse('confirmed')}
                disabled={submitting}
                className="w-full h-14 text-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-3"
              >
                <CheckCircle className="h-6 w-6" />
                <span>✓</span>
                <span>Oui, je serai présent(e)</span>
              </Button>

              <Button
                onClick={() => handleResponse('declined')}
                disabled={submitting}
                variant="destructive"
                className="w-full h-14 text-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-3"
              >
                <X className="h-6 w-6" />
                <span>✗</span>
                <span>Non, je ne pourrai pas venir</span>
              </Button>

              <Button
                onClick={() => handleResponse('maybe')}
                disabled={submitting}
                variant="outline"
                className="w-full h-14 text-lg border-2 border-yellow-400 text-gray-900 hover:bg-yellow-50 flex items-center justify-center gap-3"
              >
                <HelpCircle className="h-6 w-6 text-gray-400" />
                <span>🤔</span>
                <span>Je ne sais pas encore</span>
              </Button>
            </div>

            <div className="text-center text-sm text-gray-400 pt-4">
              <p>Impact Centre Chrétien BFC-Italie</p>
              <p>My Events Church</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicEventRSVPPage;
