import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PublicBergerieLayout from '../components/PublicBergerieLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { UserCheck, Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const monthNames = {
  '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
  '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
  '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
};

const PublicBergerieSuiviDisciplesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const ville = searchParams.get('ville') || '';
  const monthNum = searchParams.get('month') || '01';
  
  const guestContextStr = localStorage.getItem('guest_bergerie_context');
  const guestContext = guestContextStr ? JSON.parse(guestContextStr) : {
    ville,
    month_num: monthNum,
    month_name: monthNames[monthNum] || monthNum,
    nom: `Bergerie ${monthNames[monthNum] || monthNum}`
  };

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ oui: 0, enCours: 0, non: 0 });

  useEffect(() => {
    if (!ville || !monthNum) {
      navigate('/bergeries');
      return;
    }
    loadVisitors();
  }, [ville, monthNum]);

  useEffect(() => {
    const oui = visitors.filter(v => v.est_disciple === 'Oui').length;
    const enCours = visitors.filter(v => v.est_disciple === 'En Cours').length;
    const non = visitors.filter(v => !v.est_disciple || v.est_disciple === 'Non').length;
    setStats({ oui, enCours, non });
  }, [visitors]);

  const loadVisitors = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/reproduction/${encodeURIComponent(ville)}/${monthNum}`
      );
      if (response.ok) {
        const data = await response.json();
        setVisitors((data.visitors || []).filter(v => !v.tracking_stopped));
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDisciple = async (visitorId, newStatus) => {
    try {
      await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/disciples/${visitorId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            est_disciple: newStatus,
            date_devenu_disciple: newStatus === 'Oui' ? new Date().toISOString().split('T')[0] : null
          })
        }
      );
      
      setVisitors(prev => prev.map(v => 
        v.id === visitorId ? { ...v, est_disciple: newStatus } : v
      ));
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const filteredVisitors = visitors.filter(v =>
    `${v.firstname} ${v.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <PublicBergerieLayout guestContext={guestContext}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PublicBergerieLayout>
    );
  }

  return (
    <PublicBergerieLayout guestContext={guestContext}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Suivi des Disciples</h2>
          <p className="text-gray-500 mt-1">Bergerie {monthNames[monthNum]} • {ville}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.oui}</p>
              <p className="text-sm text-green-700">Oui</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.enCours}</p>
              <p className="text-sm text-orange-700">En Cours</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-gray-600">{stats.non}</p>
              <p className="text-sm text-gray-700">Non</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-600" />
              Liste des Membres ({filteredVisitors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredVisitors.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Aucun membre trouvé
                </div>
              ) : (
                filteredVisitors.map((visitor) => (
                  <div key={visitor.id} className="flex justify-between items-center p-4 hover:bg-gray-50">
                    <div>
                      <p className="font-medium">{visitor.firstname} {visitor.lastname}</p>
                      <p className="text-sm text-gray-500">{visitor.phone || '-'}</p>
                    </div>
                    <Select
                      value={visitor.est_disciple || 'Non'}
                      onValueChange={(value) => handleUpdateDisciple(visitor.id, value)}
                    >
                      <SelectTrigger className={`w-32 ${
                        visitor.est_disciple === 'Oui' ? 'bg-green-50 border-green-300' :
                        visitor.est_disciple === 'En Cours' ? 'bg-orange-50 border-orange-300' :
                        'bg-gray-50 border-gray-300'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Non">Non</SelectItem>
                        <SelectItem value="En Cours">En Cours</SelectItem>
                        <SelectItem value="Oui">Oui ✓</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicBergerieLayout>
  );
};

export default PublicBergerieSuiviDisciplesPage;
