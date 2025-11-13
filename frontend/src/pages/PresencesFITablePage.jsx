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
    loadMembres();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedDate && membres.length > 0) {
      loadPresencesForDate();
    }
  }, [selectedDate, membres]);

  const loadMembres = async () => {
    try {
      if (!user.assigned_fi_id) {
        toast.error('Aucune FI assignée');
        setLoading(false);
        return;
      }

      const membresData = await getMembresFI(user.assigned_fi_id);
      setMembres(membresData);

    } catch (error) {
      toast.error('Erreur lors du chargement');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPresencesForDate = async () => {
    try {
      const presencesData = await getPresencesFI(user.assigned_fi_id, selectedDate);
      
      // Créer un map des présences
      const presencesMap = {};
      presencesData.forEach(p => {
        presencesMap[p.membre_fi_id] = p;
      });
      
      // Enrichir les membres avec les infos de présence
      const enrichedMembres = membres.map(membre => ({
        ...membre,
        presence: presencesMap[membre.id] || null
      }));
      
      setFilteredMembres(enrichedMembres);
      
      // Calculer les KPIs
      const totalMembres = membres.length;
      const presents = presencesData.filter(p => p.present === true).length;
      const absents = presencesData.filter(p => p.present === false).length;
      
      // Nouveaux membres = membres ajoutés dans les 7 derniers jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const nouveaux = membres.filter(m => {
        const dateAjout = new Date(m.date_ajout);
        return dateAjout >= sevenDaysAgo;
      }).length;
      
      const tauxFidelisation = totalMembres > 0 ? (presents / totalMembres) * 100 : 0;
      
      setKpis({
        totalMembres,
        presents,
        absents,
        nouveaux,
        tauxFidelisation: tauxFidelisation.toFixed(1)
      });
      
    } catch (error) {
      toast.error('Erreur lors du chargement des présences');
      console.error(error);
    }
  };

  const handleEditPresence = (membre) => {
    setEditingMembre(membre);
    
    if (membre.presence) {
      setEditPresence(membre.presence.present);
      setEditComment(membre.presence.commentaire || '');
    } else {
      setEditPresence(null);
      setEditComment('');
    }
    
    setEditDialogOpen(true);
  };

  const handleSavePresenceEdit = async () => {
    if (!editingMembre || !selectedDate) {
      toast.error('Erreur: Aucune date sélectionnée');
      return;
    }

    if (editPresence === null) {
      toast.error('Veuillez sélectionner Présent ou Absent');
      return;
    }

    try {
      await createPresenceFI({
        membre_fi_id: editingMembre.id,
        date: selectedDate,
        present: editPresence,
        commentaire: editComment || null
      });
      
      toast.success('Présence mise à jour avec succès');
      setEditDialogOpen(false);
      loadPresencesForDate();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
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
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Vue Tableau - Famille d'Impact</h2>
            <p className="text-gray-500 mt-1">Présences et statistiques des membres</p>
          </div>
          <Button onClick={() => navigate('/dashboard-pilote-fi')} variant="outline">
            Retour au Dashboard
          </Button>
        </div>

        {/* Filtre de date */}
        <Card>
          <CardHeader>
            <CardTitle>Sélectionner une date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs">
              <Label>Date de réunion</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {selectedDate && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Membres</p>
                      <p className="text-2xl font-bold text-blue-600">{kpis.totalMembres}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Présents</p>
                      <p className="text-2xl font-bold text-green-600">{kpis.presents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <UserX className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">Absents</p>
                      <p className="text-2xl font-bold text-red-600">{kpis.absents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Nouveaux</p>
                      <p className="text-2xl font-bold text-purple-600">{kpis.nouveaux}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-8 w-8 text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-600">Fidélisation</p>
                      <p className="text-2xl font-bold text-indigo-600">{kpis.tauxFidelisation}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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
