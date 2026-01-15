import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Info, Save, TrendingUp, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

// Configuration des KPIs avec les nouveaux coefficients
const KPI_CONFIG = {
  presence_dimanche: {
    label: "Présence Dimanche Église",
    poids: 5,
    options: [
      { value: 0, label: "Non renseigné", points: 0 },
      { value: 1, label: "1 fois", points: 1 },
      { value: 2, label: "2 fois", points: 2 },
      { value: 3, label: "3 fois", points: 3 },
      { value: 4, label: "4-5 fois", points: 4 }
    ]
  },
  presence_fi: {
    label: "Présence FI",
    poids: 2,
    options: [
      { value: 0, label: "Non renseigné", points: 0 },
      { value: 1, label: "1 fois", points: 1 },
      { value: 2, label: "2 fois", points: 2 },
      { value: 3, label: "3 fois", points: 3 },
      { value: 4, label: "4-5 fois", points: 4 }
    ]
  },
  presence_reunion_disciples: {
    label: "Présence Réunion Disciples",
    poids: 3,
    options: [
      { value: 0, label: "Non renseigné", points: 0 },
      { value: 1, label: "1 fois", points: 1 },
      { value: 2, label: "2 fois", points: 2 },
      { value: 3, label: "3 fois", points: 3 },
      { value: 4, label: "4-5 fois", points: 4 }
    ]
  },
  service_eglise: {
    label: "Service à l'Église",
    poids: 6,
    options: [
      { value: 0, label: "Non renseigné", points: 0 },
      { value: 1, label: "Membre", points: 1 },
      { value: 2, label: "Aide", points: 2 },
      { value: 3, label: "Star", points: 3 }
    ]
  },
  consommation_pain_jour: {
    label: "Consommation Pain du Jour",
    poids: 5,
    options: [
      { value: 0, label: "Non renseigné", points: 0 },
      { value: 1, label: "Rarement", points: 1 },
      { value: 2, label: "Fréquemment", points: 2 },
      { value: 3, label: "Tous les jours", points: 3 }
    ]
  },
  bapteme: {
    label: "Baptême",
    poids: 2,
    options: [
      { value: 0, label: "Non", points: 0 },
      { value: 1, label: "Oui", points: 1 }
    ]
  }
};

// Niveaux de discipolat - Ajustés pour les nouveaux scores
const LEVELS = [
  { min: 0, max: 19, label: "Non classé", color: "bg-gray-100 text-gray-600", emoji: "⚪" },
  { min: 20, max: 39, label: "Débutant", color: "bg-blue-100 text-blue-700", emoji: "🔵" },
  { min: 40, max: 59, label: "Intermédiaire", color: "bg-yellow-100 text-yellow-700", emoji: "🟡" },
  { min: 60, max: 200, label: "Confirmé", color: "bg-green-100 text-green-700", emoji: "🟢" }
];

const getLevel = (score) => {
  return LEVELS.find(l => score >= l.min && score <= l.max) || LEVELS[0];
};

const getLevelByName = (name) => {
  return LEVELS.find(l => l.label === name) || LEVELS[0];
};

