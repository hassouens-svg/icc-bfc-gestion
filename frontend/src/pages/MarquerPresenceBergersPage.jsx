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
import { Calendar, Save, ArrowLeft, Edit } from 'lucide-react';

const MarquerPresenceBergersPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [promoStats, setPromoStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateSelectionnee, setDateSelectionnee] = useState(new Date().toISOString().split('T')[0]);
  const [presencesData, setPresencesData] = useState({});
  const [editingPromo, setEditingPromo] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'superviseur_promos') {
      navigate('/dashboard');
      return;
    }
    loadPromoData();
  }, [user, navigate]);

  const loadPromoData = async () => {
    try {
      // Charger les bergers/référents
      const allUsers = await getReferents();
      const bergersList = allUsers.filter(
        u => (u.role === 'berger' || u.role === 'referent') && u.city === user.city
      );
      
      // Charger les visiteurs pour calculer le nombre de personnes suivies
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/visitors?include_stopped=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const allVisitors = await response.json();
      const cityVisitors = allVisitors.filter(v => v.city === user.city);
      
      // Grouper par promo avec statistiques
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
              bergers: [],
              personnes_suivies: 0
            };
          }
          promoGroups[promoName].bergers.push(berger);
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
      
      setPromoStats(sortedPromos);
      
      // Initialiser les données de présence par promo
      const initialData = {};
      sortedPromos.forEach(promo => {
        initialData[promo.promo_name] = {
          presents: 0,
          absents: 0,
          priere: false,
          commentaire: ''
        };
      });
      setPresencesData(initialData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPromo = (promo) => {
    setEditingPromo({
      ...promo,
      editData: presencesData[promo.promo_name]
    });
  };

  const handleSavePromo = async () => {
    if (!editingPromo) return;
    
    setSaving(true);
    try {
      const promoData = presencesData[editingPromo.promo_name];
      
      // Sauvegarder pour chaque berger de la promo
      const presencesToSave = editingPromo.bergers.map(berger => ({
        berger_id: berger.id,
        date: dateSelectionnee,
        present: promoData.presents > 0, // Si au moins 1 présent
        priere: promoData.priere,
        commentaire: promoData.commentaire,
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

      toast.success(`✅ Présence de ${editingPromo.promo_name} enregistrée`);
      setEditingPromo(null);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePresencesData = (promoName, field, value) => {
    setPresencesData({
      ...presencesData,
      [promoName]: {
        ...presencesData[promoName],
        [field]: value
      }
    });
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
        {/* Header */}
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

        {/* Sélection de date */}
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

        {/* Tableau des promotions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Liste des Promotions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nom de la Promo</th>
                    <th className="text-center py-3 px-4">Nbre de Pers Suivies</th>
                    <th className="text-center py-3 px-4">
                      Nbre de Bergers
                      <Edit className="inline h-3 w-3 ml-1 text-gray-400" />
                    </th>
                    <th className="text-center py-3 px-4">Présents</th>
                    <th className="text-center py-3 px-4">Absents</th>
                    <th className="text-center py-3 px-4">Prière</th>
                    <th className="text-left py-3 px-4">Commentaire</th>
                    <th className="text-center py-3 px-4">Action</th>
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
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                            {promo.bergers.length}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <Input
                            type="number"
                            min="0"
                            max={promo.bergers.length}
                            value={presencesData[promo.promo_name]?.presents || 0}
                            onChange={(e) => handleUpdatePresencesData(promo.promo_name, 'presents', parseInt(e.target.value) || 0)}
                            className="w-20 text-center"
                          />
                        </td>
                        <td className="text-center py-3 px-4">
                          <Input
                            type="number"
                            min="0"
                            max={promo.bergers.length}
                            value={presencesData[promo.promo_name]?.absents || 0}
                            onChange={(e) => handleUpdatePresencesData(promo.promo_name, 'absents', parseInt(e.target.value) || 0)}
                            className="w-20 text-center"
                          />
                        </td>
                        <td className="text-center py-3 px-4">
                          <input
                            type="checkbox"
                            checked={presencesData[promo.promo_name]?.priere || false}
                            onChange={(e) => handleUpdatePresencesData(promo.promo_name, 'priere', e.target.checked)}
                            className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="text"
                            value={presencesData[promo.promo_name]?.commentaire || ''}
                            onChange={(e) => handleUpdatePresencesData(promo.promo_name, 'commentaire', e.target.value)}
                            placeholder="Notes..."
                            className="min-w-[200px]"
                          />
                        </td>
                        <td className="text-center py-3 px-4">
                          <Button
                            size="sm"
                            onClick={() => handleEditPromo(promo)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Modifier
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        Aucune promotion trouvée pour {user.city}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="bg-purple-50">
                <CardTitle>Modifier la Présence - {editingPromo.promo_name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Nombre de bergers :</strong> {editingPromo.bergers.length}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Bergers :</strong> {editingPromo.bergers.map(b => b.name).join(', ')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre de présents</Label>
                    <Input
                      type="number"
                      min="0"
                      max={editingPromo.bergers.length}
                      value={presencesData[editingPromo.promo_name]?.presents || 0}
                      onChange={(e) => handleUpdatePresencesData(editingPromo.promo_name, 'presents', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Nombre d'absents</Label>
                    <Input
                      type="number"
                      min="0"
                      max={editingPromo.bergers.length}
                      value={presencesData[editingPromo.promo_name]?.absents || 0}
                      onChange={(e) => handleUpdatePresencesData(editingPromo.promo_name, 'absents', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="modal-priere"
                    checked={presencesData[editingPromo.promo_name]?.priere || false}
                    onChange={(e) => handleUpdatePresencesData(editingPromo.promo_name, 'priere', e.target.checked)}
                    className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <Label htmlFor="modal-priere" className="cursor-pointer">
                    🙏 Prière demandée
                  </Label>
                </div>

                <div>
                  <Label>Commentaire</Label>
                  <Textarea
                    value={presencesData[editingPromo.promo_name]?.commentaire || ''}
                    onChange={(e) => handleUpdatePresencesData(editingPromo.promo_name, 'commentaire', e.target.value)}
                    placeholder="Notes ou observations..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setEditingPromo(null)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSavePromo}
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
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
