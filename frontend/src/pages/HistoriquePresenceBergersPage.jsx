import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser, getReferents } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Calendar, ArrowLeft } from 'lucide-react';

const HistoriquePresenceBergersPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [loading, setLoading] = useState(false);
  const [dateSelectionnee, setDateSelectionnee] = useState(new Date().toISOString().split('T')[0]);
  const [promoPresences, setPromoPresences] = useState([]);

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
      // Charger les bergers/référents pour avoir la structure des promos
      const allUsers = await getReferents();
      const bergersList = allUsers.filter(
        u => (u.role === 'berger' || u.role === 'referent') && u.city === user.city
      );
      
      // Charger les visiteurs pour calculer le nombre de personnes suivies
      const visitorsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/visitors?include_stopped=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const allVisitors = await visitorsResponse.json();
      const cityVisitors = allVisitors.filter(v => v.city === user.city);
      
      // Charger les présences pour la date sélectionnée
      const presencesResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/berger-presences?date=${dateSelectionnee}&ville=${user.city}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!presencesResponse.ok) {
        throw new Error('Erreur chargement');
      }

      const presencesData = await presencesResponse.json();
      
      // Grouper les bergers par promo et agréger les présences
      const promoGroups = {};
      bergersList.forEach(berger => {
        if (berger.assigned_month) {
          const monthPart = berger.assigned_month.split('-')[1];
          const monthNames = {
            '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
            '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
            '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
          };
          const promoName = berger.promo_name || `Promo ${monthNames[monthPart]}`;
          
          if (!promoGroups[promoName]) {
            promoGroups[promoName] = {
              promo_name: promoName,
              month_num: monthPart,
              total_bergers: 0,
              presents: 0,
              absents: 0,
              priere: false,
              commentaire: '',
              personnes_suivies: 0
            };
          }
          promoGroups[promoName].total_bergers++;
          
          // Chercher la présence de ce berger
          const presence = presencesData.find(p => p.berger_id === berger.id);
          if (presence) {
            if (presence.present) {
              promoGroups[promoName].presents++;
            } else {
              promoGroups[promoName].absents++;
            }
            if (presence.priere) {
              promoGroups[promoName].priere = true;
            }
            if (presence.commentaire && !promoGroups[promoName].commentaire) {
              promoGroups[promoName].commentaire = presence.commentaire;
            }
          }
        }
      });
      
      // Calculer le nombre de personnes suivies par promo
      Object.keys(promoGroups).forEach(promoName => {
        const monthNum = promoGroups[promoName].month_num;
        const suivies = cityVisitors.filter(v => {
          if (!v.assigned_month) return false;
          const visitorMonth = v.assigned_month.split('-')[1];
          return visitorMonth === monthNum && v.statut_suivi !== 'arrete';
        });
        promoGroups[promoName].personnes_suivies = suivies.length;
      });
      
      // Convertir en tableau trié
      const sortedPromos = Object.values(promoGroups).sort((a, b) => 
        a.promo_name.localeCompare(b.promo_name)
      );
      
      setPromoPresences(sortedPromos);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vue Tableau Présence</h1>
            <p className="text-gray-500 mt-1">Historique des présences aux comptes rendus - {user.city}</p>
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
              <Button onClick={loadPresences} disabled={loading} className="mt-6">
                {loading ? 'Chargement...' : 'Afficher'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des présences */}
        {promoPresences.length > 0 ? (
          <>
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
                        <th className="text-left py-3 px-4">Nom de la Promo</th>
                        <th className="text-center py-3 px-4">Nbre de Pers Suivies</th>
                        <th className="text-center py-3 px-4">Nbre de Bergers</th>
                        <th className="text-center py-3 px-4">Présents</th>
                        <th className="text-center py-3 px-4">Absents</th>
                        <th className="text-center py-3 px-4">Prière</th>
                        <th className="text-left py-3 px-4">Commentaire</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promoPresences.map((promo, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-purple-700">{promo.promo_name}</td>
                          <td className="text-center py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                              {promo.personnes_suivies}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                              {promo.total_bergers}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                              {promo.presents}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">
                              {promo.absents}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            {promo.priere && (
                              <span className="text-2xl" title="Prière demandée">🙏</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {promo.commentaire && (
                              <span className="text-sm text-gray-700">{promo.commentaire}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Résumé */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-4">Résumé de la journée</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{promoPresences.length}</p>
                      <p className="text-sm text-gray-600">Promos</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {promoPresences.reduce((sum, p) => sum + p.total_bergers, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Bergers</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {promoPresences.reduce((sum, p) => sum + p.presents, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Présents</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {promoPresences.reduce((sum, p) => sum + p.absents, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Absents</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
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