const KPIDiscipolat = ({ visitorId, visitorName, isBergerieMember = false }) => {
  const [kpiData, setKpiData] = useState({
    presence_dimanche: 0,
    presence_fi: 0,
    presence_reunion_disciples: 0,
    service_eglise: 0,
    consommation_pain_jour: 0,
    bapteme: 0,
    commentaire: ""
  });
  const [selectedMois, setSelectedMois] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [allKpis, setAllKpis] = useState([]);
  const [averageScore, setAverageScore] = useState(0);
  const [averageLevel, setAverageLevel] = useState("Non classé");
  const [manualStatus, setManualStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    return months;
  };

  useEffect(() => {
    loadKPIs();
  }, [visitorId]);

  useEffect(() => {
    loadKPIForMonth(selectedMois);
  }, [selectedMois, visitorId]);

  const loadKPIs = async () => {
    try {
      const endpoint = isBergerieMember 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/membres/${visitorId}/kpi`
        : `${process.env.REACT_APP_BACKEND_URL}/api/visitors/${visitorId}/kpi`;
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllKpis(data.kpis || []);
        setAverageScore(data.average_score || 0);
        setAverageLevel(data.average_level || "Non classé");
        setManualStatus(data.manual_status || null);
      }
    } catch (error) {
      console.error('Error loading KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKPIForMonth = async (mois) => {
    try {
      const endpoint = isBergerieMember 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/membres/${visitorId}/kpi/${mois}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/visitors/${visitorId}/kpi/${mois}`;
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setKpiData({
          presence_dimanche: data.presence_dimanche || 0,
          presence_fi: data.presence_fi || 0,
          presence_reunion_disciples: data.presence_reunion_disciples || 0,
          service_eglise: data.service_eglise || 0,
          consommation_pain_jour: data.consommation_pain_jour || 0,
          bapteme: data.bapteme || 0,
          commentaire: data.commentaire || ""
        });
      }
    } catch (error) {
      console.error('Error loading KPI for month:', error);
    }
  };

  const calculateCurrentScore = () => {
    let score = 0;
    Object.entries(KPI_CONFIG).forEach(([key, config]) => {
      score += (kpiData[key] || 0) * config.poids;
    });
    return score;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoint = isBergerieMember 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/membres/${visitorId}/kpi`
        : `${process.env.REACT_APP_BACKEND_URL}/api/visitors/${visitorId}/kpi`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          mois: selectedMois,
          ...kpiData
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`KPIs enregistrés ! Score: ${result.score} - ${result.level}`);
        loadKPIs();
      } else {
        toast.error("Erreur lors de l'enregistrement");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  };

  const currentScore = calculateCurrentScore();
  const currentLevel = getLevel(currentScore);
  const displayedStatus = manualStatus || averageLevel;
  const displayedLevelInfo = getLevelByName(displayedStatus);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            KPI Discipolat
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowHelp(true)}>
            <HelpCircle className="h-4 w-4 mr-1" />
            Méthode
          </Button>
        </div>
        
        <div className="flex items-center gap-4 mt-2">
          <div className={`px-3 py-1 rounded-full ${displayedLevelInfo.color} flex items-center gap-2`}>
            <span>{displayedLevelInfo.emoji}</span>
            <span className="font-medium">{displayedStatus}</span>
            {!manualStatus && <span className="text-sm">({averageScore} pts)</span>}
          </div>
          <span className="text-sm text-gray-500">
            {manualStatus ? "Statut manuel" : `Statut moyen sur ${allKpis.length} mois`}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <Label className="whitespace-nowrap font-medium">Mois :</Label>
          <Select value={selectedMois} onValueChange={setSelectedMois}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getMonthOptions().map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className={`ml-auto px-3 py-1 rounded-full ${currentLevel.color} flex items-center gap-2`}>
            <span>{currentLevel.emoji}</span>
            <span className="font-medium">{currentLevel.label}</span>
            <span className="text-sm font-bold">({currentScore} pts)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(KPI_CONFIG).map(([key, config]) => (
            <div key={key} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="font-medium">{config.label}</Label>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  ×{config.poids}
                </span>
              </div>
              <Select 
                value={String(kpiData[key])} 
                onValueChange={(v) => setKpiData({...kpiData, [key]: parseInt(v)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {config.options.map(opt => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label} {opt.points > 0 && `(${opt.points} pt${opt.points > 1 ? 's' : ''})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="p-3 border rounded-lg">
          <Label className="font-medium mb-2 block">Commentaire</Label>
          <Textarea 
            value={kpiData.commentaire}
            onChange={(e) => setKpiData({...kpiData, commentaire: e.target.value})}
            placeholder="Notes sur le suivi de ce mois..."
            rows={2}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Enregistrement...' : 'Enregistrer les KPIs'}
        </Button>

        {allKpis.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Historique</h4>
            <div className="flex flex-wrap gap-2">
              {allKpis.map(kpi => {
                const lvl = getLevel(kpi.score);
                return (
                  <button
                    key={kpi.mois}
                    onClick={() => setSelectedMois(kpi.mois)}
                    className={`px-3 py-1 rounded-full text-sm ${selectedMois === kpi.mois ? 'ring-2 ring-purple-500' : ''} ${lvl.color}`}
                  >
                    {new Date(kpi.mois + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                    <span className="ml-1 font-bold">{kpi.score}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-purple-600" />
              Méthode de calcul - KPI Discipolat
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Formule</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                Score = Σ (Valeur × Coefficient)
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Coefficients (Poids)</h4>
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(KPI_CONFIG).map(([key, config]) => (
                    <tr key={key} className="border-b">
                      <td className="py-1">{config.label}</td>
                      <td className="py-1 text-right font-medium text-purple-600">×{config.poids}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Niveaux</h4>
              <div className="space-y-1">
                {LEVELS.map(level => (
                  <div key={level.label} className={`flex items-center justify-between p-2 rounded ${level.color}`}>
                    <span>{level.emoji} {level.label}</span>
                    <span className="text-sm">{level.min} - {level.max} pts</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-500 italic bg-blue-50 p-3 rounded">
              Le statut final est la moyenne des scores de tous les mois enregistrés.
              Un statut manuel peut être défini pour remplacer le calcul automatique.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default KPIDiscipolat;
export { KPI_CONFIG, LEVELS, getLevel, getLevelByName };
