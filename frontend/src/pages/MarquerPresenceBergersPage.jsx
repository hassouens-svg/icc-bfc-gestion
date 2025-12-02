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

  const handlePresenceChange = (bergerId, present) => {
    setPresences({
      ...presences,
      [bergerId]: { ...presences[bergerId], present }
    });
  };

  const handlePriereChange = (bergerId, checked) => {
    setPresences({
      ...presences,
      [bergerId]: { ...presences[bergerId], priere: checked }
    });
  };

  const handleCommentaireChange = (bergerId, commentaire) => {
    setPresences({
      ...presences,
      [bergerId]: { ...presences[bergerId], commentaire }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Filtrer uniquement les bergers avec une présence définie
      const presencesToSave = Object.entries(presences)
        .filter(([_, data]) => data.present !== null)
        .map(([bergerId, data]) => ({
          berger_id: bergerId,
          date: dateSelectionnee,
          present: data.present,
          priere: data.priere,
          commentaire: data.commentaire,
          enregistre_par: user.id,
          ville: user.city
        }));

      if (presencesToSave.length === 0) {
        toast.error('Veuillez marquer au moins une présence');
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

      if (!response.ok) {
        throw new Error('Erreur enregistrement');
      }

      toast.success(`✅ ${presencesToSave.length} présence(s) enregistrée(s)`);
      
      // Réinitialiser le formulaire
      const resetPresences = {};
      Object.keys(presences).forEach(id => {
        resetPresences[id] = { present: null, priere: false, commentaire: '' };
      });
      setPresences(resetPresences);
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
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marquer Présence des Bergers</h1>
            <p className="text-gray-500 mt-1">Enregistrer la présence aux comptes rendus</p>
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
              <div className="flex-1">
                <Label>Date du compte rendu</Label>
                <Input
                  type="date"
                  value={dateSelectionnee}
                  onChange={(e) => setDateSelectionnee(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des promotions avec bergers */}
        {bergers.map((promo, index) => (
          <Card key={index}>
            <CardHeader className="bg-purple-50">
              <CardTitle className="text-xl text-purple-900">{promo.promo_name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {promo.bergers.map((berger) => (
                  <div key={berger.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      {/* Nom du berger */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{berger.name}</h3>
                        <p className="text-sm text-gray-500">{berger.email}</p>
                      </div>

                      {/* Boutons Présent/Absent */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={presences[berger.id]?.present === true ? 'default' : 'outline'}
                          className={presences[berger.id]?.present === true ? 'bg-green-600 hover:bg-green-700' : ''}
                          onClick={() => handlePresenceChange(berger.id, true)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Présent
                        </Button>
                        <Button
                          size="sm"
                          variant={presences[berger.id]?.present === false ? 'default' : 'outline'}
                          className={presences[berger.id]?.present === false ? 'bg-red-600 hover:bg-red-700' : ''}
                          onClick={() => handlePresenceChange(berger.id, false)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Absent
                        </Button>
                      </div>
                    </div>

                    {/* Prière et Commentaire (visible si présence marquée) */}
                    {presences[berger.id]?.present !== null && (
                      <div className="mt-4 space-y-3 border-t pt-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`priere-${berger.id}`}
                            checked={presences[berger.id]?.priere || false}
                            onChange={(e) => handlePriereChange(berger.id, e.target.checked)}
                            className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <Label htmlFor={`priere-${berger.id}`} className="cursor-pointer">
                            🙏 Prière demandée
                          </Label>
                        </div>

                        <div>
                          <Label htmlFor={`commentaire-${berger.id}`}>Commentaire</Label>
                          <Textarea
                            id={`commentaire-${berger.id}`}
                            value={presences[berger.id]?.commentaire || ''}
                            onChange={(e) => handleCommentaireChange(berger.id, e.target.value)}
                            placeholder="Notes ou observations..."
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Bouton Enregistrer */}
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer les Présences'}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default MarquerPresenceBergersPage;
