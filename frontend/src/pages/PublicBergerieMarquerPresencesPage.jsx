import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PublicBergerieLayout from '../components/PublicBergerieLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Calendar, CheckCircle, XCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

const monthNames = {
  '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
  '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
  '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
};

const PublicBergerieMarquerPresencesPage = () => {
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
  const [presenceDate, setPresenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [presences, setPresences] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ville || !monthNum) {
      navigate('/bergeries');
      return;
    }
    loadVisitors();
  }, [ville, monthNum]);

  const loadVisitors = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/reproduction/${encodeURIComponent(ville)}/${monthNum}`
      );
      if (response.ok) {
        const data = await response.json();
        const activeVisitors = (data.visitors || []).filter(v => !v.tracking_stopped);
        setVisitors(activeVisitors);
        
        // Initialize presences from existing data
        const presencesMap = {};
        activeVisitors.forEach(v => {
          const allPresences = [...(v.presences_dimanche || []), ...(v.presences_jeudi || [])];
          const existingPresence = allPresences.find(p => p.date === presenceDate);
          if (existingPresence) {
            presencesMap[v.id] = existingPresence.present;
          }
        });
        setPresences(presencesMap);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPresence = async (visitorId, isPresent) => {
    setPresences(prev => ({ ...prev, [visitorId]: isPresent }));
    
    try {
      await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/presence`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitor_id: visitorId,
            date: presenceDate,
            present: isPresent,
            ville: ville,
            bergerie_month: monthNum
          })
        }
      );
      toast.success(isPresent ? 'Présent marqué' : 'Absent marqué');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleMarkAllPresent = async () => {
    setSaving(true);
    try {
      for (const visitor of visitors) {
        await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/presence`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              visitor_id: visitor.id,
              date: presenceDate,
              present: true,
              ville: ville,
              bergerie_month: monthNum
            })
          }
        );
        setPresences(prev => ({ ...prev, [visitor.id]: true }));
      }
      toast.success('Tous marqués présents');
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(presences).filter(p => p === true).length;
  const absentCount = Object.values(presences).filter(p => p === false).length;

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-8 w-8 text-green-600" />
              Marquer les Présences
            </h2>
            <p className="text-gray-500 mt-1">Bergerie {monthNames[monthNum]} • {ville}</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={presenceDate}
              onChange={(e) => {
                setPresenceDate(e.target.value);
                setPresences({});
              }}
              className="w-44"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <Users className="h-6 w-6 mx-auto text-blue-600 mb-1" />
              <p className="text-2xl font-bold">{visitors.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="py-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-1" />
              <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              <p className="text-xs text-green-700">Présents</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50">
            <CardContent className="py-4 text-center">
              <XCircle className="h-6 w-6 mx-auto text-red-600 mb-1" />
              <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              <p className="text-xs text-red-700">Absents</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button onClick={handleMarkAllPresent} disabled={saving} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Tous Présents
          </Button>
        </div>

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle>Membres ({visitors.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {visitors.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Aucun membre
                </div>
              ) : (
                visitors.map((visitor) => (
                  <div key={visitor.id} className="flex justify-between items-center p-4 hover:bg-gray-50">
                    <div>
                      <p className="font-medium">{visitor.firstname} {visitor.lastname}</p>
                      <p className="text-sm text-gray-500">{visitor.visitor_type || visitor.types?.join(', ') || 'NA'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={presences[visitor.id] === true ? 'default' : 'outline'}
                        className={presences[visitor.id] === true ? 'bg-green-600 hover:bg-green-700' : 'text-green-600 hover:bg-green-50'}
                        onClick={() => handleMarkPresence(visitor.id, true)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={presences[visitor.id] === false ? 'default' : 'outline'}
                        className={presences[visitor.id] === false ? 'bg-red-600 hover:bg-red-700' : 'text-red-600 hover:bg-red-50'}
                        onClick={() => handleMarkPresence(visitor.id, false)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
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

export default PublicBergerieMarquerPresencesPage;
