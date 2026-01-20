import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Calendar, Save, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const AgendaPublicFormPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const departement = searchParams.get('departement') || '';
  const ville = searchParams.get('ville') || '';
  
  const [entries, setEntries] = useState([{
    date: '',
    type: 'priere_hebdo',
    titre: '',
    description: '',
    heure: '',
    isRecurring: false,
    recurringDay: 'mardi',
    recurringEndDate: ''
  }]);
  const [selectedSemestre, setSelectedSemestre] = useState('1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cities, setCities] = useState([]);
  const [selectedVille, setSelectedVille] = useState(ville);
  const [selectedDepartement, setSelectedDepartement] = useState(departement);

  const joursSemaine = [
    { value: 'lundi', label: 'Lundi' },
    { value: 'mardi', label: 'Mardi' },
    { value: 'mercredi', label: 'Mercredi' },
    { value: 'jeudi', label: 'Jeudi' },
    { value: 'vendredi', label: 'Vendredi' },
    { value: 'samedi', label: 'Samedi' },
    { value: 'dimanche', label: 'Dimanche' }
  ];

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

  const typeOptions = [
    { value: 'priere_hebdo', label: 'Temps de prière hebdomadaire' },
    { value: 'programme_special', label: 'Programme spécial' },
    { value: 'reunion', label: 'Réunion' },
    { value: 'formation', label: 'Formation' },
    { value: 'autre', label: 'Autre' }
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

  const addEntry = () => {
    setEntries([...entries, { 
      date: '', type: 'priere_hebdo', titre: '', description: '', 
      heure: '', isRecurring: false, recurringDay: 'mardi', recurringEndDate: '' 
    }]);
  };

  const removeEntry = (index) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedVille || !selectedDepartement) {
      toast.error('Veuillez sélectionner la ville et le département');
      return;
    }

    const validEntries = entries.filter(e => e.date && e.titre);
    if (validEntries.length === 0) {
      toast.error('Veuillez ajouter au moins une entrée avec date et titre');
      return;
    }

    setLoading(true);
    try {
      // Envoyer chaque entrée
      for (const entry of validEntries) {
        await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/stars/agenda-public`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...entry,
              departement: selectedDepartement,
              ville: selectedVille,
              semestre: selectedSemestre,
              annee: selectedYear,
              statut: 'planifie'
            })
          }
        );
      }
      
      setSubmitted(true);
      toast.success('Agenda enregistré avec succès !');
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
              Vos entrées ont été ajoutées à l'agenda du département {selectedDepartement}.
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
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="text-5xl mb-4">📅</div>
            <CardTitle className="text-2xl">Agenda du Département</CardTitle>
            <CardDescription>
              Remplissez les activités prévues pour votre département
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Entrées */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Activités planifiées</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addEntry}>
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter une ligne
                  </Button>
                </div>
                
                {entries.map((entry, index) => (
                  <Card key={index} className="p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Date *</Label>
                        <Input
                          type="date"
                          value={entry.date}
                          onChange={(e) => updateEntry(index, 'date', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label>Type</Label>
                        <Select 
                          value={entry.type} 
                          onValueChange={(v) => updateEntry(index, 'type', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {typeOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label>Titre *</Label>
                        <Input
                          value={entry.titre}
                          onChange={(e) => updateEntry(index, 'titre', e.target.value)}
                          placeholder="Ex: Prière du mercredi"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label>Description (optionnel)</Label>
                        <Textarea
                          value={entry.description}
                          onChange={(e) => updateEntry(index, 'description', e.target.value)}
                          placeholder="Détails supplémentaires..."
                          rows={2}
                        />
                      </div>
                    </div>
                    
                    {entries.length > 1 && (
                      <div className="mt-2 text-right">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeEntry(index)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700" 
                disabled={loading}
              >
                {loading ? 'Enregistrement...' : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer l'agenda
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgendaPublicFormPage;
