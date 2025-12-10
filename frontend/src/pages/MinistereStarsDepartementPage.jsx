import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LayoutMinistereStars from '../components/LayoutMinistereStars';
import { getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Users, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const MinistereStarsDepartementPage = () => {
  const navigate = useNavigate();
  const { departement } = useParams();
  const user = getUser();
  const [stars, setStars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !['super_admin', 'pasteur', 'responsable_eglise', 'ministere_stars'].includes(user.role)) {
      navigate('/');
      return;
    }
    loadStars();
  }, [departement]);

  const loadStars = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/departement/${encodeURIComponent(departement)}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      const data = await response.json();
      setStars(data);
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleStatutChange = async (starId, newStatut) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/stars/${starId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ statut: newStatut })
        }
      );

      if (!response.ok) throw new Error('Erreur');

      toast.success('Statut mis à jour');
      loadStars();
    } catch (error) {
      toast.error('Erreur de mise à jour');
    }
  };

  const actifs = stars.filter(s => s.statut === 'actif').length;
  const nonActifs = stars.filter(s => s.statut === 'non_actif').length;

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">⭐ {decodeURIComponent(departement)}</h1>
            <p className="text-gray-500 mt-1">Liste des stars du département</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/ministere-stars/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total</p>
                  <h3 className="text-3xl font-bold mt-2">{stars.length}</h3>
                </div>
                <Users className="h-12 w-12 text-blue-200 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Actifs</p>
                  <h3 className="text-3xl font-bold mt-2">{actifs}</h3>
                </div>
                <CheckCircle className="h-12 w-12 text-green-200 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Non Actifs</p>
                  <h3 className="text-3xl font-bold mt-2">{nonActifs}</h3>
                </div>
                <XCircle className="h-12 w-12 text-red-200 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des stars */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Stars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4">Prénom</th>
                    <th className="text-left py-3 px-4">Nom</th>
                    <th className="text-center py-3 px-4">Date de Naissance</th>
                    <th className="text-left py-3 px-4">Autres Départements</th>
                    <th className="text-center py-3 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {stars.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-500">
                        Aucune star dans ce département
                      </td>
                    </tr>
                  ) : (
                    stars.map((star, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{star.prenom}</td>
                        <td className="py-3 px-4">{star.nom}</td>
                        <td className="text-center py-3 px-4">
                          {String(star.jour_naissance).padStart(2, '0')}/{String(star.mois_naissance).padStart(2, '0')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {star.departements.filter(d => d !== departement).map((dept, i) => (
                              <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {dept}
                              </span>
                            ))}
                            {star.departements.filter(d => d !== departement).length === 0 && (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <Select
                            value={star.statut}
                            onValueChange={(value) => handleStatutChange(star.id, value)}
                          >
                            <SelectTrigger className={`w-32 ${star.statut === 'actif' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="actif">✅ Actif</SelectItem>
                              <SelectItem value="non_actif">❌ Non Actif</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MinistereStarsDepartementPage;
