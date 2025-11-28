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
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Calendar className="w-16 h-16 mx-auto text-purple-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Confirmation de Présence
          </h1>
          {campagne && (
            <p className="text-gray-600 text-lg">
              {campagne.titre}
            </p>
          )}
        </div>

        {/* Message */}
        <div className="bg-purple-50 rounded-lg p-6 mb-8">
          <p className="text-gray-700 text-center text-lg">
            📋 Merci de confirmer votre présence en cliquant sur l'un des boutons ci-dessous
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          <Button
            onClick={() => handleResponse('oui')}
            disabled={loading}
            className="w-full h-16 text-lg bg-green-500 hover:bg-green-600"
          >
            <CheckCircle className="w-6 h-6 mr-3" />
            ✅ Oui, je serai présent(e)
          </Button>

          <Button
            onClick={() => handleResponse('non')}
            disabled={loading}
            variant="destructive"
            className="w-full h-16 text-lg"
          >
            <XCircle className="w-6 h-6 mr-3" />
            ❌ Non, je ne pourrai pas venir
          </Button>

          <Button
            onClick={() => handleResponse('peut_etre')}
            disabled={loading}
            variant="outline"
            className="w-full h-16 text-lg border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
          >
            <HelpCircle className="w-6 h-6 mr-3" />
            🤔 Je ne sais pas encore
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Impact Centre Chrétien BFC-Italie</p>
          <p>My Events Church</p>
        </div>
      </div>
    </div>
  );
};

export default RSVPPage;
