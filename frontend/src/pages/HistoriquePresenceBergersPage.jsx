import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser, getReferents } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { Calendar, ArrowLeft, Check, X } from 'lucide-react';

const HistoriquePresenceBergersPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [loading, setLoading] = useState(false);
  const [dateSelectionnee, setDateSelectionnee] = useState(new Date().toISOString().split('T')[0]);
  const [promos, setPromos] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'superviseur_promos') {
      navigate('/dashboard');
      return;
    }
  }, []);

  const loadPresences = async () => {
    if (!dateSelectionnee) {
      toast.error('Sélectionnez une date');
      return;
    }

    setLoading(true);
    try {
      const allUsers = await getReferents();
      const bergersList = allUsers.filter(
        u => (u.role === 'berger' || u.role === 'referent') && u.city === user.city
      );
      
      const visitorsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/visitors?include_stopped=true`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const allVisitors = await visitorsResponse.json();
      const cityVisitors = allVisitors.filter(v => v.city === user.city);
      
      const presencesResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/berger-presences?date=${dateSelectionnee}&ville=${user.city}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );

      if (!presencesResponse.ok) throw new Error('Erreur');

      const presencesData = await presencesResponse.json();
      
      const monthNames = {
        '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
        '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
        '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
      };
      
      // Créer un map des bergers pour récupérer leurs noms
      const bergersMap = {};
      bergersList.forEach(berger => {
        bergersMap[berger.id] = berger;
      });
      
      const promoGroups = {};
      bergersList.forEach(berger => {
        if (berger.assigned_month) {
          const monthPart = berger.assigned_month.split('-')[1];
          const monthName = monthNames[monthPart];
          const promoKey = `Promo ${monthName}`;
          
          if (!promoGroups[promoKey]) {
            promoGroups[promoKey] = {
              nom: promoKey,
              monthNum: monthPart,
              bergers: [],
              nomsBergers: '',
              present: false,
              absent: false,
              priere: 'Non',
              commentaire: '',
              personnesSuivies: 0
            };
          }
          promoGroups[promoKey].bergers.push(berger);
          
          const presence = presencesData.find(p => p.berger_id === berger.id);
          if (presence) {
            // S'il y a au moins une présence, marquer toute la promo
            if (presence.present) promoGroups[promoKey].present = true;
            if (!presence.present) promoGroups[promoKey].absent = true;
            
            if (presence.priere) promoGroups[promoKey].priere = 'Oui';
            if (presence.commentaire && !promoGroups[promoKey].commentaire) {
              promoGroups[promoKey].commentaire = presence.commentaire;
            }
          }
        }
      });
      
      Object.values(promoGroups).forEach(promo => {
        const suivies = cityVisitors.filter(v => {
          if (!v.assigned_month) return false;
          const visitorMonth = v.assigned_month.split('-')[1];
          return visitorMonth === promo.monthNum && v.statut_suivi !== 'arrete';
        });
        promo.personnesSuivies = suivies.length;
      });
      
      const sortedPromos = Object.values(promoGroups)
        .filter(p => p.presents > 0 || p.absents > 0)
        .sort((a, b) => parseInt(a.monthNum) - parseInt(b.monthNum));
      
      setPromos(sortedPromos);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vue Tableau Présence</h1>
            <p className="text-gray-500 mt-1">Historique - {user.city}</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-6 w-6 text-indigo-600" />
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input
                  type="date"
                  value={dateSelectionnee}
                  onChange={(e) => setDateSelectionnee(e.target.value)}
                  className="w-48"
                />
              </div>
              <Button onClick={loadPresences} disabled={loading} className="mt-6">
                {loading ? 'Chargement...' : 'Afficher'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {promos.length > 0 ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>
                  Présences du {new Date(dateSelectionnee).toLocaleDateString('fr-FR', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold">Promo</th>
                        <th className="text-center py-3 px-4 font-semibold">Pers Suivies</th>
                        <th className="text-center py-3 px-4 font-semibold">Nbre Bergers</th>
                        <th className="text-center py-3 px-4 font-semibold">Présents</th>
                        <th className="text-center py-3 px-4 font-semibold">Absents</th>
                        <th className="text-center py-3 px-4 font-semibold">Prière</th>
                        <th className="text-left py-3 px-4 font-semibold">Commentaire</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promos.map((promo, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-purple-700">{promo.nom}</td>
                          <td className="text-center py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                              {promo.personnesSuivies}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                              {promo.totalBergers}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            {promo.presents > 0 ? (
                              <div className="flex items-center justify-center gap-2">
                                <Check className="h-5 w-5 text-green-600" />
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold">
                                  {promo.presents}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {promo.absents > 0 ? (
                              <div className="flex items-center justify-center gap-2">
                                <X className="h-5 w-5 text-red-600" />
                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-bold">
                                  {promo.absents}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-4">
                            {promo.priere ? (
                              <span className="text-2xl">🙏</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {promo.commentaire ? (
                              <span className="text-sm text-gray-700">{promo.commentaire}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-4">Résumé</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{promos.length}</p>
                      <p className="text-sm text-gray-600">Promos</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {promos.reduce((sum, p) => sum + p.totalBergers, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Bergers</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {promos.reduce((sum, p) => sum + p.presents, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Présents</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {promos.reduce((sum, p) => sum + p.absents, 0)}
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
                  Sélectionnez une date et cliquez sur "Afficher"
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
