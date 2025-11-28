import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Check, X, HelpCircle } from 'lucide-react';

const RSVPPublicPage = () => {
  const { campagneId, reponse } = useParams();
  const [searchParams] = useSearchParams();
  const contact = searchParams.get('contact');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (reponse && contact) {
      enregistrerReponse();
    }
  }, [reponse, contact]);

  const enregistrerReponse = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/public/rsvp/${campagneId}?reponse=${reponse}&contact=${contact}`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        setSuccess(true);
      } else {
        setError('Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Enregistrement de votre réponse...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    const messages = {
      oui: { icon: <Check className="h-16 w-16 text-green-500" />, text: "Merci ! Votre présence est confirmée 🎉", color: "text-green-600" },
      non: { icon: <X className="h-16 w-16 text-red-500" />, text: "Merci pour votre réponse. Vous nous manquerez !", color: "text-red-600" },
      peut_etre: { icon: <HelpCircle className="h-16 w-16 text-yellow-500" />, text: "Merci ! Nous espérons vous voir 🤞", color: "text-yellow-600" }
    };
    const msg = messages[reponse] || messages.peut_etre;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Réponse enregistrée</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center">{msg.icon}</div>
            <p className={`text-lg font-semibold ${msg.color}`}>{msg.text}</p>
            <p className="text-sm text-gray-500">
              Vous pouvez fermer cette page
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Confirmez votre présence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            Cliquez sur l'une des options ci-dessous :
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => window.location.href = `/rsvp/${campagneId}/oui?contact=${contact}`}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              <Check className="h-5 w-5 mr-2" />
              Oui, je serai là
            </Button>
            <Button
              onClick={() => window.location.href = `/rsvp/${campagneId}/non?contact=${contact}`}
              className="w-full bg-red-500 hover:bg-red-600"
            >
              <X className="h-5 w-5 mr-2" />
              Non, je ne pourrai pas
            </Button>
            <Button
              onClick={() => window.location.href = `/rsvp/${campagneId}/peut_etre?contact=${contact}`}
              className="w-full bg-yellow-500 hover:bg-yellow-600"
            >
              <HelpCircle className="h-5 w-5 mr-2" />
              Je ne sais pas encore
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RSVPPublicPage;
