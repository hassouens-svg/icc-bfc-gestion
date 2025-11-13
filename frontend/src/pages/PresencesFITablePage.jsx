import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getMembresFI, getPresencesFI, getUser, createPresenceFI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Users, UserCheck, UserX, UserPlus, TrendingUp, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const PresencesFITablePage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [membres, setMembres] = useState([]);
  const [filteredMembres, setFilteredMembres] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  
  // KPIs
  const [kpis, setKpis] = useState({
    totalMembres: 0,
    presents: 0,
    absents: 0,
    nouveaux: 0,
    tauxFidelisation: 0
  });
  
  // Edit modal
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMembre, setEditingMembre] = useState(null);
  const [editPresence, setEditPresence] = useState(null); // true, false, or null
  const [editComment, setEditComment] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'pilote_fi') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user, navigate]);

  useEffect(() => {
    filterData();
  }, [searchTerm, selectedMonth, membres, presences]);

  const loadData = async () => {
    try {
      if (!user.assigned_fi_id) {
        toast.error('Aucune FI assignée');
        setLoading(false);
        return;
      }

      const [membresData, presencesData] = await Promise.all([
        getMembresFI(user.assigned_fi_id),
        getPresencesFI(user.assigned_fi_id)
      ]);

      setMembres(membresData);
      setPresences(presencesData);

      // Calculer fidélisation
      const uniqueJeudis = [...new Set(presencesData.map(p => p.date))];
      const totalPresences = presencesData.filter(p => p.present).length;
      const maxPossible = membresData.length * uniqueJeudis.length;
      const taux = maxPossible > 0 ? (totalPresences / maxPossible) * 100 : 0;
      setFidelisation(taux);

    } catch (error) {
      toast.error('Erreur lors du chargement');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = membres.map(membre => {
      // Calculer les stats de présence pour ce membre
      const membrePresences = presences.filter(p => p.membre_fi_id === membre.id);
      
      let filteredPresences = membrePresences;
      if (selectedMonth !== 'all') {
        filteredPresences = membrePresences.filter(p => p.date.startsWith(selectedMonth));
      }

      const totalJeudis = [...new Set(filteredPresences.map(p => p.date))].length;
      const presencesMarquees = filteredPresences.filter(p => p.present).length;
      const tauxPresence = totalJeudis > 0 ? (presencesMarquees / totalJeudis) * 100 : 0;

      return {
        ...membre,
        totalJeudis,
        presencesMarquees,
        absences: totalJeudis - presencesMarquees,
        tauxPresence
      };
    });

    // Filtrer par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.prenom.toLowerCase().includes(term) ||
        m.nom.toLowerCase().includes(term) ||
        m.telephone?.includes(term)
      );
    }

    setFilteredData(filtered);
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    const headers = ['Prénom', 'Nom', 'Téléphone', 'Jeudis Total', 'Présences', 'Absences', 'Taux %'];
    const rows = filteredData.map(m => [
      m.prenom,
      m.nom,
      m.telephone || '',
      m.totalJeudis,
      m.presencesMarquees,
      m.absences,
      m.tauxPresence.toFixed(1)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presences_fi_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export CSV réussi');
  };

  const getMonthOptions = () => {
    const months = [];
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    for (let year = 2025; year <= 2030; year++) {
      for (let month = 1; month <= 12; month++) {
        const value = `${year}-${String(month).padStart(2, '0')}`;
        const label = `${monthNames[month - 1]} ${year}`;
        months.push({ value, label });
      }
    }
    return months;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Présences des Membres</h2>
            <p className="text-gray-500 mt-1">Vue tableau des présences aux jeudis</p>
          </div>
          <Button onClick={() => navigate('/familles-impact/dashboard-pilote')} variant="outline">
            Retour au Dashboard
          </Button>
        </div>

        {/* KPI Fidélisation */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Taux de Fidélisation Global</p>
                  <p className="text-4xl font-bold text-indigo-600">{fidelisation.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-1">{membres.length} membres · Période actuelle</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rechercher</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nom, prénom, téléphone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mois</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les mois</SelectItem>
                    {getMonthOptions().map(month => (
                      <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={exportToCSV} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tableau */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Membres ({filteredData.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Aucun membre trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Membre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Jeudis Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Présences</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absences</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Taux %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((membre) => (
                      <tr key={membre.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {membre.prenom} {membre.nom}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{membre.telephone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">{membre.totalJeudis}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            {membre.presencesMarquees}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            {membre.absences}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            membre.tauxPresence >= 75 ? 'bg-green-100 text-green-800' :
                            membre.tauxPresence >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {membre.tauxPresence.toFixed(1)}%
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
      </div>
    </Layout>
  );
};

export default PresencesFITablePage;
