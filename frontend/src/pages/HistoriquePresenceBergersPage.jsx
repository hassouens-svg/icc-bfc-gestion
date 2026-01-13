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
  const [selectedPromo, setSelectedPromo] = useState('all');

  useEffect(() => {
    if (!user || !['superviseur_promos', 'super_admin', 'responsable_promo', 'responsable_promos'].includes(user.role)) {
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
          const monthStr = String(berger.assigned_month);
          const monthPart = monthStr.split('-')[1];
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
        // Chercher les données sauvegardées dans les présences
        const promoPresence = presencesData.find(p => p.promo_name === promo.nom);
        
        if (promoPresence && promoPresence.noms_bergers) {
          // Utiliser les données sauvegardées
          promo.nomsBergers = promoPresence.noms_bergers;
          promo.personnesSuivies = promoPresence.personnes_suivies || 0;
        } else {
          // Fallback sur les valeurs calculées si pas de données sauvegardées
          promo.nomsBergers = promo.bergers.map(b => b.name).join(', ');
          const suivies = cityVisitors.filter(v => {
            if (!v.assigned_month) return false;
            const visitorMonth = v.assigned_month.split('-')[1];
            return visitorMonth === promo.monthNum && v.statut_suivi !== 'arrete';
          });
          promo.personnesSuivies = suivies.length;
        }
      });
      
      const sortedPromos = Object.values(promoGroups)
        .filter(p => p.present || p.absent)
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
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
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
              </div>
              
              {promos.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">Filtrer par Promo</label>
                  <select
                    value={selectedPromo}
                    onChange={(e) => setSelectedPromo(e.target.value)}
                    className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Toutes les promos</option>
                    {promos.map((promo, idx) => (
                      <option key={idx} value={promo.nom}>{promo.nom}</option>
                    ))}
                  </select>
                </div>
              )}
              
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
                  {selectedPromo !== 'all' && ` - ${selectedPromo}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold">Nom de la Promo</th>
                        <th className="text-center py-3 px-4 font-semibold">Pers Suivies</th>
                        <th className="text-left py-3 px-4 font-semibold">Noms des Bergers</th>
                        <th className="text-center py-3 px-4 font-semibold">Présent</th>
                        <th className="text-center py-3 px-4 font-semibold">Absent</th>
                        <th className="text-center py-3 px-4 font-semibold">Prière</th>
                        <th className="text-left py-3 px-4 font-semibold">Commentaire</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promos.filter(p => selectedPromo === 'all' || p.nom === selectedPromo).map((promo, index) => (
                        <tr key={index} className={`border-b hover:bg-gray-50 ${(promo.present || promo.absent) ? 'bg-blue-50' : ''}`}>
                          <td className="py-4 px-4 font-medium text-purple-700">{promo.nom}</td>
                          
                          <td className="text-center py-4 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                              {promo.personnesSuivies}
                            </span>
                          </td>
                          
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {promo.nomsBergers}
                          </td>
                          
                          <td className="text-center py-4 px-4">
                            <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center mx-auto ${
                              promo.present
                                ? 'bg-green-500 border-green-600' 
                                : 'bg-white border-gray-200'
                            }`}>
                              {promo.present && <Check className="h-8 w-8 text-white" strokeWidth={4} />}
                            </div>
                          </td>
                          
                          <td className="text-center py-4 px-4">
                            <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center mx-auto ${
                              promo.absent
                                ? 'bg-red-500 border-red-600' 
                                : 'bg-white border-gray-200'
                            }`}>
                              {promo.absent && <X className="h-8 w-8 text-white" strokeWidth={4} />}
                            </div>
                          </td>
                          
                          <td className="text-center py-4 px-4">
                            <span className={`px-3 py-2 rounded border font-medium inline-block ${
                              promo.priere === 'Oui'
                                ? 'bg-green-100 text-green-800 border-green-400'
                                : 'bg-red-100 text-red-800 border-red-400'
                            }`}>
                              {promo.priere === 'Oui' ? '✅ Oui' : '❌ Non'}
                            </span>
                          </td>
                          
                          <td className="py-4 px-4">
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
                  <h3 className="font-semibold mb-4">Résumé {selectedPromo !== 'all' ? `- ${selectedPromo}` : 'de la journée'}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {promos.filter(p => selectedPromo === 'all' || p.nom === selectedPromo).length}
                      </p>
                      <p className="text-sm text-gray-600">Promos avec présences</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {promos.filter(p => (selectedPromo === 'all' || p.nom === selectedPromo) && p.present).length}
                      </p>
                      <p className="text-sm text-gray-600">Promos présentes</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {promos.filter(p => (selectedPromo === 'all' || p.nom === selectedPromo) && p.absent).length}
                      </p>
                      <p className="text-sm text-gray-600">Promos absentes</p>
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
