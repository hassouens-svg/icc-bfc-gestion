import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Save, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const AgendaPublicFormPage = () => {
  const [searchParams] = useSearchParams();
  
  const departementParam = searchParams.get('departement') || '';
  const villeParam = searchParams.get('ville') || '';
  
  const [selectedVille, setSelectedVille] = useState(villeParam);
  const [selectedDepartement, setSelectedDepartement] = useState(departementParam);
  const [selectedSemestre, setSelectedSemestre] = useState('1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cities, setCities] = useState([]);
  
  // Configuration temps de prière (une seule)
  const [priereConfig, setPriereConfig] = useState({
    jour: 'mardi',
    heure: '19:00',
    isRecurrent: false,
    frequence: 'hebdomadaire'
  });
  
  // Liste des activités
  const [activites, setActivites] = useState([]);

  const departements = [
    'MLA', 'Accueil', 'Soins pastoraux', 'Régie', 'Sono', 'Sainte cène',
    'Impact junior', 'Navette', 'Prière', 'Protocole', 'Sécurité',
    'Communication', 'Coordination', 'Bergeries', 'Formation', 'Finance',
    'Ministère des femmes (bureau)', 'Ministère des hommes (bureau)',
    'Impact santé', 'Évènementiel/Restauration', 'Modération',
    'EJP-Prière - Intercession', 'EJP-Coordination', 'EJP-MLA',
    'EJP-Sono', 'EJP-Modération', 'EJP-COM', 'EJP-Accueil',
    'EJP-Communion Fraternelle'
  ];

  const joursSemaine = [
    { value: 'lundi', label: 'Lundi' },
    { value: 'mardi', label: 'Mardi' },
    { value: 'mercredi', label: 'Mercredi' },
    { value: 'jeudi', label: 'Jeudi' },
    { value: 'vendredi', label: 'Vendredi' },
    { value: 'samedi', label: 'Samedi' },
    { value: 'dimanche', label: 'Dimanche' }
  ];

  const frequences = [
    { value: 'hebdomadaire', label: 'Chaque semaine' },
    { value: 'bimensuel', label: 'Toutes les 2 semaines' },
    { value: 'mensuel', label: 'Chaque mois' }
  ];

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cities`);
      const data = await response.json();
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const addActivite = () => {
    setActivites([...activites, { titre: '', date: '', heure: '', description: '' }]);
  };

  const removeActivite = (index) => {
    setActivites(activites.filter((_, i) => i !== index));
  };

  const updateActivite = (index, field, value) => {
    const newActivites = [...activites];
    newActivites[index][field] = value;
    setActivites(newActivites);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedVille || !selectedDepartement) {
      toast.error('Veuillez sélectionner la ville et le département');
      return;
    }

    setLoading(true);
    let totalCreated = 0;

    try {
      // 1. Enregistrer la configuration temps de prière
      const priereResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda-priere`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'temps_priere_config',
            departement: selectedDepartement,
            jour: priereConfig.jour,
            heure: priereConfig.heure,
            isRecurrent: priereConfig.isRecurrent,
            frequence: priereConfig.isRecurrent ? priereConfig.frequence : null,
            semestre: selectedSemestre,
            annee: selectedYear,
            ville: selectedVille
          })
        }
      );
      
      if (priereResponse.ok) {
        totalCreated++;
      }
      
      // 2. Enregistrer les activités
      for (const act of activites) {
        if (act.titre && act.date) {
          const response = await fetch(
            `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda-public`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                date: act.date,
                type: 'activite',
                titre: act.titre,
                description: act.description,
                heure: act.heure,
                statut: 'planifie',
                departement: selectedDepartement,
                ville: selectedVille,
                semestre: selectedSemestre,
                annee: selectedYear
              })
            }
          );
          if (response.ok) totalCreated++;
        }
      }
      
      if (totalCreated > 0) {
        setSubmitted(true);
        toast.success('Agenda enregistré avec succès !');
      } else {
        toast.error('Aucune donnée à enregistrer');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-100 p-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-12 pb-8 px-8">
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-20 w-20 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Agenda enregistré ! 📅
            </h1>
            <p className="text-gray-600 mb-6">
              L'agenda du département <strong>{selectedDepartement}</strong> a été mis à jour.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Modifier à nouveau
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const jourLabel = joursSemaine.find(j => j.value === priereConfig.jour)?.label || priereConfig.jour;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="text-5xl mb-4">📅</div>
            <CardTitle className="text-2xl">Agenda du Département</CardTitle>
            <CardDescription>
              Configurez le temps de prière et ajoutez vos activités
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Configuration générale */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label>Ville *</Label>
                <Select value={selectedVille} onValueChange={setSelectedVille}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city, idx) => {
                      const cityName = typeof city === 'object' ? city.name : city;
                      return <SelectItem key={idx} value={cityName}>{cityName}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Département *</Label>
                <Select value={selectedDepartement} onValueChange={setSelectedDepartement}>
                  <SelectTrigger>
                    <SelectValue placeholder="Département" />
                  </SelectTrigger>
                  <SelectContent>
                    {departements.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Semestre</Label>
                <Select value={selectedSemestre} onValueChange={setSelectedSemestre}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semestre 1</SelectItem>
                    <SelectItem value="2">Semestre 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Année</Label>
                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(year => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Temps de prière */}
        <Card>
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-purple-800">🙏 Temps de prière</CardTitle>
            <CardDescription>Configurez votre temps de prière (un seul par département)</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jour</Label>
                <Select value={priereConfig.jour} onValueChange={(v) => setPriereConfig({...priereConfig, jour: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {joursSemaine.map(j => (
                      <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={priereConfig.heure}
                  onChange={(e) => setPriereConfig({...priereConfig, heure: e.target.value})}
                />
              </div>
            </div>
            
            {/* Checkbox récurrence */}
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <input
                type="checkbox"
                id="isRecurrent"
                checked={priereConfig.isRecurrent}
                onChange={(e) => setPriereConfig({...priereConfig, isRecurrent: e.target.checked})}
                className="w-4 h-4 text-purple-600"
              />
              <Label htmlFor="isRecurrent" className="cursor-pointer font-medium text-purple-800">
                🔄 Récurrent
              </Label>
            </div>
            
            {priereConfig.isRecurrent && (
              <div>
                <Label>Fréquence</Label>
                <Select value={priereConfig.frequence} onValueChange={(v) => setPriereConfig({...priereConfig, frequence: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequences.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              {priereConfig.isRecurrent ? (
                <>💡 Temps de prière le <strong>{jourLabel}</strong> à <strong>{priereConfig.heure}</strong> - {frequences.find(f => f.value === priereConfig.frequence)?.label}</>
              ) : (
                <>💡 Temps de prière le <strong>{jourLabel}</strong> à <strong>{priereConfig.heure}</strong></>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section Activités */}
        <Card>
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center justify-between text-orange-800">
              <span>📌 Activités</span>
              <Button type="button" size="sm" onClick={addActivite} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </CardTitle>
            <CardDescription>Ajoutez vos programmes, formations, événements...</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {activites.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>Aucune activité ajoutée</p>
                <Button type="button" onClick={addActivite} className="mt-3 bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une activité
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activites.map((act, index) => (
                  <div key={index} className="p-4 bg-orange-50/50 rounded-lg border border-orange-200">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-orange-700">Activité {index + 1}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeActivite(index)}
                        className="text-red-500 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>Titre *</Label>
                        <Input
                          value={act.titre}
                          onChange={(e) => updateActivite(index, 'titre', e.target.value)}
                          placeholder="Ex: Retraite annuelle, Formation..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Date *</Label>
                          <Input
                            type="date"
                            value={act.date}
                            onChange={(e) => updateActivite(index, 'date', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Heure</Label>
                          <Input
                            type="time"
                            value={act.heure}
                            onChange={(e) => updateActivite(index, 'heure', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={act.description}
                          onChange={(e) => updateActivite(index, 'description', e.target.value)}
                          placeholder="Détails de l'activité..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bouton Submit */}
        <Button 
          onClick={handleSubmit}
          className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg" 
          disabled={loading || !selectedVille || !selectedDepartement}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Enregistrer l'agenda
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AgendaPublicFormPage;
