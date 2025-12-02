import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser, getReferents } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Calendar, ArrowLeft, Edit2 } from 'lucide-react';

const MarquerPresenceBergersPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [promoStats, setPromoStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateSelectionnee, setDateSelectionnee] = useState(new Date().toISOString().split('T')[0]);
  const [editingPromo, setEditingPromo] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'superviseur_promos') {
      navigate('/dashboard');
      return;
    }
    loadPromoData();
  }, [user, navigate]);

  const getMonthName = (monthNum) => {
    const months = {
      '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
      '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
      '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
    };
    return months[monthNum] || monthNum;
  };

  const loadPromoData = async () => {
    try {
      const allUsers = await getReferents();
      const bergersList = allUsers.filter(
        u => (u.role === 'berger' || u.role === 'referent') && u.city === user.city
      );
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/visitors?include_stopped=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const allVisitors = await response.json();
      const cityVisitors = allVisitors.filter(v => v.city === user.city);
      
      // Grouper par mois (pas par surnom de promo)
      const promoGroups = {};
      bergersList.forEach(berger => {
        if (berger.assigned_month) {
          const monthPart = berger.assigned_month.split('-')[1];
          const monthName = getMonthName(monthPart);
          const promoKey = `Promo ${monthName}`;
          
          if (!promoGroups[promoKey]) {
            promoGroups[promoKey] = {
              promo_name: promoKey,
              month_num: monthPart,
              bergers: [],
              personnes_suivies: 0
            };
          }
          promoGroups[promoKey].bergers.push(berger);
        }
      });
      
      // Calculer personnes suivies
      Object.keys(promoGroups).forEach(promoName => {
        const monthNum = promoGroups[promoName].month_num;
        const suivies = cityVisitors.filter(v => {
          if (!v.assigned_month) return false;
          const visitorMonth = v.assigned_month.split('-')[1];
          return visitorMonth === monthNum && v.statut_suivi !== 'arrete';
        });
        promoGroups[promoName].personnes_suivies = suivies.length;
      });
      
      const sortedPromos = Object.values(promoGroups).sort((a, b) => 
        parseInt(a.month_num) - parseInt(b.month_num)
      );
      
      setPromoStats(sortedPromos);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPromo = (promo) => {
    setEditingPromo(promo);
    setEditFormData({
      presents: 0,
      absents: 0,
      priere: false,
      commentaire: '',
      personnes_suivies: promo.personnes_suivies
    });
  };

  const handleSavePromo = async () => {
    if (!editingPromo) return;
    
    setSaving(true);
    try {
      const presencesToSave = editingPromo.bergers.map(berger => ({
        berger_id: berger.id,
        date: dateSelectionnee,
        present: editFormData.presents > 0,
        priere: editFormData.priere,
        commentaire: editFormData.commentaire,
        enregistre_par: user.id,
        ville: user.city,
        promo_name: editingPromo.promo_name
      }));

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/berger-presences/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ presences: presencesToSave })
      });

      if (!response.ok) {
        throw new Error('Erreur enregistrement');
      }

      toast.success(`✅ ${editingPromo.promo_name} enregistré`);
      setEditingPromo(null);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement');
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
            <p className="text-gray-500 mt-1">Enregistrer la présence aux comptes rendus - {user.city}</p>
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
                <Label>Date du compte rendu</Label>
                <Input
                  type="date"
                  value={dateSelectionnee}
                  onChange={(e) => setDateSelectionnee(e.target.value)}
                  className="w-48"
                />
              </div>
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
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nom de la Promo</th>
                    <th className="text-center py-3 px-4">
                      Nbre de Pers Suivies
                      <Edit2 className="inline h-3 w-3 ml-1 text-gray-400" />
                    </th>
                    <th className="text-left py-3 px-4">Noms des Bergers</th>
                    <th className="text-center py-3 px-4">Présents</th>
                    <th className="text-center py-3 px-4">Absents</th>
                    <th className="text-center py-3 px-4">Prière</th>
                    <th className="text-left py-3 px-4">Commentaire</th>
                    <th className="text-center py-3 px-4">
                      <Edit2 className="h-4 w-4" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {promoStats.length > 0 ? (
                    promoStats.map((promo, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-purple-700">{promo.promo_name}</td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                            {promo.personnes_suivies}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {promo.bergers.map(b => b.name).join(', ')}
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-gray-400">-</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-gray-400">-</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <input type="checkbox" disabled className="h-4 w-4" />
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">
                          -
                        </td>
                        <td className="text-center py-3 px-4">
                          <Button
                            size="sm"
                            onClick={() => handleEditPromo(promo)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        Aucune promotion trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal de modification */}
        {editingPromo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="bg-purple-50">
                <CardTitle>Modifier - {editingPromo.promo_name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Bergers ({editingPromo.bergers.length}) :</strong> {editingPromo.bergers.map(b => b.name).join(', ')}
                  </p>
                </div>

                <div>
                  <Label>Nombre de personnes suivies (éditable)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editFormData.personnes_suivies || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, personnes_suivies: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre de présents</Label>
                    <Input
                      type="number"
                      min="0"
                      max={editingPromo.bergers.length}
                      value={editFormData.presents || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, presents: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Nombre d\'absents</Label>
                    <Input
                      type="number"
                      min="0"
                      max={editingPromo.bergers.length}
                      value={editFormData.absents || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, absents: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-yellow-50 p-4 rounded-lg">
                  <input
                    type="checkbox"
                    id="modal-priere"
                    checked={editFormData.priere || false}
                    onChange={(e) => setEditFormData({ ...editFormData, priere: e.target.checked })}
                    className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <Label htmlFor="modal-priere" className="cursor-pointer text-lg">
                    🙏 Prière demandée
                  </Label>
                </div>

                <div>
                  <Label>Commentaire</Label>
                  <Textarea
                    value={editFormData.commentaire || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, commentaire: e.target.value })}
                    placeholder="Notes ou observations..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setEditingPromo(null)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSavePromo}
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MarquerPresenceBergersPage;
