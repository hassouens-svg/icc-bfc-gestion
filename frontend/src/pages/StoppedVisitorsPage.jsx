import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStoppedVisitors, getUser, getReferents } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { UserX, Search } from 'lucide-react';
import { toast } from 'sonner';

const StoppedVisitorsPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPromo, setSelectedPromo] = useState(() => {
    // Récupérer le filtre promo depuis localStorage (venant du dashboard)
    const savedPromo = localStorage.getItem('stopped_visitors_filter_promo');
    return savedPromo || 'all';
  });
  const [responsablesPromo, setResponsablesPromo] = useState([]);
  const [promoStats, setPromoStats] = useState([]);

  useEffect(() => {
    if (!user || !['admin', 'promotions', 'superviseur_promos', 'super_admin', 'pasteur'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    loadData();
    // Nettoyer le filtre sauvegardé après lecture
    localStorage.removeItem('stopped_visitors_filter_promo');
  }, [user, navigate]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedPromo, visitors]);

  const loadData = async () => {
    try {
      // Load stopped visitors
      const data = await getStoppedVisitors();
      setVisitors(data);
      
      // Load responsables promo for grouping
      if (user.role === 'superviseur_promos') {
        const allUsers = await getReferents();
        const respos = allUsers.filter(u => (u.role === 'responsable_promo' || u.role === 'referent') && u.city === user.city);
        setResponsablesPromo(respos);
        calculatePromoStats(data, respos);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const calculatePromoStats = (stoppedVisitors, respos) => {
    const monthToPromo = {};
    respos.forEach(respo => {
      if (respo.assigned_month) {
        const monthPart = respo.assigned_month.split('-')[1];
        monthToPromo[monthPart] = {
          promo_name: respo.promo_name || respo.assigned_month,
          responsable: respo.username
        };
      }
    });

    const promoGroups = {};
    stoppedVisitors.filter(v => v.city === user.city).forEach(visitor => {
      if (!visitor.assigned_month) return;
      
      const monthPart = visitor.assigned_month.split('-')[1];
      const promoInfo = monthToPromo[monthPart];
      const promoKey = promoInfo ? promoInfo.promo_name : visitor.assigned_month;
      
      if (!promoGroups[promoKey]) {
        promoGroups[promoKey] = {
          promo_name: promoKey,
          responsable: promoInfo ? promoInfo.responsable : 'Non assigné',
          count: 0
        };
      }
      promoGroups[promoKey].count++;
    });

    setPromoStats(Object.values(promoGroups));
  };

  const applyFilters = () => {
    let filtered = [...visitors];

    // Filter by city for superviseur_promos
    if (user.role === 'superviseur_promos') {
      filtered = filtered.filter(v => v.city === user.city);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.lastname.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by promo (accepter soit promo_name soit assigned_month)
    if (selectedPromo !== 'all') {
      filtered = filtered.filter(v => {
        if (!v.assigned_month) return false;
        
        // Matcher par assigned_month directement
        if (v.assigned_month === selectedPromo) return true;
        
        // Ou matcher par promo_name
        const monthPart = v.assigned_month.split('-')[1];
        const respo = responsablesPromo.find(r => r.assigned_month && r.assigned_month.split('-')[1] === monthPart);
        const promoName = respo ? (respo.promo_name || respo.assigned_month) : v.assigned_month;
        return promoName === selectedPromo;
      });
    }

    setFilteredVisitors(filtered);
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
        <div>
          <h2 className="text-3xl font-bold text-gray-900" data-testid="stopped-visitors-title">
            Nouveaux Arrivants - Suivi Arrêté
          </h2>
          <p className="text-gray-500 mt-1">Liste des nouveaux arrivants et nouveaux convertis dont le suivi a été arrêté</p>
        </div>

        {/* Stats by Promo for Superviseur */}
        {user.role === 'superviseur_promos' && promoStats.length > 0 && (
          <Card className="bg-gradient-to-br from-red-50 to-red-100">
            <CardHeader>
              <CardTitle className="text-red-800">Suivis Arrêtés par Promo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {promoStats.map(promo => (
                  <div key={promo.promo_name} className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-bold text-lg">{promo.promo_name}</h3>
                    <p className="text-sm text-gray-600">Responsable: {promo.responsable}</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">{promo.count} arrêté{promo.count > 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="stopped-search-input"
            />
          </div>

          {/* Promo filter for superviseur */}
          {user.role === 'superviseur_promos' && responsablesPromo.length > 0 && (
            <div>
              <Select value={selectedPromo} onValueChange={setSelectedPromo}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par promo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les promos</SelectItem>
                  {promoStats.map(promo => (
                    <SelectItem key={promo.promo_name} value={promo.promo_name}>
                      {promo.promo_name} ({promo.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Stopped Visitors List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserX className="h-5 w-5 mr-2" />
              Nouveaux Arrivants ({filteredVisitors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredVisitors.length === 0 ? (
                <p className="text-center text-gray-500 py-8" data-testid="no-stopped-visitors">
                  Aucun nouveaux arrivants et nouveaux convertis avec suivi arrêté
                </p>
              ) : (
                filteredVisitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                    data-testid={`stopped-visitor-${visitor.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-lg">
                          {visitor.firstname} {visitor.lastname}
                        </p>
                        <p className="text-sm text-gray-500">
                          {visitor.types?.join(', ')} • {visitor.arrival_channel}
                        </p>
                        {visitor.assigned_month && (
                          <p className="text-xs text-indigo-600 font-medium mt-1">
                            Promo: {visitor.assigned_month}
                          </p>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                        Suivi arrêté
                      </span>
                    </div>

                    <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-red-500">
                      <p className="text-sm font-medium text-gray-700 mb-1">Raison de l'arrêt:</p>
                      <p className="text-sm text-gray-600">{visitor.stop_reason || 'Non spécifié'}</p>
                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <span>Arrêté par: {visitor.stopped_by || 'N/A'}</span>
                        <span>
                          {visitor.stopped_date && new Date(visitor.stopped_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    {visitor.phone && (
                      <p className="text-sm text-gray-500 mt-2">
                        <span className="font-medium">Tél:</span> {visitor.phone}
                      </p>
                    )}
                    {visitor.email && (
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Email:</span> {visitor.email}
                      </p>
                    )}
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

export default StoppedVisitorsPage;
