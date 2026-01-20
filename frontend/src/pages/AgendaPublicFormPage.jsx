import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Calendar, Save, Trash2, CheckCircle } from 'lucide-react';
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
  
  // Section Temps de prière
  const [priereForm, setPriereForm] = useState({
    jour: 'mardi',
    heure: '19:00',
    frequence: 'hebdomadaire',
    dateDebut: '',
    dateFin: ''
  });
  
  // Section Activités (liste)
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
    { value: 'hebdomadaire', label: 'Chaque semaine', interval: 7 },
    { value: 'bimensuel', label: 'Toutes les 2 semaines', interval: 14 },
    { value: 'mensuel', label: 'Chaque mois', interval: 30 }
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

  // Générer les dates récurrentes
  const generateRecurringDates = (startDate, endDate, dayOfWeek, frequence) => {
    const dayMap = {
      'lundi': 1, 'mardi': 2, 'mercredi': 3, 'jeudi': 4,
      'vendredi': 5, 'samedi': 6, 'dimanche': 0
    };
    
    const interval = frequences.find(f => f.value === frequence)?.interval || 7;
    const targetDay = dayMap[dayOfWeek];
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current.getDay() !== targetDay) {
      current.setDate(current.getDate() + 1);
    }
    
    while (current <= end) {
      dates.push(new Date(current).toISOString().split('T')[0]);
      current.setDate(current.getDate() + interval);
    }
    
    return dates;
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
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda-public`;
      const headers = { 'Content-Type': 'application/json' };
      
      // 1. Créer les temps de prière si les dates sont définies
      if (priereForm.dateDebut && priereForm.dateFin) {
        const dates = generateRecurringDates(
          priereForm.dateDebut, 
          priereForm.dateFin, 
          priereForm.jour, 
          priereForm.frequence
        );
        
        const jourLabel = joursSemaine.find(j => j.value === priereForm.jour)?.label;
        const freqLabel = frequences.find(f => f.value === priereForm.frequence)?.label;
        
        for (const date of dates) {
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              date,
              type: 'temps_priere',
              titre: `Temps de prière - ${jourLabel}`,
              description: `${freqLabel} à ${priereForm.heure}`,
              heure: priereForm.heure,
              statut: 'planifie',
              departement: selectedDepartement,
              ville: selectedVille,
              semestre: selectedSemestre,
              annee: selectedYear,
              frequence: priereForm.frequence,
              jour: priereForm.jour
            })
          });
          if (response.ok) totalCreated++;
        }
      }
      
      // 2. Créer les activités
      for (const act of activites) {
        if (act.titre && act.date) {
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              date: act.date,
              type: 'activite',
              titre: act.titre,
              description: act.description + (act.heure ? ` - ${act.heure}` : ''),
              heure: act.heure,
              statut: 'planifie',
              departement: selectedDepartement,
              ville: selectedVille,
              semestre: selectedSemestre,
              annee: selectedYear
            })
          });
          if (response.ok) totalCreated++;
        }
      }
      
      if (totalCreated > 0) {
        setSubmitted(true);
        toast.success(`${totalCreated} entrée(s) créée(s) avec succès !`);
      } else {
        toast.error('Aucune entrée à créer. Remplissez les temps de prière ou ajoutez des activités.');
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
              Les entrées ont été ajoutées à l'agenda du département <strong>{selectedDepartement}</strong>.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Ajouter d'autres entrées
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="text-5xl mb-4">📅</div>
            <CardTitle className="text-2xl">Agenda du Département</CardTitle>
            <CardDescription>
              Remplissez les temps de prière et activités prévues
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Configuration */}
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

        {/* Section 1: Temps de prière */}
        <Card>
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              🙏 Temps de prière
            </CardTitle>
            <CardDescription>Définissez votre temps de prière récurrent</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label>Jour</Label>
                <Select value={priereForm.jour} onValueChange={(v) => setPriereForm({...priereForm, jour: v})}>
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
                  value={priereForm.heure}
                  onChange={(e) => setPriereForm({...priereForm, heure: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Fréquence</Label>
                <Select value={priereForm.frequence} onValueChange={(v) => setPriereForm({...priereForm, frequence: v})}>
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Du</Label>
                <Input
                  type="date"
                  value={priereForm.dateDebut}
                  onChange={(e) => setPriereForm({...priereForm, dateDebut: e.target.value})}
                />
              </div>
              <div>
                <Label>Au</Label>
                <Input
                  type="date"
                  value={priereForm.dateFin}
                  onChange={(e) => setPriereForm({...priereForm, dateFin: e.target.value})}
                />
              </div>
            </div>
            
            <p className="text-sm text-gray-500 bg-purple-50 p-2 rounded">
              💡 Génère automatiquement tous les {joursSemaine.find(j => j.value === priereForm.jour)?.label.toLowerCase()}s 
              ({frequences.find(f => f.value === priereForm.frequence)?.label.toLowerCase()})
            </p>
          </CardContent>
        </Card>

        {/* Section 2: Activités */}
        <Card>
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center justify-between text-orange-800">
              <span className="flex items-center gap-2">
                📌 Activités
                <span className="text-sm font-normal text-orange-600">({activites.length})</span>
              </span>
              <Button type="button" variant="outline" size="sm" onClick={addActivite}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </CardTitle>
            <CardDescription>Ajoutez vos programmes spéciaux, formations, réunions...</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {activites.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Cliquez sur "Ajouter" pour ajouter une activité
              </p>
            ) : (
              activites.map((act, index) => (
                <div key={index} className="p-4 bg-orange-50/50 rounded-lg border border-orange-200 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-3">
                        <Label>Titre *</Label>
                        <Input
                          value={act.titre}
                          onChange={(e) => updateActivite(index, 'titre', e.target.value)}
                          placeholder="Ex: Retraite annuelle, Formation..."
                        />
                      </div>
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
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={act.description}
                          onChange={(e) => updateActivite(index, 'description', e.target.value)}
                          placeholder="Détails..."
                        />
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeActivite(index)}
                      className="text-red-500 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Bouton Submit */}
        <Button 
          onClick={handleSubmit}
          className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg" 
          disabled={loading}
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
