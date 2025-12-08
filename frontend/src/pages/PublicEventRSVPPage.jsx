import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Calendar, CheckCircle, X, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

const PublicEventRSVPPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    is_star: false,
    payment_method: '',
    email: '',
    phone: ''
  });

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

  const handleStatusClick = (status) => {
    setSelectedStatus(status);
    setShowForm(true);
  };

  const handleSubmitResponse = async () => {
    // Valider uniquement si l'événement demande les noms
    if (event.require_names && (!formData.first_name || !formData.last_name)) {
      toast.error('Veuillez remplir votre nom et prénom');
      return;
    }

    setSubmitting(true);

    try {
      const fullName = event.require_names 
        ? `${formData.first_name} ${formData.last_name}`.trim()
        : 'Anonyme';
      
      const response = await fetch(`${backendUrl}/api/events/${eventId}/rsvp-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: fullName,
          first_name: event.require_names ? formData.first_name : null,
          last_name: event.require_names ? formData.last_name : null,
          is_star: formData.is_star,
          payment_method: formData.payment_method || null,
          email: event.require_email_contact ? formData.email : null,
          phone: event.require_email_contact ? formData.phone : null,
          status: selectedStatus,
          guests_count: 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur');
      }

      const responseData = await response.json();

      // Afficher un toast de confirmation au lieu d'un modal
      if (responseData.email_sent) {
        toast.success('✅ Enregistrement pris en compte ! Un mail de confirmation vous a été envoyé.');
      } else {
        toast.success('✅ Enregistrement pris en compte !');
      }
      
      // Réinitialiser le formulaire
      setShowForm(false);
      setSelectedStatus(null);
      setFormData({first_name: '', last_name: '', is_star: false, payment_method: '', email: '', phone: ''});
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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="shadow-lg overflow-hidden">
          <CardContent className="p-0">
            {/* En-tête avec icône */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 px-8 pt-8 pb-6 text-center">
              <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-10 w-10 text-purple-600" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
                {event.title}
              </h1>
            </div>

            {/* Image de l'événement - grande et fixe */}
            {event.image_url && (
              <div className="w-full overflow-hidden">
                <img 
                  src={event.image_url.startsWith('http') ? event.image_url : `${process.env.REACT_APP_BACKEND_URL}${event.image_url}`}
                  alt={event.title}
                  className="w-full h-80 object-cover"
                  style={{ objectPosition: 'center' }}
                  onError={(e) => { 
                    console.error('Image failed to load:', event.image_url);
                    e.target.style.display = 'none'; 
                  }}
                />
              </div>
            )}
            {!event.image_url && (
              <div className="w-full h-80 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <Calendar className="h-32 w-32 text-purple-300" />
              </div>
            )}

            {/* Contenu principal avec description */}
            <div className="px-8 py-8 space-y-6">
              {/* Description de l'événement */}
              {event.description && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">À propos</h2>
                  <p className="text-base text-gray-700 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Informations de l'événement */}
              <div className="space-y-3 bg-indigo-50 rounded-lg p-4">
                {event.date && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    <span className="font-medium">{new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                )}
                {event.time && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{event.time}</span>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">{event.location}</span>
                  </div>
                )}
              </div>

              {/* Message de confirmation */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
                <div className="text-purple-600 mt-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Confirmation de Présence</h3>
                  <p className="text-sm text-gray-700">
                    Merci de confirmer votre présence en cliquant sur l'un des boutons ci-dessous
                  </p>
                </div>
              </div>

              {/* Boutons de réponse ou Formulaire */}
              {!showForm ? (
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={() => handleStatusClick('confirmed')}
                    disabled={submitting}
                    className="w-full h-16 text-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    <CheckCircle className="h-6 w-6" />
                    <span>✓</span>
                    <span>Oui, je serai présent(e)</span>
                  </Button>

                  <Button
                    onClick={() => handleStatusClick('declined')}
                    disabled={submitting}
                    variant="destructive"
                    className="w-full h-16 text-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    <X className="h-6 w-6" />
                    <span>✗</span>
                    <span>Non, je ne pourrai pas venir</span>
                  </Button>

                  <Button
                    onClick={() => handleStatusClick('maybe')}
                    disabled={submitting}
                    variant="outline"
                    className="w-full h-16 text-lg border-2 border-yellow-400 text-gray-900 hover:bg-yellow-50 flex items-center justify-center gap-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    <HelpCircle className="h-6 w-6 text-gray-400" />
                    <span>🤔</span>
                    <span>Je ne sais pas encore</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {event.require_names && (
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-sm text-indigo-900 font-medium mb-3">
                        Merci de renseigner vos informations :
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prénom *
                          </label>
                          <input
                            type="text"
                            value={formData.first_name}
                            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Votre prénom"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom *
                          </label>
                          <input
                            type="text"
                            value={formData.last_name}
                            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Votre nom"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Champs Email et Contact - Si activé */}
                  {event.require_email_contact && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">Coordonnées de contact</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="votre@email.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact / Téléphone
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="+33 6 12 34 56 78"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Checkbox STAR - Toujours visible */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_star"
                        checked={formData.is_star}
                        onChange={(e) => setFormData({...formData, is_star: e.target.checked})}
                        className="h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_star" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2">
                        <span className="text-2xl">⭐</span>
                        <span>Êtes-vous STAR (Serviteurs Travaillant Activement pour le Royaume) ?</span>
                      </label>
                    </div>
                  </div>

                  {/* Options de paiement - Si activé */}
                  {event.require_payment_method && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">Moyen de paiement</p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-green-100 rounded">
                          <input
                            type="radio"
                            name="payment"
                            value="card"
                            checked={formData.payment_method === 'card'}
                            onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                            className="h-4 w-4 text-green-600"
                          />
                          <span className="text-sm">💳 J'ai payé par carte</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-green-100 rounded">
                          <input
                            type="radio"
                            name="payment"
                            value="cash"
                            checked={formData.payment_method === 'cash'}
                            onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                            className="h-4 w-4 text-green-600"
                          />
                          <span className="text-sm">💵 Je payes par espèces</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Boutons Retour/Confirmer - DÉPLACÉS ICI EN HAUT */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setShowForm(false);
                        setFormData({first_name: '', last_name: '', is_star: false, payment_method: '', email: '', phone: ''});
                      }}
                      variant="outline"
                      className="flex-1"
                      disabled={submitting}
                    >
                      Retour
                    </Button>
                    <Button
                      onClick={handleSubmitResponse}
                      disabled={submitting}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      {submitting ? 'Envoi...' : 'Confirmer'}
                    </Button>
                  </div>

                  {/* Lien personnalisé - DÉPLACÉ EN DERNIER */}
                  {event.custom_link_url && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mt-4">
                      <a 
                        href={event.custom_link_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-purple-700 hover:text-purple-900 font-medium"
                      >
                        <span>🔗</span>
                        <span>{event.custom_link_title || 'Plus d\'informations'}</span>
                        <span className="text-xs">↗</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-sm text-gray-400 pt-6 border-t">
                <p>Impact Centre Chrétien BFC-Italie</p>
                <p>My Events Church</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmation - Pop-up au lieu de changer de page */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <DialogTitle className="text-center text-2xl">Enregistrement pris en compte !</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Votre participation a été enregistrée avec succès.
            </p>
            {emailSent && (
              <p className="text-green-600 font-medium">
                ✉️ Un mail de confirmation vous a été envoyé.
              </p>
            )}
            <Button 
              onClick={() => {
                setShowSuccessDialog(false);
                setSelectedStatus(null);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicEventRSVPPage;
