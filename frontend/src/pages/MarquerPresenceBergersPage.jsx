import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser, getReferents } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Calendar, ArrowLeft, Edit2, Check, X, Save } from 'lucide-react';

const MarquerPresenceBergersPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateSelectionnee, setDateSelectionnee] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'superviseur_promos') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allUsers = await getReferents();
      const bergersList = allUsers.filter(
        u => (u.role === 'berger' || u.role === 'referent') && u.city === user.city
      );
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/visitors?include_stopped=true`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const allVisitors = await response.json();
      const cityVisitors = allVisitors.filter(v => v.city === user.city);
      
      // Récupérer toutes les présences pour pré-remplir
      const allPresencesResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/berger-presences/latest?ville=${user.city}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      const latestPresences = allPresencesResponse.ok ? await allPresencesResponse.json() : [];
      
      const monthNames = {
        '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
        '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
        '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
      };
      
      const promoGroups = {};
      bergersList.forEach(berger => {
        if (berger.assigned_month) {
          const monthPart = berger.assigned_month.split('-')[1];
          const monthName = monthNames[monthPart];
          const promoKey = `Promo ${monthName}`;
          
          if (!promoGroups[promoKey]) {
            promoGroups[promoKey] = {
              id: promoKey,
              nom: promoKey,
              monthNum: monthPart,
              bergers: [],
              nomsBergers: '',
              personnesSuivies: 0,
              present: false,
              absent: false,
              priere: 'Non',
              commentaire: ''
            };
          }
          promoGroups[promoKey].bergers.push(berger);
        }
      });
      
      Object.values(promoGroups).forEach(promo => {
        // Chercher la dernière présence sauvegardée pour cette promo
        const lastPresence = latestPresences.find(p => p.promo_name === promo.nom);
        
        if (lastPresence && lastPresence.noms_bergers) {
          // Pré-remplir avec les valeurs sauvegardées
          promo.nomsBergers = lastPresence.noms_bergers;
          promo.personnesSuivies = lastPresence.personnes_suivies || 0;
        } else {
          // Valeurs par défaut si pas de dernière présence
          promo.nomsBergers = promo.bergers.map(b => b.name).join(', ');
          const suivies = cityVisitors.filter(v => {
            if (!v.assigned_month) return false;
            const visitorMonth = v.assigned_month.split('-')[1];
            return visitorMonth === promo.monthNum && v.statut_suivi !== 'arrete';
          });
          promo.personnesSuivies = suivies.length;
        }
      });
      
      const sortedPromos = Object.values(promoGroups).sort((a, b) => 
        parseInt(a.monthNum) - parseInt(b.monthNum)
      );
      
      setPromos(sortedPromos);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  const updatePromo = (index, field, value) => {
    const newPromos = [...promos];
    
    if (field === 'present' && value === true) {
      newPromos[index].present = true;
      newPromos[index].absent = false;
    } else if (field === 'absent' && value === true) {
      newPromos[index].absent = true;
      newPromos[index].present = false;
    } else {
      newPromos[index][field] = value;
    }
    
    setPromos(newPromos);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const presencesToSave = [];
      
      promos.forEach(promo => {
        if (promo.present || promo.absent) {
          promo.bergers.forEach(berger => {
            presencesToSave.push({
              berger_id: berger.id,
              date: dateSelectionnee,
              present: promo.present,
              priere: promo.priere === 'Oui',
              commentaire: promo.commentaire,
              enregistre_par: user.id,
              ville: user.city,
              promo_name: promo.nom,
              noms_bergers: promo.nomsBergers,
              personnes_suivies: promo.personnesSuivies
            });
          });
        }
      });

      if (presencesToSave.length === 0) {
        toast.error('Veuillez cocher au moins une présence');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/berger-presences/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ presences: presencesToSave })
      });

      if (!response.ok) throw new Error('Erreur');

      toast.success(`✅ ${presencesToSave.length} présence(s) enregistrée(s)`);
      loadData();
    } catch (error) {
      toast.error('Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marquer Présence des Bergers</h1>
            <p className="text-gray-500 mt-1">Comptes rendus - {user.city}</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-6 w-6 text-purple-600" />
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input
                  type="date"
                  value={dateSelectionnee}
                  onChange={(e) => setDateSelectionnee(e.target.value)}
                  className="w-48"
                />
              </div>
              <div className="flex-1"></div>
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 Liste des Promotions</CardTitle>
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
                    <th className="text-center py-3 px-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((promo, index) => (
                    <tr key={index} className={`border-b hover:bg-gray-50 ${(promo.present || promo.absent) ? 'bg-blue-50' : ''}`}>
                      <td className="py-4 px-4 font-medium text-purple-700">
                        {promo.nom}
                        {(promo.present || promo.absent) && (
                          <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">✓</span>
                        )}
                      </td>
                      
                      <td className="text-center py-4 px-4">
                        <input
                          type="number"
                          value={promo.personnesSuivies}
                          onChange={(e) => updatePromo(index, 'personnesSuivies', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-center border rounded bg-blue-50 border-blue-200 font-medium"
                        />
                      </td>
                      
                      <td className="py-4 px-4">
                        <input
                          type="text"
                          value={promo.nomsBergers}
                          onChange={(e) => updatePromo(index, 'nomsBergers', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      
                      <td className="text-center py-4 px-4">
                        <button
                          onClick={() => updatePromo(index, 'present', !promo.present)}
                          className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all mx-auto ${
                            promo.present
                              ? 'bg-green-500 border-green-600 shadow-lg' 
                              : 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'
                          }`}
                        >
                          {promo.present && <Check className="h-8 w-8 text-white" strokeWidth={4} />}
                        </button>
                      </td>
                      
                      <td className="text-center py-4 px-4">
                        <button
                          onClick={() => updatePromo(index, 'absent', !promo.absent)}
                          className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all mx-auto ${
                            promo.absent
                              ? 'bg-red-500 border-red-600 shadow-lg' 
                              : 'bg-white border-gray-300 hover:border-red-400 hover:bg-red-50'
                          }`}
                        >
                          {promo.absent && <X className="h-8 w-8 text-white" strokeWidth={4} />}
                        </button>
                      </td>
                      
                      <td className="text-center py-4 px-4">
                        <select
                          value={promo.priere}
                          onChange={(e) => updatePromo(index, 'priere', e.target.value)}
                          className={`px-3 py-2 rounded border font-medium cursor-pointer ${
                            promo.priere === 'Oui'
                              ? 'bg-green-100 text-green-800 border-green-400'
                              : 'bg-red-100 text-red-800 border-red-400'
                          }`}
                        >
                          <option value="Non">❌ Non</option>
                          <option value="Oui">✅ Oui</option>
                        </select>
                      </td>
                      
                      <td className="py-4 px-4">
                        <input
                          type="text"
                          value={promo.commentaire}
                          onChange={(e) => updatePromo(index, 'commentaire', e.target.value)}
                          placeholder="Commentaire..."
                          className="w-full px-3 py-2 border rounded min-w-[200px]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MarquerPresenceBergersPage;
