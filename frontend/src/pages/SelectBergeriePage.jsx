import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, ArrowLeft, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const SelectBergeriePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const [bergeries, setBergeries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Récupérer la ville depuis les query params ou l'utilisateur
  const searchParams = new URLSearchParams(location.search);
  const ville = searchParams.get('ville') || user?.city || '';

  useEffect(() => {
    if (!ville) {
      navigate('/select-ville?redirect=bergeries');
      return;
    }
    loadBergeries();
  }, [ville]);

  const loadBergeries = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/list/${ville}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Erreur chargement');
      
      const data = await response.json();
      setBergeries(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des bergeries');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBergerie = (bergerie) => {
    // Sauvegarder la bergerie sélectionnée
    localStorage.setItem('selected_bergerie', JSON.stringify({
      month_num: bergerie.month_num,
      month_name: bergerie.month_name,
      nom: bergerie.nom,
      ville: ville
    }));
    
    // Mettre à jour le user pour qu'il soit considéré comme berger de cette bergerie
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.assigned_month = `${new Date().getFullYear()}-${bergerie.month_num}`;
    user.promo_name = bergerie.nom;
    user.city = ville;
    localStorage.setItem('user', JSON.stringify(user));
    
    // Naviguer vers le dashboard authentifié standard
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bergeries - {ville}</h1>
            <p className="text-gray-500 mt-1">Sélectionnez une bergerie pour accéder à son tableau de bord</p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* Grille des bergeries */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bergeries.map((bergerie) => (
            <Card 
              key={bergerie.month_num}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-purple-400 hover:bg-purple-50"
              onClick={() => handleSelectBergerie(bergerie)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  {bergerie.nom}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{bergerie.total_personnes} personne(s) suivie(s)</span>
                  </div>
                  
                  {bergerie.bergers && bergerie.bergers.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Berger(s): {bergerie.bergers.map(b => b.username).join(', ')}
                    </div>
                  )}
                </div>
                
                <Button 
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  Accéder
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SelectBergeriePage;
