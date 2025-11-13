import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStatsPiloteFI, getMembresFI, createMembreFI, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Users, TrendingUp, Calendar, Percent, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const DashboardPiloteFIPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [stats, setStats] = useState(null);
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({ prenom: '', nom: '', telephone: '', is_nouveau: true });

  useEffect(() => {
    if (!user || user.role !== 'pilote_fi') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [statsData, membresData] = await Promise.all([
        getStatsPiloteFI(),
        getMembresFI()
      ]);
      setStats(statsData);
      setMembres(membresData);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!newMember.prenom || !newMember.nom || !newMember.telephone) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      await createMembreFI({
        ...newMember,
        fi_id: user.assigned_fi_id
      });
      toast.success('Membre ajouté avec succès!');
      setIsAddMemberDialogOpen(false);
      setNewMember({ prenom: '', nom: '', telephone: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'ajout');
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

  const evolutionData = stats?.evolution_membres ? 
    Object.entries(stats.evolution_membres).map(([month, count]) => ({
      mois: month,
      membres: count
    })) : [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Tableau de Bord - Pilote FI</h2>
            <p className="text-gray-500 mt-1">{stats?.fi?.nom}</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => navigate('/marquer-presences-fi')} variant="outline" className="bg-blue-50">
              <Calendar className="h-4 w-4 mr-2" />
              Marquer Présences
            </Button>
            <Button onClick={() => navigate('/vue-tableau-fi')} variant="outline" className="bg-purple-50">
              <TrendingUp className="h-4 w-4 mr-2" />
              Vue Tableau
            </Button>
            <Button onClick={() => setIsAddMemberDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un Membre
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membres Totaux</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_membres || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fidélisation</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.fidelisation_globale || 0}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jeudis</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.jeudis_count || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Présences Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_presences || 0}</div>
            </CardContent>
          </Card>
        </div>

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

        {/* Modal Ajouter Membre */}
        <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un Membre à votre FI</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input
                  value={newMember.prenom}
                  onChange={(e) => setNewMember({...newMember, prenom: e.target.value})}
                  placeholder="Prénom"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={newMember.nom}
                  onChange={(e) => setNewMember({...newMember, nom: e.target.value})}
                  placeholder="Nom"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Téléphone *</Label>
                <Input
                  value={newMember.telephone}
                  onChange={(e) => setNewMember({...newMember, telephone: e.target.value})}
                  placeholder="+33..."
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Type de membre *</Label>
                <RadioGroup
                  value={newMember.is_nouveau ? "nouveau" : "ancien"}
                  onValueChange={(value) => setNewMember({...newMember, is_nouveau: value === "nouveau"})}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nouveau" id="nouveau" />
                    <Label htmlFor="nouveau" className="cursor-pointer font-normal">
                      Nouveau membre (ajouté récemment)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ancien" id="ancien" />
                    <Label htmlFor="ancien" className="cursor-pointer font-normal">
                      Ancien membre
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  Ajouter
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddMemberDialogOpen(false);
                    setNewMember({ prenom: '', nom: '', telephone: '', is_nouveau: true });
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default DashboardPiloteFIPage;