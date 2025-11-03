import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStoppedVisitors, getUser } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { UserX, Search } from 'lucide-react';
import { toast } from 'sonner';

const StoppedVisitorsPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'promotions')) {
      navigate('/dashboard');
      return;
    }
    loadStoppedVisitors();
  }, [user, navigate]);

  useEffect(() => {
    // Filter visitors based on search term
    if (searchTerm) {
      const filtered = visitors.filter(v =>
        v.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.lastname.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVisitors(filtered);
    } else {
      setFilteredVisitors(visitors);
    }
  }, [searchTerm, visitors]);

  const loadStoppedVisitors = async () => {
    try {
      const data = await getStoppedVisitors();
      setVisitors(data);
      setFilteredVisitors(data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
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
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900" data-testid="stopped-visitors-title">
            Visiteurs - Suivi Arrêté
          </h2>
          <p className="text-gray-500 mt-1">Liste des visiteurs dont le suivi a été arrêté</p>
        </div>

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

        {/* Stopped Visitors List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserX className="h-5 w-5 mr-2" />
              Visiteurs ({filteredVisitors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredVisitors.length === 0 ? (
                <p className="text-center text-gray-500 py-8" data-testid="no-stopped-visitors">
                  Aucun visiteur avec suivi arrêté
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
                          {visitor.types.join(', ')} • {visitor.arrival_channel}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                        Suivi arrêté
                      </span>
                    </div>

                    <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-red-500">
                      <p className="text-sm font-medium text-gray-700 mb-1">Raison de l'arrêt:</p>
                      <p className="text-sm text-gray-600">{visitor.stop_reason}</p>
                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <span>Arrêté par: {visitor.stopped_by}</span>
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
