import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Phone, Briefcase, User } from 'lucide-react';
import { toast } from 'sonner';
import KPIDiscipolat from '../components/KPIDiscipolat';

const MembreBergerieDetailPage = () => {
  const navigate = useNavigate();
  const { bergerieId, membreId } = useParams();
  const [membre, setMembre] = useState(null);
  const [bergerie, setBergerie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [bergerieId, membreId]);

  const loadData = async () => {
    try {
      // Charger les infos de la bergerie
      const bergerieResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/${bergerieId}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      if (bergerieResponse.ok) {
        const bergerieData = await bergerieResponse.json();
        setBergerie(bergerieData);
      }
      
      // Charger les membres pour trouver celui qu'on veut
      const membresResponse = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergeries-disciples/${bergerieId}/membres`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      if (membresResponse.ok) {
        const data = await membresResponse.json();
        const foundMembre = (data.membres || []).find(m => m.id === membreId);
        if (foundMembre) {
          setMembre(foundMembre);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!membre) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Membre non trouvé</p>
          <Button onClick={() => navigate(-1)}>Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(`/bergerie-disciple/${bergerieId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{membre.prenom} {membre.nom}</h1>
                <p className="text-sm text-gray-500">
                  Membre de {bergerie?.nom || 'la bergerie'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Informations de base */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nom complet</p>
                <p className="font-medium">{membre.prenom} {membre.nom || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Téléphone
                </p>
                <p className="font-medium">{membre.telephone || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> Profession
                </p>
                <p className="font-medium">{membre.profession || 'Non renseignée'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bergerie</p>
                <p className="font-medium">{bergerie?.nom || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Discipolat */}
        <KPIDiscipolat 
          visitorId={membreId} 
          visitorName={`${membre.prenom} ${membre.nom || ''}`}
          isBergerieMember={true}
        />
      </div>
    </div>
  );
};

export default MembreBergerieDetailPage;
