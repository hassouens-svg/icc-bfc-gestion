import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, HelpCircle, Calendar } from 'lucide-react';

const RSVPPage = () => {
  const { campagneId } = useParams();
  const [searchParams] = useSearchParams();
  const contact = searchParams.get('contact');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [campagne, setCampagne] = useState(null);

  useEffect(() => {
    // Charger les détails de la campagne
    loadCampagne();
  }, [campagneId]);

  const loadCampagne = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/public/campagne/${campagneId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setCampagne(data);
      }
    } catch (error) {
      console.error('Erreur chargement campagne:', error);
    }
  };

  // Fonction pour obtenir l'URL complète de l'image
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // Si c'est déjà une URL complète
    if (imageUrl.startsWith('http')) return imageUrl;
    // Si c'est un chemin relatif
    if (imageUrl.startsWith('/')) {
      return `${window.location.protocol}//${window.location.host}${imageUrl}`;
    }
    return imageUrl;
  };

  const handleResponse = async (reponse) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/public/rsvp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campagne_id: campagneId,
            contact: contact,
            reponse: reponse
          })
        }
      );

      if (response.ok) {
        setResponse(reponse);
        setSubmitted(true);
      } else {
        alert('Erreur lors de l\'enregistrement de votre réponse');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement de votre réponse');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          {response === 'oui' && (
            <>
              <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Merci !</h1>
              <p className="text-gray-600 text-lg">
                ✅ Votre présence est confirmée
              </p>
            </>
          )}
          {response === 'non' && (
            <>
              <XCircle className="w-20 h-20 mx-auto text-red-500 mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Merci !</h1>
              <p className="text-gray-600 text-lg">
                ❌ Votre absence est notée
              </p>
            </>
          )}
          {response === 'peut_etre' && (
            <>
              <HelpCircle className="w-20 h-20 mx-auto text-yellow-500 mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Merci !</h1>
              <p className="text-gray-600 text-lg">
                🤔 Réponse enregistrée : Peut-être
              </p>
            </>
          )}
          <p className="text-gray-500 text-sm mt-6">
            Votre réponse a bien été enregistrée
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Image de la campagne EN HAUT si présente */}
        {campagne && campagne.image_url && (
          <div className="w-full">
            <img 
              src={getImageUrl(campagne.image_url)} 
              alt="Affiche événement" 
              className="w-full h-auto object-cover"
              style={{ maxHeight: '500px' }}
            />
          </div>
        )}

        {/* Contenu */}
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <Calendar className="w-12 h-12 mx-auto text-purple-600 mb-3" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Confirmation de Présence
            </h1>
            {campagne && (
              <p className="text-gray-600 text-base font-medium">
                {campagne.titre}
              </p>
            )}
          </div>

          {/* Message */}
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-center text-base">
              📋 Merci de confirmer votre présence en cliquant sur l'un des boutons ci-dessous
            </p>
          </div>

          {/* Buttons EN BAS */}
          <div className="space-y-3">
            <Button
              onClick={() => handleResponse('oui')}
              disabled={loading}
              className="w-full h-14 text-base bg-green-500 hover:bg-green-600"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              ✅ Oui, je serai présent(e)
            </Button>

            <Button
              onClick={() => handleResponse('non')}
              disabled={loading}
              variant="destructive"
              className="w-full h-14 text-base"
            >
              <XCircle className="w-5 h-5 mr-2" />
              ❌ Non, je ne pourrai pas venir
            </Button>

            <Button
              onClick={() => handleResponse('peut_etre')}
              disabled={loading}
              variant="outline"
              className="w-full h-14 text-base border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
            >
              <HelpCircle className="w-5 h-5 mr-2" />
              🤔 Je ne sais pas encore
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Impact Centre Chrétien BFC-Italie</p>
            <p>My Events Church</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSVPPage;
