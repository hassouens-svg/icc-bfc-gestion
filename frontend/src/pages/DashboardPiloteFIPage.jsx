import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStatsPiloteFI, getMembresFI, createMembreFI, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Users, TrendingUp, Calendar, Percent, UserPlus, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import FIPhotosManager from '../components/FIPhotosManager';

const DashboardPiloteFIPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [stats, setStats] = useState(null);
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isEditFIDialogOpen, setIsEditFIDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({ prenom: '', nom: '', telephone: '', is_nouveau: true });
  const [fiInfo, setFiInfo] = useState({ nom: '', adresse: '', heure_debut: '', heure_fin: '' });

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
      const fiId = user.assigned_fi_id || (user.assigned_fi_ids && user.assigned_fi_ids[0]);
      await createMembreFI({
        ...newMember,
        fi_id: fiId
      });
      toast.success('Membre ajouté avec succès!');
      setIsAddMemberDialogOpen(false);
      setNewMember({ prenom: '', nom: '', telephone: '', is_nouveau: true });
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
            <Button onClick={() => {
              if (stats?.fi_id) {
                navigate(`/famille-impact/${stats.fi_id}`);
              } else {
                toast.error('Aucune FI assignée');
              }
            }} className="bg-blue-600 hover:bg-blue-700">
              <Settings className="h-4 w-4 mr-2" />
              Modifier FI
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

        {/* Gestion des photos de la FI */}
        {stats?.fi && (
          <FIPhotosManager 
            fiId={stats.fi.id} 
            initialPhotos={stats.fi.photos || []} 
          />
        )}

        {/* NOUVEAU: Tableau de présences sous les KPIs */}
        <Card>
          <CardHeader>
            <CardTitle>Tableau des Présences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4">Membre</th>
                    <th className="text-center py-3 px-4">Téléphone</th>
                    <th className="text-center py-3 px-4">Statut</th>
                    <th className="text-center py-3 px-4">Total Présences</th>
                  </tr>
                </thead>
                <tbody>
                  {membres.map((membre) => (
                    <tr key={membre.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{membre.prenom} {membre.nom}</td>
                      <td className="text-center py-3 px-4">{membre.telephone}</td>
                      <td className="text-center py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${membre.is_nouveau ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          {membre.is_nouveau ? 'Nouveau' : 'Ancien'}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">{membre.total_presences || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Liste des Membres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Liste des Membres de la FI ({membres.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {membres.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun membre dans cette FI</p>
                <p className="text-sm mt-1">Ajoutez des membres pour commencer</p>
              </div>
            ) : (
              <div className="space-y-2">
                {membres.map((membre) => (
                  <div key={membre.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="bg-indigo-100 rounded-full p-2">
                        <Users className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{membre.prenom} {membre.nom}</p>
                        {membre.telephone && (
                          <p className="text-sm text-gray-500">{membre.telephone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {membre.is_nouveau && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                          Nouveau
                        </span>
                      )}
                      {membre.source === 'nouveau_arrivant' && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                          Nouveau Arrivant
                        </span>
                      )}
                    </div>
                  </div>
                ))}
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

        {/* Modal Modifier FI */}
        <Dialog open={isEditFIDialogOpen} onOpenChange={setIsEditFIDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier les informations de la FI</DialogTitle>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                // TODO: Appeler l'API pour mettre à jour la FI
                // await updateFamilleImpact(user.assigned_fi_id, fiInfo);
                toast.success('Informations mises à jour avec succès!');
                setIsEditFIDialogOpen(false);
                loadData();
              } catch (error) {
                toast.error('Erreur lors de la mise à jour');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom de la FI</label>
                  <input
                    type="text"
                    value={fiInfo.nom}
                    onChange={(e) => setFiInfo({ ...fiInfo, nom: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Nom de la Famille d'Impact"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Adresse</label>
                  <input
                    type="text"
                    value={fiInfo.adresse}
                    onChange={(e) => setFiInfo({ ...fiInfo, adresse: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Adresse complète"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Heure de début</label>
                    <input
                      type="time"
                      value={fiInfo.heure_debut}
                      onChange={(e) => setFiInfo({ ...fiInfo, heure_debut: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Heure de fin</label>
                    <input
                      type="time"
                      value={fiInfo.heure_fin}
                      onChange={(e) => setFiInfo({ ...fiInfo, heure_fin: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditFIDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    Enregistrer
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default DashboardPiloteFIPage;