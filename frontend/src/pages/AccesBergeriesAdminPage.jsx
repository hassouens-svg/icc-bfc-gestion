import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, Search, MapPin, ArrowRight, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useCities } from '../contexts/CitiesContext';

const AccesBergeriesAdminPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const { cities } = useCities();
  
  const [bergeries, setBergeries] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState('bergeries'); // 'bergeries' or 'promotions'

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Seuls superadmin et pasteur peuvent accéder
    if (!['super_admin', 'pasteur'].includes(user.role)) {
      toast.error('Accès non autorisé');
      navigate('/dashboard');
      return;
    }
    
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Charger les bergeries (groupes de disciples)
      const bergeriesResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/list`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      if (bergeriesResponse.ok) {
        const data = await bergeriesResponse.json();
        setBergeries(data);
      }
      
      // Charger les promotions
      const promosResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/promotions`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      if (promosResponse.ok) {
        const data = await promosResponse.json();
        setPromotions(data);
      }
    } catch (error) {
      console.log('Error in AccesBergeriesAdminPage.loadData');
      console.error('Error:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les données
  const filteredBergeries = bergeries.filter(b => {
    const matchCity = selectedCity === 'all' || b.ville === selectedCity;
    const matchSearch = !searchTerm || 
      b.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.responsable?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCity && matchSearch;
  });

  const filteredPromotions = promotions.filter(p => {
    const matchCity = selectedCity === 'all' || p.ville === selectedCity;
    const matchSearch = !searchTerm || 
      p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.berger?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCity && matchSearch;
  });

  const handleAccessBergerie = (bergerie) => {
    // Stocker l'ID de la bergerie pour y accéder
    localStorage.setItem('admin_accessing_bergerie', bergerie.id);
    navigate(`/bergerie-disciple/${bergerie.id}`);
  };

  const handleAccessPromotion = (promo) => {
    // Naviguer vers la page de la promotion
    localStorage.setItem('admin_accessing_promo', promo.id);
    navigate(`/bergerie/${promo.ville}/${promo.nom}`);
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
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Accès Administration</h1>
            <p className="text-gray-500">Accédez à n'importe quelle bergerie ou promotion</p>
          </div>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Type de vue */}
              <Select value={viewType} onValueChange={setViewType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bergeries">Bergeries (Groupes)</SelectItem>
                  <SelectItem value="promotions">Promotions</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Filtre ville */}
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Toutes les villes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city.name || city} value={city.name || city}>
                      {city.name || city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Recherche */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou responsable..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des bergeries */}
        {viewType === 'bergeries' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Bergeries - Groupes de Disciples ({filteredBergeries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredBergeries.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune bergerie trouvée</p>
              ) : (
                <div className="divide-y">
                  {filteredBergeries.map((bergerie) => (
                    <div 
                      key={bergerie.id}
                      className="flex items-center justify-between py-4 hover:bg-gray-50 px-2 -mx-2 rounded cursor-pointer"
                      onClick={() => handleAccessBergerie(bergerie)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{bergerie.nom}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {bergerie.ville}
                            </span>
                            <span>Responsable: {bergerie.responsable || '-'}</span>
                            <span>{bergerie.membres_count || 0} membres</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Liste des promotions */}
        {viewType === 'promotions' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Promotions ({filteredPromotions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPromotions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune promotion trouvée</p>
              ) : (
                <div className="divide-y">
                  {filteredPromotions.map((promo) => (
                    <div 
                      key={promo.id || promo.nom}
                      className="flex items-center justify-between py-4 hover:bg-gray-50 px-2 -mx-2 rounded cursor-pointer"
                      onClick={() => handleAccessPromotion(promo)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{promo.nom}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {promo.ville}
                            </span>
                            <span>Berger: {promo.berger || '-'}</span>
                            <span>{promo.visitors_count || promo.total || 0} visiteurs</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AccesBergeriesAdminPage;
