import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getSecteurs, getFamillesImpact, getMembresFI, getPresencesFI, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { MapPin, Heart, Users, TrendingUp, Percent, UserCheck, UserX, UserPlus, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const DashboardResponsableSecteurPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [secteur, setSecteur] = useState(null);
  const [famillesImpact, setFamillesImpact] = useState([]);
  const [allMembres, setAllMembres] = useState([]);
  const [fidelisation, setFidelisation] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Nouveaux states pour les KPIs FI
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedFI, setSelectedFI] = useState('all'); // 'all' ou un fi_id spécifique
  const [kpisFI, setKpisFI] = useState({
    totalMembres: 0,
    presents: 0,
    absents: 0,
    nouveaux: 0,
    tauxFidelisation: 0
  });
  const [presencesTableData, setPresencesTableData] = useState([]);
  const [filterMembresFI, setFilterMembresFI] = useState('all');

  useEffect(() => {
    if (!user || user.role !== 'responsable_secteur') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      // Charger le secteur assigné
      if (!user.assigned_secteur_id) {
        toast.error('Aucun secteur assigné. Contactez le superviseur.');
        setLoading(false);
        return;
      }

      // Charger tous les secteurs pour trouver le sien
      const secteursData = await getSecteurs(user.city);
      const mySecteur = secteursData.find(s => s.id === user.assigned_secteur_id);
      
      if (!mySecteur) {
        toast.error('Secteur non trouvé');
        setLoading(false);
        return;
      }
      
      setSecteur(mySecteur);

      // Charger les FI de ce secteur
      const fisData = await getFamillesImpact(user.city);
      const secteurFIs = fisData.filter(fi => fi.secteur_id === user.assigned_secteur_id);
      setFamillesImpact(secteurFIs);

      // Charger les membres de toutes les FI du secteur avec leurs présences pour calculer fidélisation
      let membres = [];
      for (const fi of secteurFIs) {
        try {
          const fiMembres = await getMembresFI(fi.id);
          membres = [...membres, ...fiMembres.map(m => ({ ...m, fi_name: fi.name, fi_id: fi.id }))];
        } catch (error) {
          console.error(`Erreur chargement membres FI ${fi.name}:`, error);
        }
      }
      setAllMembres(membres);

      // Calculer la fidélisation du secteur
      if (membres.length > 0) {
        try {
          let totalPresences = 0;
          let totalJeudis = 0;
          
          for (const fi of secteurFIs) {
            try {
              const presences = await getPresencesFI(fi.id);
              const uniqueJeudis = [...new Set(presences.map(p => p.date))];
              totalJeudis = Math.max(totalJeudis, uniqueJeudis.length);
              totalPresences += presences.filter(p => p.present).length;
            } catch (error) {
              console.error(`Erreur chargement présences FI ${fi.name}:`, error);
            }
          }
          
          const maxPossible = membres.length * totalJeudis;
          const tauxFidelisation = maxPossible > 0 ? (totalPresences / maxPossible) * 100 : 0;
          setFidelisation(tauxFidelisation);
        } catch (error) {
          console.error('Erreur calcul fidélisation:', error);
        }
      }

    } catch (error) {
      toast.error('Erreur lors du chargement');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadKPIsByDate = async () => {
    if (!selectedDate || famillesImpact.length === 0) return;

    try {
      // Filtrer les FIs selon la sélection
      const fisToAnalyze = selectedFI === 'all' 
        ? famillesImpact 
        : famillesImpact.filter(fi => fi.id === selectedFI);

      let allMembresForDate = [];
      let allPresencesForDate = [];

      for (const fi of fisToAnalyze) {
        try {
          const membres = await getMembresFI(fi.id);
          const presences = await getPresencesFI(fi.id, selectedDate);
          
          // Marquer chaque membre avec son FI
          const membresWithFI = membres.map(m => ({ ...m, fi_id: fi.id, fi_name: fi.name || fi.nom }));
          allMembresForDate = [...allMembresForDate, ...membresWithFI];
          
          // Utiliser UNIQUEMENT les présences réelles marquées par le pilote
          allPresencesForDate = [...allPresencesForDate, ...presences.map(p => ({ ...p, fi_id: fi.id }))];
        } catch (error) {
          console.error(`Erreur chargement KPIs FI ${fi.name}:`, error);
        }
      }

      const totalMembres = allMembresForDate.length;
      const presents = allPresencesForDate.filter(p => p.present === true).length;
      const absents = allPresencesForDate.filter(p => p.present === false).length;

      // Nouveaux membres (7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const nouveaux = allMembresForDate.filter(m => {
        const dateAjout = new Date(m.date_ajout);
        return dateAjout >= sevenDaysAgo;
      }).length;

      const tauxFidelisation = totalMembres > 0 ? (presents / totalMembres) * 100 : 0;

      setKpisFI({
        totalMembres,
        presents,
        absents,
        nouveaux,
        tauxFidelisation: tauxFidelisation.toFixed(1)
      });

      // Construire les données du tableau de présence par FI
      const tableData = fisToAnalyze.map(fi => {
        const fiMembres = allMembresForDate.filter(m => m.fi_id === fi.id);
        const fiPresences = allPresencesForDate.filter(p => {
          const membre = fiMembres.find(m => m.id === p.membre_id);
          return membre !== undefined;
        });
        
        const fiPresents = fiPresences.filter(p => p.present === true).length;
        const fiAbsents = fiPresences.filter(p => p.present === false).length;
        const fiTotalMembres = fiMembres.length;
        const fiTaux = fiTotalMembres > 0 ? ((fiPresents / fiTotalMembres) * 100).toFixed(1) : '0.0';

        return {
          fi_id: fi.id,
          fi_name: fi.name || fi.nom || `FI ${fi.id.substring(0, 8)}`,
          totalMembres: fiTotalMembres,
          presents: fiPresents,
          absents: fiAbsents,
          taux: fiTaux
        };
      });
      
      setPresencesTableData(tableData);

    } catch (error) {
      console.error('Erreur calcul KPIs:', error);
    }
  };

  // Charger les KPIs quand la date ou la FI change
  useEffect(() => {
    if (selectedDate && famillesImpact.length > 0) {
      loadKPIsByDate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedFI]); // FIXED: Removed famillesImpact to prevent infinite loop

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!secteur) {
    return (
      <Layout>
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <MapPin className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun secteur assigné</h3>
                <p className="text-gray-500">
                  Veuillez contacter le Superviseur Familles d'Impact pour vous assigner un secteur.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tableau de Bord - Responsable de Secteur</h2>
          <p className="text-gray-500 mt-1">Secteur : {secteur.name} - {user.city}</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Familles d'Impact</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{famillesImpact.length}</div>
              <p className="text-xs text-muted-foreground">Dans votre secteur</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membres Totaux</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allMembres.length}</div>
              <p className="text-xs text-muted-foreground">Tous secteurs confondus</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moyenne Membres/FI</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {famillesImpact.length > 0 ? Math.round(allMembres.length / famillesImpact.length) : 0}
              </div>
              <p className="text-xs text-muted-foreground">Membres par FI</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Fidélisation</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{fidelisation.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Présences aux jeudis</p>
            </CardContent>
          </Card>
        </div>

        {/* Section KPIs FI par date */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Analyse des Présences FI</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Sélectionner une date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sélectionner une FI</Label>
                <Select value={selectedFI} onValueChange={setSelectedFI}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les FI du secteur</SelectItem>
                    {famillesImpact.map((fi) => (
                      <SelectItem key={fi.id} value={fi.id}>
                        {fi.name || fi.nom || `FI ${fi.id.substring(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedDate && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Users className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-600">Total Membres</p>
                        <p className="text-xl font-bold text-blue-600">{kpisFI.totalMembres}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-600">Présents</p>
                        <p className="text-xl font-bold text-green-600">{kpisFI.presents}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <UserX className="h-6 w-6 text-red-600" />
                      <div>
                        <p className="text-xs text-gray-600">Absents</p>
                        <p className="text-xl font-bold text-red-600">{kpisFI.absents}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <UserPlus className="h-6 w-6 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-600">Nouveaux (7j)</p>
                        <p className="text-xl font-bold text-purple-600">{kpisFI.nouveaux}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-6 w-6 text-indigo-600" />
                      <div>
                        <p className="text-xs text-gray-600">Fidélisation</p>
                        <p className="text-xl font-bold text-indigo-600">{kpisFI.tauxFidelisation}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tableau des présences par FI */}
            {selectedDate && presencesTableData.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Tableau des Présences du {new Date(selectedDate).toLocaleDateString('fr-FR')}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Famille d'Impact
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Membres
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Présents
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Absents
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Taux (%)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {presencesTableData.map((row) => (
                        <tr key={row.fi_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {row.fi_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                            {row.totalMembres}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600 font-semibold">
                            {row.presents}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600 font-semibold">
                            {row.absents}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-indigo-600 font-semibold">
                            {row.taux}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste des Familles d'Impact */}
        <Card>
          <CardHeader>
            <CardTitle>Familles d'Impact de votre secteur</CardTitle>
          </CardHeader>
          <CardContent>
            {famillesImpact.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Aucune Famille d'Impact dans ce secteur</p>
              </div>
            ) : (
              <div className="space-y-3">
                {famillesImpact.map((fi) => {
                  const fiMembres = allMembres.filter(m => 
                    famillesImpact.find(f => f.id === fi.id && m.fi_name === f.name)
                  );
                  const fiMembreCount = allMembres.filter(m => m.fi_name === fi.name).length;
                  
                  return (
                    <div
                      key={fi.id}
                      className="flex justify-between items-center p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
                          <Heart className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{fi.name || fi.nom || `FI ${fi.id.substring(0, 8)}`}</h3>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Pilote :</span> {fi.pilote_name || 'Aucun pilote assigné'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600">{fiMembreCount}</p>
                        <p className="text-xs text-gray-500">membres</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste des Membres */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Membres de votre secteur</CardTitle>
              <div className="w-64">
                <Label>Filtrer par FI</Label>
                <Select value={filterMembresFI} onValueChange={setFilterMembresFI}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les FI</SelectItem>
                    {famillesImpact.map((fi) => (
                      <SelectItem key={fi.id} value={fi.id}>{fi.name || fi.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {allMembres.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Aucun membre dans ce secteur</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Famille d'Impact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro FI</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allMembres
                      .filter(m => filterMembresFI === 'all' || m.fi_id === filterMembresFI)
                      .map((membre, index) => (
                        <tr key={membre.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {membre.prenom} {membre.nom}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{membre.telephone}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{membre.fi_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">#{index + 1}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              Actif
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message d'information */}
        {/* Section Gestion d'Accès */}
        <Card>
          <CardHeader>
            <CardTitle>Gestion d'Accès - Pilotes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              En tant que Responsable de Secteur, vous pouvez créer des comptes Pilote pour gérer vos Familles d'Impact.
            </p>
            <Button 
              onClick={() => {
                toast.info('Fonctionnalité de création de pilote disponible via le menu Gestion d\'Accès');
                navigate('/gestion-acces');
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Créer un accès Pilote
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Votre Rôle</h3>
                <p className="text-sm text-blue-700">
                  En tant que Responsable de Secteur, vous avez accès aux informations de toutes les Familles d'Impact
                  de votre secteur "{secteur.name}". Vous pouvez consulter les statistiques et suivre l'évolution des membres.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DashboardResponsableSecteurPage;
