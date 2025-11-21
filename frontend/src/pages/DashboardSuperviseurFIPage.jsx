import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStatsSuperviseurFI, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, TrendingUp, MapPin, Percent, UserCheck, UserX, UserPlus, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getSecteurs, getFamillesImpact, getMembresFI, getPresencesFI } from '../utils/api';
import { toast } from 'sonner';

const DashboardSuperviseurFIPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filtres pour KPIs FI
  const [selectedDate, setSelectedDate] = useState('');
  const [secteurs, setSecteurs] = useState([]);
  const [selectedSecteur, setSelectedSecteur] = useState('all');
  const [famillesImpact, setFamillesImpact] = useState([]);
  const [selectedFI, setSelectedFI] = useState('all');
  const [kpisFI, setKpisFI] = useState({
    totalMembres: 0,
    presents: 0,
    absents: 0,
    nouveaux: 0,
    tauxFidelisation: 0
  });
  const [presencesTableData, setPresencesTableData] = useState([]);

  useEffect(() => {
    if (!user || !['superviseur_fi', 'admin', 'super_admin', 'pasteur', 'responsable_eglise'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    loadStats();
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      // Pour super_admin et pasteur, utiliser la ville sélectionnée
      const selectedCity = localStorage.getItem('selected_city_view');
      const ville = ['super_admin', 'pasteur', 'responsable_eglise'].includes(user.role) && selectedCity ? selectedCity : user.city;
      
      const data = await getStatsSuperviseurFI(ville);
      setStats(data);
      
      // Charger les secteurs et FIs
      const secteursData = await getSecteurs(ville);
      setSecteurs(secteursData);
      
      const fisData = await getFamillesImpact(null, ville);
      setFamillesImpact(fisData);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const loadKPIsByDate = async () => {
    if (!selectedDate) return;

    try {
      const selectedCity = localStorage.getItem('selected_city_view');
      const ville = ['super_admin', 'pasteur', 'responsable_eglise'].includes(user.role) && selectedCity ? selectedCity : user.city;

      // Filtrer les FIs selon les sélections
      let fisToAnalyze = famillesImpact;
      
      if (selectedSecteur !== 'all') {
        fisToAnalyze = fisToAnalyze.filter(fi => fi.secteur_id === selectedSecteur);
      }
      
      if (selectedFI !== 'all') {
        fisToAnalyze = fisToAnalyze.filter(fi => fi.id === selectedFI);
      }

      let allMembres = [];
      let allPresences = [];

      for (const fi of fisToAnalyze) {
        try {
          const membres = await getMembresFI(fi.id);
          const presences = await getPresencesFI(fi.id, selectedDate);
          
          allMembres = [...allMembres, ...membres];
          allPresences = [...allPresences, ...presences];
        } catch (error) {
          console.error(`Erreur chargement FI ${fi.name}:`, error);
        }
      }

      const totalMembres = allMembres.length;
      const presents = allPresences.filter(p => p.present === true).length;
      const absents = allPresences.filter(p => p.present === false).length;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const nouveaux = allMembres.filter(m => {
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
        const fiMembres = allMembres.filter(m => {
          // Vérifier si le membre appartient à cette FI
          return m.fi_id === fi.id;
        });
        const fiPresences = allPresences.filter(p => {
          const membre = fiMembres.find(m => m.id === p.membre_id);
          return membre !== undefined;
        });
        
        const fiPresents = fiPresences.filter(p => p.present === true).length;
        const fiAbsents = fiPresences.filter(p => p.present === false).length;
        const fiTotalMembres = fiMembres.length;
        const fiTaux = fiTotalMembres > 0 ? ((fiPresents / fiTotalMembres) * 100).toFixed(1) : '0.0';

        // Trouver le secteur de cette FI
        const secteur = secteurs.find(s => s.id === fi.secteur_id);

        return {
          fi_id: fi.id,
          fi_name: fi.name || fi.nom || `FI ${fi.id.substring(0, 8)}`,
          secteur_name: secteur ? secteur.name : '-',
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

  useEffect(() => {
    if (selectedDate && famillesImpact.length > 0) {
      loadKPIsByDate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedSecteur, selectedFI]); // FIXED: Removed famillesImpact to prevent infinite loop

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  const evolutionData = stats?.evolution_membres ? 
    Object.entries(stats.evolution_membres).map(([month, count]) => ({
      mois: month,
      membres: count
    })) : [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tableau de Bord - Superviseur FI</h2>
          <p className="text-gray-500 mt-1">
            {['super_admin', 'pasteur'].includes(user.role) && localStorage.getItem('selected_city_view') 
              ? localStorage.getItem('selected_city_view') 
              : user.city}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Secteurs</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.nombre_secteurs || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Familles d'Impact</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.nombre_fi_total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membres Totaux</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.nombre_membres_total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fidélisation Globale</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.fidelisation_globale || 0}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Section KPIs FI par date */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Analyse des Présences FI par Date</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Secteur</Label>
                <Select value={selectedSecteur} onValueChange={setSelectedSecteur}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les secteurs</SelectItem>
                    {secteurs.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Famille d'Impact</Label>
                <Select value={selectedFI} onValueChange={setSelectedFI}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les FI</SelectItem>
                    {famillesImpact
                      .filter(fi => selectedSecteur === 'all' || fi.secteur_id === selectedSecteur)
                      .map((fi) => (
                        <SelectItem key={fi.id} value={fi.id}>{fi.name}</SelectItem>
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
                        <p className="text-xs text-gray-600">Total</p>
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
                        <p className="text-xs text-gray-600">Nouveaux</p>
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
            
            {/* NOUVEAU: Tableau de présences sous les KPIs */}
            {selectedDate && presencesTableData.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Tableau des Présences du {new Date(selectedDate).toLocaleDateString('fr-FR')}</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4">Famille d'Impact</th>
                        <th className="text-center py-3 px-4">Secteur</th>
                        <th className="text-center py-3 px-4">Total Membres</th>
                        <th className="text-center py-3 px-4">Présents</th>
                        <th className="text-center py-3 px-4">Absents</th>
                        <th className="text-center py-3 px-4">Taux (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {presencesTableData.map((row) => (
                        <tr key={row.fi_id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{row.fi_name}</td>
                          <td className="text-center py-3 px-4">{row.secteur_name}</td>
                          <td className="text-center py-3 px-4">{row.totalMembres}</td>
                          <td className="text-center py-3 px-4 text-green-600 font-semibold">{row.presents}</td>
                          <td className="text-center py-3 px-4 text-red-600 font-semibold">{row.absents}</td>
                          <td className="text-center py-3 px-4 text-indigo-600 font-semibold">{row.taux}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution du nombre de membres</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="membres" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Secteurs Details */}
        <Card>
          <CardHeader>
            <CardTitle>Détails par Secteur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.secteurs_details?.map((secteur, index) => (
                <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{secteur.secteur.nom}</p>
                    <p className="text-sm text-gray-500">{secteur.secteur.ville}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{secteur.nombre_fi}</p>
                    <p className="text-sm text-gray-500">Familles d'Impact</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section Gestion d'Accès */}
        <Card>
          <CardHeader>
            <CardTitle>Gestion d'Accès</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              En tant que Superviseur FI, vous pouvez créer des comptes Responsable de Secteur et Pilote.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/gestion-acces')}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Créer un Responsable de Secteur
              </Button>
              <Button 
                onClick={() => navigate('/gestion-acces')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Créer un Pilote
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DashboardSuperviseurFIPage;