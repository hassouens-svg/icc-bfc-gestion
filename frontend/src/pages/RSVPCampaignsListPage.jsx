import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EventsLayout from '../components/EventsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, Users, CheckCircle, XCircle, Eye, Trash2, TrendingUp, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '../utils/api';

const RSVPCampaignsListPage = () => {
  const user = getUser();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  if (!user) {
    useEffect(() => {
      navigate('/login');
    }, [navigate]);
    return null;
  }

            </CardContent>
          </Card>
        </div>
      </EventsLayout>
    );
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Load events
      const eventsResponse = await fetch(`${backendUrl}/api/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!eventsResponse.ok) throw new Error('Erreur chargement');
      
      const events = await eventsResponse.json();
      
      // Load stats for each event
      const campaignsWithStats = await Promise.all(
        events.map(async (event) => {
          try {
            const statsResponse = await fetch(`${backendUrl}/api/events/${event.id}/rsvp`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (statsResponse.ok) {
              const stats = await statsResponse.json();
              return { ...event, stats };
            }
            return { ...event, stats: null };
          } catch (error) {
            return { ...event, stats: null };
          }
        })
      );
      
      setCampaigns(campaignsWithStats);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur chargement des campagnes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Supprimer cette campagne ?')) return;

    try {
      const response = await fetch(`${backendUrl}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token'}` }
      });

      if (!response.ok) throw new Error('Suppression échouée');

      toast.success('Campagne supprimée');
      loadCampaigns();
    } catch (error) {
      toast.error('Erreur suppression');
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

  const totalResponses = campaigns.reduce((sum, c) => sum + (c.stats?.total || 0), 0);
  const totalConfirmed = campaigns.reduce((sum, c) => sum + (c.stats?.confirmed || 0), 0);

  return (
    <EventsLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            Toutes les Campagnes RSVP
          </h1>
          <p className="text-gray-500 mt-1">Vue d'ensemble de toutes vos campagnes et leurs résultats</p>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Total Campagnes</p>
                <p className="text-3xl font-bold text-blue-600">{campaigns.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Total Réponses</p>
                <p className="text-3xl font-bold text-purple-600">{totalResponses}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Confirmés</p>
                <p className="text-3xl font-bold text-green-600">{totalConfirmed}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Taux Moyen</p>
                <p className="text-3xl font-bold text-orange-600">
                  {campaigns.length > 0 ? Math.round((totalConfirmed / totalResponses) * 100) || 0 : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune campagne</h3>
              <p className="text-gray-500 mb-4">Créez votre première campagne RSVP</p>
              <Button onClick={() => navigate('/events/rsvp-links'}>
                Créer une Campagne
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {campaign.image_url && (
                          <img 
                            src={campaign.image_url} 
                            alt={campaign.title}
                            className="w-20 h-20 object-cover rounded"
                          />
                        }
                        <div>
                          <h3 className="text-xl font-semibold">{campaign.title}</h3>
                          <p className="text-sm text-gray-500">{campaign.date} {campaign.time && `• ${campaign.time}`}</p>
                          {campaign.location && (
                            <p className="text-sm text-gray-500">📍 {campaign.location}</p>
                          }
                        </div>
                      </div>

                      {campaign.description && (
                        <p className="text-gray-600 mb-4">{campaign.description}</p>
                      }

                      {campaign.stats ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Total</p>
                            <p className="text-2xl font-bold text-blue-700">{campaign.stats.total || 0}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Confirmés</p>
                            <p className="text-2xl font-bold text-green-700">{campaign.stats.confirmed || 0}</p>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <p className="text-sm text-yellow-600 font-medium">Peut-être</p>
                            <p className="text-2xl font-bold text-yellow-700">{campaign.stats.maybe || 0}</p>
                          </div>
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-sm text-red-600 font-medium">Refusés</p>
                            <p className="text-2xl font-bold text-red-700">{campaign.stats.declined || 0}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 mb-4">Aucune statistique disponible</p>
                      }

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate('/events/rsvp-links'}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir Détails
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDelete(campaign.id}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        }

        <div className="text-center pt-6">
          <Button onClick={() => navigate('/events/rsvp-links'} size="lg">
            Créer une Nouvelle Campagne
          </Button>
        </div>
      </div>
    </EventsLayout>
  );
};

export default RSVPCampaignsListPage;
