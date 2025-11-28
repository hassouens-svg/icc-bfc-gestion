import React, { useState, useEffect } from 'react';
import EventsLayout from '../components/EventsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Users, CheckCircle, XCircle, HelpCircle, Mail, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../utils/api';
import { toast } from 'sonner';

const EventsStatsPage = () => {
  const user = getUser();
  const navigate = useNavigate();
  const [campagnes, setCampagnes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampagne, setSelectedCampagne] = useState(null);
  const [rsvpDetails, setRsvpDetails] = useState([]);

  useEffect(() => {
    loadCampagnes();
  }, []);

  const loadCampagnes = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/campagnes`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      // Filter only sent campaigns
      const sentCampagnes = data.filter(c => c.statut === 'envoye');
      setCampagnes(sentCampagnes);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadRSVPDetails = async (campagneId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/events/campagnes/${campagneId}/rsvp`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setRsvpDetails(data.rsvps || []);
      setSelectedCampagne(data.campagne);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const getReponseStats = (campagne) => {
    const stats = campagne.stats || {};
    const total = stats.envoyes || 0;
    const oui = stats.oui || 0;
    const non = stats.non || 0;
    const peut_etre = stats.peut_etre || 0;
    const sans_reponse = total - (oui + non + peut_etre);
    
    return { total, oui, non, peut_etre, sans_reponse };
  };

  if (loading) {
    return (
      <EventsLayout>
        <div className="p-6">
          <p>Chargement...</p>
        </div>
      </EventsLayout>
    );
  }

  return (
    <EventsLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/events-management')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Statistiques RSVP</h1>
            <p className="text-gray-500">Suivi des réponses de vos campagnes</p>
          </div>
        </div>

        {selectedCampagne ? (
          // Detail view
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedCampagne.titre}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Créée le {new Date(selectedCampagne.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedCampagne(null)}>
                    Retour à la liste
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <div className="text-2xl font-bold">{getReponseStats(selectedCampagne).total}</div>
                        <div className="text-xs text-gray-600">Envoyés</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <div className="text-2xl font-bold">{getReponseStats(selectedCampagne).oui}</div>
                        <div className="text-xs text-gray-600">Oui</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                        <div className="text-2xl font-bold">{getReponseStats(selectedCampagne).non}</div>
                        <div className="text-xs text-gray-600">Non</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <HelpCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                        <div className="text-2xl font-bold">{getReponseStats(selectedCampagne).peut_etre}</div>
                        <div className="text-xs text-gray-600">Peut-être</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Détails des réponses</h3>
                  {rsvpDetails.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Aucune réponse reçue pour le moment</p>
                  ) : (
                    <div className="space-y-2">
                      {rsvpDetails.map((rsvp) => (
                        <div key={rsvp.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium">{rsvp.contact_email || rsvp.contact_telephone}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(rsvp.created_at).toLocaleString('fr-FR')}
                            </div>
                          </div>
                          <div>
                            {rsvp.reponse === 'oui' && (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                ✅ Oui
                              </span>
                            )}
                            {rsvp.reponse === 'non' && (
                              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                                ❌ Non
                              </span>
                            )}
                            {rsvp.reponse === 'peut_etre' && (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                🤔 Peut-être
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // List view
          <div className="space-y-4">
            {campagnes.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Mail className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Aucune campagne envoyée pour le moment</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => navigate('/events/communication')}
                    >
                      Créer une campagne
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              campagnes.map((campagne) => {
                const stats = getReponseStats(campagne);
                const tauxReponse = stats.total > 0 
                  ? Math.round(((stats.oui + stats.non + stats.peut_etre) / stats.total) * 100)
                  : 0;

                return (
                  <Card 
                    key={campagne.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => loadRSVPDetails(campagne.id)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{campagne.titre}</CardTitle>
                          <p className="text-sm text-gray-500">
                            {campagne.type === 'email' ? '📧 Email' : campagne.type === 'sms' ? '📱 SMS' : '📧📱 Email + SMS'}
                            {' • '}
                            {new Date(campagne.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {tauxReponse}% réponses
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-5 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                          <div className="text-xs text-gray-500">Envoyés</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{stats.oui}</div>
                          <div className="text-xs text-gray-500">Oui</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{stats.non}</div>
                          <div className="text-xs text-gray-500">Non</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-600">{stats.peut_etre}</div>
                          <div className="text-xs text-gray-500">Peut-être</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-400">{stats.sans_reponse}</div>
                          <div className="text-xs text-gray-500">Sans réponse</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </EventsLayout>
  );
};

export default EventsStatsPage;
