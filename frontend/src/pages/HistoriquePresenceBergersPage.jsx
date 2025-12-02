import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Calendar, ArrowLeft, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const HistoriquePresenceBergersPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [loading, setLoading] = useState(false);
  const [dateSelectionnee, setDateSelectionnee] = useState(new Date().toISOString().split('T')[0]);
  const [presences, setPresences] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'superviseur_promos') {
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  const loadPresences = async () => {
    if (!dateSelectionnee) {
      toast.error('Veuillez sélectionner une date');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/berger-presences?date=${dateSelectionnee}&ville=${user.city}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erreur chargement');
      }

      const data = await response.json();
      setPresences(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vue Tableau Présence</h1>
            <p className="text-gray-500 mt-1">Historique des présences aux comptes rendus</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* Sélection de date */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-6 w-6 text-indigo-600" />
              <div className="flex-1 max-w-xs">
                <Label>Sélectionner une date</Label>
                <Input
                  type="date"
                  value={dateSelectionnee}
                  onChange={(e) => setDateSelectionnee(e.target.value)}
                />
              </div>
              <Button onClick={loadPresences} disabled={loading}>
                {loading ? 'Chargement...' : 'Afficher'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des présences */}
        {presences.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>
                Présences du {new Date(dateSelectionnee).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Berger</th>
                      <th className="text-center py-3 px-4">Statut</th>
                      <th className="text-center py-3 px-4">Prière</th>
                      <th className="text-left py-3 px-4">Commentaire</th>
                      <th className="text-left py-3 px-4">Enregistré par</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presences.map((presence, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold">{presence.berger_name || 'Non trouvé'}</p>
                            <p className="text-xs text-gray-500">{presence.berger_email || ''}</p>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          {presence.present ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Présent
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                              <XCircle className="h-4 w-4 mr-1" />
                              Absent
                            </span>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          {presence.priere && (
                            <span className="text-2xl" title="Prière demandée">🙏</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {presence.commentaire && (
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{presence.commentaire}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          <div>
                            <p>{presence.enregistre_par_name || 'Inconnu'}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(presence.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Résumé */}
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{presences.length}</p>
                    <p className="text-sm text-gray-600">Total</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {presences.filter(p => p.present).length}
                    </p>
                    <p className="text-sm text-gray-600">Présents</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {presences.filter(p => !p.present).length}
                    </p>
                    <p className="text-sm text-gray-600">Absents</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          !loading && (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">
                  Sélectionnez une date et cliquez sur "Afficher" pour voir l'historique
                </p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </Layout>
  );
};

export default HistoriquePresenceBergersPage;
