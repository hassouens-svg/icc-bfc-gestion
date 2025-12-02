import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser, getReferents } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Calendar, ArrowLeft, Edit2, Check, X, Save } from 'lucide-react';

const MarquerPresenceBergersPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [promoStats, setPromoStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateSelectionnee, setDateSelectionnee] = useState(new Date().toISOString().split('T')[0]);
  const [presencesData, setPresencesData] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');

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
      
      // Initialiser les données de présence
      const initialData = {};
      sortedPromos.forEach(promo => {
        initialData[promo.promo_name] = {
          present: false,
          absent: false,
          priere: 'Non',
          commentaire: '',
          noms_bergers: promo.bergers.map(b => b.name).join(', '),
          personnes_suivies: promo.personnes_suivies
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

  const handleCheckboxChange = (promoName, field) => {
    setPresencesData(prev => {
      const currentValue = prev[promoName]?.[field] || false;
      return {
        ...prev,
        [promoName]: {
          ...prev[promoName],
          [field]: !currentValue,
          // Si on coche présent, on décoche absent et vice versa
          ...(field === 'present' && { absent: false }),
          ...(field === 'absent' && { present: false })
        }
      };
    });
  };

  const handlePriereChange = (promoName, value) => {
    setPresencesData(prev => ({
      ...prev,
      [promoName]: {
        ...prev[promoName],
        priere: value
      }
    }));
    console.log('Prière changée pour', promoName, ':', value);
  };

  const handleCommentaireChange = (promoName, value) => {
    setPresencesData(prev => ({
      ...prev,
      [promoName]: {
        ...prev[promoName],
        commentaire: value
      }
    }));
  };

  const startEditing = (promoName, field, currentValue) => {
    setEditingField({ promoName, field });
    setTempValue(currentValue);
  };

  const saveEditing = () => {
    if (editingField) {
      const newValue = editingField.field === 'personnes_suivies' 
        ? parseInt(tempValue) || 0 
        : tempValue;
      
      setPresencesData(prev => ({
        ...prev,
        [editingField.promoName]: {
          ...prev[editingField.promoName],
          [editingField.field]: newValue
        }
      }));
      setEditingField(null);
      setTempValue('');
      toast.success('✅ Modifié');
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleSaveAll = async () => {
    try {
      const presencesToSave = [];
      
      Object.entries(presencesData).forEach(([promoName, data]) => {
        if (data.present || data.absent) {
          const promo = promoStats.find(p => p.promo_name === promoName);
          if (promo) {
            promo.bergers.forEach(berger => {
              presencesToSave.push({
                berger_id: berger.id,
                date: dateSelectionnee,
                present: data.present,
                priere: data.priere === 'Oui',
                commentaire: data.commentaire,
                enregistre_par: user.id,
                ville: user.city,
                promo_name: promoName
              });
            });
          }
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

      if (!response.ok) {
        throw new Error('Erreur enregistrement');
      }

      toast.success(`✅ ${presencesToSave.length} présence(s) enregistrée(s)`);
      
      // Réinitialiser
      loadPromoData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement');
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
                <Label>Sélectionnez la date</Label>
                <Input
                  type="date"
                  value={dateSelectionnee}
                  onChange={(e) => setDateSelectionnee(e.target.value)}
                  className="w-48"
                />
              </div>
              <div className="flex-1"></div>
              <Button 
                onClick={handleSaveAll}
                className="bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                <Save className="h-5 w-5 mr-2" />
                Enregistrer
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
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nom de la Promo</th>
                    <th className="text-center py-3 px-4">Nbre de Pers Suivies</th>
                    <th className="text-left py-3 px-4">Noms des Bergers</th>
                    <th className="text-center py-3 px-4">Présent</th>
                    <th className="text-center py-3 px-4">Absent</th>
                    <th className="text-center py-3 px-4">Prière</th>
                    <th className="text-left py-3 px-4">Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {promoStats.map((promo, index) => {
                    const data = presencesData[promo.promo_name] || {
                      present: false,
                      absent: false,
                      priere: 'Non',
                      commentaire: '',
                      noms_bergers: promo.bergers.map(b => b.name).join(', '),
                      personnes_suivies: promo.personnes_suivies
                    };
                    const isEditingBergers = editingField?.promoName === promo.promo_name && editingField?.field === 'noms_bergers';
                    const isEditingSuivies = editingField?.promoName === promo.promo_name && editingField?.field === 'personnes_suivies';
                    
                    const hasData = data.present || data.absent;
                    
                    return (
                      <tr key={index} className={`border-b hover:bg-gray-50 ${hasData ? 'bg-blue-50' : ''}`}>
                        <td className="py-3 px-4 font-medium text-purple-700">
                          {promo.promo_name}
                          {hasData && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">✓</span>}
                        </td>
                        
                        {/* Nbre de Pers Suivies - Editable */}
                        <td className="text-center py-3 px-4">
                          {isEditingSuivies ? (
                            <div className="flex items-center gap-1 justify-center">
                              <Input
                                type="number"
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                className="w-20 text-center"
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={saveEditing}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEditing}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 justify-center">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                                {data.personnes_suivies || 0}
                              </span>
                              <button
                                onClick={() => startEditing(promo.promo_name, 'personnes_suivies', data.personnes_suivies || 0)}
                                className="text-gray-400 hover:text-purple-600"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                        
                        {/* Noms des Bergers - Editable */}
                        <td className="py-3 px-4">
                          {isEditingBergers ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                className="text-sm"
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={saveEditing}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEditing}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">{data.noms_bergers || '-'}</span>
                              <button
                                onClick={() => startEditing(promo.promo_name, 'noms_bergers', data.noms_bergers || '')}
                                className="text-gray-400 hover:text-purple-600"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                        
                        {/* Présent - Grosse case à cocher */}
                        <td className="text-center py-3 px-4">
                          <button
                            onClick={() => {
                              console.log('Click présent pour', promo.promo_name, 'État actuel:', data.present);
                              handleCheckboxChange(promo.promo_name, 'present');
                            }}
                            className={`w-10 h-10 rounded border-2 flex items-center justify-center transition-all mx-auto ${
                              data.present === true
                                ? 'bg-green-500 border-green-600 shadow-md' 
                                : 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'
                            }`}
                            title={data.present ? "Présent coché" : "Marquer comme présent"}
                          >
                            {data.present === true && <Check className="h-7 w-7 text-white font-bold" strokeWidth={4} />}
                          </button>
                        </td>
                        
                        {/* Absent - Grosse case à cocher */}
                        <td className="text-center py-3 px-4">
                          <button
                            onClick={() => {
                              console.log('Click absent pour', promo.promo_name, 'État actuel:', data.absent);
                              handleCheckboxChange(promo.promo_name, 'absent');
                            }}
                            className={`w-10 h-10 rounded border-2 flex items-center justify-center transition-all mx-auto ${
                              data.absent === true
                                ? 'bg-red-500 border-red-600 shadow-md' 
                                : 'bg-white border-gray-300 hover:border-red-400 hover:bg-red-50'
                            }`}
                            title={data.absent ? "Absent coché" : "Marquer comme absent"}
                          >
                            {data.absent === true && <X className="h-7 w-7 text-white font-bold" strokeWidth={4} />}
                          </button>
                        </td>
                        
                        {/* Prière - Liste déroulante */}
                        <td className="text-center py-3 px-4">
                          <Select 
                            value={data.priere || 'Non'} 
                            onValueChange={(value) => handlePriereChange(promo.promo_name, value)}
                          >
                            <SelectTrigger className={`w-24 ${
                              data.priere === 'Oui' 
                                ? 'bg-green-100 text-green-800 border-green-300' 
                                : 'bg-red-100 text-red-800 border-red-300'
                            }`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Oui" className="text-green-700 font-medium">✔️ Oui</SelectItem>
                              <SelectItem value="Non" className="text-red-700 font-medium">❌ Non</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        
                        {/* Commentaire */}
                        <td className="py-3 px-4">
                          <Input
                            type="text"
                            value={data.commentaire || ''}
                            onChange={(e) => handleCommentaireChange(promo.promo_name, e.target.value)}
                            placeholder="Commentaire..."
                            className="min-w-[200px]"
                          />
                        </td>
                      </tr>
                    );
                  })}
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
