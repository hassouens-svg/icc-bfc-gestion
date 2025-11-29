import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EventsLayout from '@/components/EventsLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Trash2, CheckCircle, XCircle, HelpCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const RSVPManagementPage = () => {
  const navigate = useNavigate();
  const [campagnes, setCampagnes] = useState([]);
  const [selectedCampagne, setSelectedCampagne] = useState(null);
  const [reponses, setReponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCampagnes();
  }, []);

  useEffect(() => {
    if (selectedCampagne) {
      loadReponses(selectedCampagne.id);
    }
  }, [selectedCampagne]);

  const loadCampagnes = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/events/campagnes`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      if (!response.ok) throw new Error('Erreur chargement');
      
      const data = await response.json();
      // Filtrer seulement les campagnes avec RSVP activé
      const campagnesAvecRSVP = data.filter(c => c.enable_rsvp);
      setCampagnes(campagnesAvecRSVP);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur chargement des campagnes');
    }
  };

  const loadReponses = async (campagneId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/events/campagnes/${campagneId}/rsvp`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      if (!response.ok) throw new Error('Erreur chargement réponses');
      
      const data = await response.json();
      setReponses(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur chargement des réponses');
      setReponses([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteReponse = async (reponseId) => {
    if (!window.confirm('Supprimer cette réponse RSVP ?')) return;
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/events/rsvp/${reponseId}`,
        {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error('Suppression échouée');
      
      toast.success('Réponse supprimée');
      loadReponses(selectedCampagne.id);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getResponseIcon = (reponse) => {
    switch (reponse) {
      case 'oui':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'non':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'peut_etre':
        return <HelpCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getResponseBadge = (reponse) => {
    switch (reponse) {
      case 'oui':
        return 'bg-green-100 text-green-800';
      case 'non':
        return 'bg-red-100 text-red-800';
      case 'peut_etre':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResponseLabel = (reponse) => {
    switch (reponse) {
      case 'oui':
        return 'Oui';
      case 'non':
        return 'Non';
      case 'peut_etre':
        return 'Peut-être';
      default:
        return reponse;
    }
  };

  const stats = selectedCampagne ? {
    total: reponses.length,
    oui: reponses.filter(r => r.reponse === 'oui').length,
    non: reponses.filter(r => r.reponse === 'non').length,
    peut_etre: reponses.filter(r => r.reponse === 'peut_etre').length
  } : null;

  const filteredReponses = reponses.filter(r => 
    r.contact?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <EventsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gestion des Réponses RSVP</h1>
            <p className="text-gray-600">Consultez et gérez les réponses aux invitations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des campagnes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">📋 Campagnes avec RSVP</h2>
            {campagnes.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                Aucune campagne avec RSVP
              </p>
            ) : (
              <div className="space-y-2">
                {campagnes.map((campagne) => (
                  <button
                    key={campagne.id}
                    onClick={() => setSelectedCampagne(campagne)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      selectedCampagne?.id === campagne.id
                        ? 'bg-purple-50 border-purple-500'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <h3 className="font-semibold text-sm">{campagne.titre}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(campagne.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Réponses de la campagne sélectionnée */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedCampagne ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">
                  Sélectionnez une campagne pour voir les réponses
                </p>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">{selectedCampagne.titre}</h2>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.oui}</div>
                      <div className="text-sm text-gray-600">✅ Oui</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.non}</div>
                      <div className="text-sm text-gray-600">❌ Non</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{stats.peut_etre}</div>
                      <div className="text-sm text-gray-600">🤔 Peut-être</div>
                    </div>
                  </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-lg shadow p-4">
                  <Input
                    type="text"
                    placeholder="Rechercher un contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Liste des réponses */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Réponses ({filteredReponses.length})
                  </h3>
                  
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    </div>
                  ) : filteredReponses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      {searchTerm ? 'Aucun résultat' : 'Aucune réponse encore'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredReponses.map((reponse) => (
                        <div
                          key={reponse.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {getResponseIcon(reponse.reponse)}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{reponse.contact}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(reponse.created_at).toLocaleString('fr-FR')}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getResponseBadge(reponse.reponse)}`}>
                              {getResponseLabel(reponse.reponse)}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteReponse(reponse.id)}
                            className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </EventsLayout>
  );
};

export default RSVPManagementPage;
