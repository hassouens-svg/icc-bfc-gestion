import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getVisitors, getFamillesImpact, affecterVisiteurToFI, getIndicateursAffectation, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { UserCheck, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AffectationFIPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [visitors, setVisitors] = useState([]);
  const [famillesImpact, setFamillesImpact] = useState([]);
  const [indicateurs, setIndicateurs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFI, setSelectedFI] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [visitorsData, fisData, indicData] = await Promise.all([
        getVisitors(false),
        getFamillesImpact(null, user.city),
        getIndicateursAffectation(user.city)
      ]);
      setVisitors(visitorsData);
      setFamillesImpact(fisData);
      setIndicateurs(indicData);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAffecter = async (visitorId) => {
    const fiId = selectedFI[visitorId];
    if (!fiId) {
      toast.error('Veuillez sélectionner une Famille d\'Impact');
      return;
    }

    try {
      await affecterVisiteurToFI({
        nouveau_arrivant_id: visitorId,
        fi_id: fiId
      });
      toast.success('Affectation réussie!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'affectation');
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
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Affectation aux Familles d'Impact</h2>
          <p className="text-gray-500 mt-1">Affectez les nouveaux arrivants aux cellules de prière</p>
        </div>

        {/* Indicateurs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{indicateurs?.total_nouveaux_arrivants || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Affectés</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{indicateurs?.affectes || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Non Affectés</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{indicateurs?.non_affectes || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{indicateurs?.pourcentage_affectation || 0}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des visiteurs */}
        <Card>
          <CardHeader>
            <CardTitle>Nouveaux Arrivants ({visitors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visitors.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun visiteur</p>
              ) : (
                visitors.map((visitor) => (
                  <div key={visitor.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{visitor.firstname} {visitor.lastname}</p>
                      <p className="text-sm text-gray-500">{visitor.phone} - {visitor.city}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select 
                        value={selectedFI[visitor.id] || ''} 
                        onValueChange={(value) => setSelectedFI({...selectedFI, [visitor.id]: value})}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Sélectionnez une FI" />
                        </SelectTrigger>
                        <SelectContent>
                          {famillesImpact.map((fi) => (
                            <SelectItem key={fi.id} value={fi.id}>
                              {fi.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={() => handleAffecter(visitor.id)}>
                        Affecter
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AffectationFIPage;