import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { getDeletedVisitors, getUser } from '../utils/api';
import { Trash2, Calendar, User, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const DeletedVisitorsPage = () => {
  const user = getUser();
  const [deletedVisitors, setDeletedVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      loadDeletedVisitors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDeletedVisitors = async () => {
    try {
      setLoading(true);
      const data = await getDeletedVisitors();
      setDeletedVisitors(data);
    } catch (error) {
      console.error('Error loading deleted visitors:', error);
      toast.error('Erreur lors du chargement des visiteurs supprimés');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <Layout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">Accès refusé</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Visiteurs Supprimés</h1>
          <p className="text-gray-500 mt-2">
            Liste de tous les visiteurs supprimés du système
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              {deletedVisitors.length} visiteur(s) supprimé(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-4 text-gray-500">Chargement...</p>
            ) : deletedVisitors.length === 0 ? (
              <p className="text-center py-4 text-gray-500">Aucun visiteur supprimé</p>
            ) : (
              <div className="space-y-3">
                {deletedVisitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="border rounded-lg p-4 bg-red-50 hover:bg-red-100 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <p className="font-semibold text-lg">
                            {visitor.firstname} {visitor.lastname}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {visitor.city}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Promo: {visitor.assigned_month || 'N/A'}
                          </div>
                        </div>
                        {visitor.email && (
                          <p className="text-sm text-gray-600">📧 {visitor.email}</p>
                        )}
                        {visitor.phone && (
                          <p className="text-sm text-gray-600">📞 {visitor.phone}</p>
                        )}
                      </div>

                      <div className="text-right text-sm space-y-1">
                        <div className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-medium">
                          Supprimé
                        </div>
                        <p className="text-xs text-gray-600">
                          Par: <span className="font-semibold">{visitor.deleted_by || 'N/A'}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {visitor.deleted_at ? new Date(visitor.deleted_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Types */}
                    {visitor.types && visitor.types.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {visitor.types.map((type, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DeletedVisitorsPage;
