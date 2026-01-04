import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PublicBergerieLayout from '../components/PublicBergerieLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Calendar, Save, X, CheckCircle, XCircle, MessageSquare, Table as TableIcon } from 'lucide-react';
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [presences, setPresences] = useState({});
  const [comments, setComments] = useState({});
  const [saving, setSaving] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentVisitorId, setCommentVisitorId] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!ville || !monthNum) {
      navigate('/bergeries');
      return;
    }
    loadVisitors();
  }, [ville, monthNum]);

  useEffect(() => {
    if (selectedDate && visitors.length > 0) {
      loadExistingPresences();
    }
  }, [selectedDate, visitors]);

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

  const loadExistingPresences = () => {
    const newPresences = {};
    const newComments = {};
    
    visitors.forEach(visitor => {
      const allPresences = [
        ...(visitor.presences_dimanche || []),
        ...(visitor.presences_jeudi || [])
      ];
      
      const existingPresence = allPresences.find(p => p.date === selectedDate);
      if (existingPresence) {
        newPresences[visitor.id] = existingPresence.present;
        if (existingPresence.commentaire) {
          newComments[visitor.id] = existingPresence.commentaire;
        }
      }
    });
    
    setPresences(newPresences);
    setComments(newComments);
  };

  const handlePresenceToggle = (visitorId, isPresent) => {
    setPresences(prev => {
      const newPresences = {...prev};
      if (newPresences[visitorId] === isPresent) {
        delete newPresences[visitorId];
      } else {
        newPresences[visitorId] = isPresent;
      }
      return newPresences;
    });
  };

  const handleUncheckAll = () => {
    if (window.confirm('⚠️ Êtes-vous sûr de vouloir décocher toutes les présences ?')) {
      setPresences({});
      toast.info('Toutes les présences ont été décochées');
    }
  };

  const openCommentDialog = (visitorId) => {
    setCommentVisitorId(visitorId);
    setCommentText(comments[visitorId] || '');
    setCommentDialogOpen(true);
  };

  const saveComment = () => {
    if (commentVisitorId) {
      setComments(prev => ({
        ...prev,
        [commentVisitorId]: commentText
      }));
    }
    setCommentDialogOpen(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const type = dayOfWeek === 0 ? 'dimanche' : 'jeudi';
      
      const visitorIdsToSave = new Set([
        ...Object.keys(presences),
        ...Object.keys(comments).filter(id => comments[id]?.trim())
      ]);

      if (visitorIdsToSave.size === 0) {
        toast.info('Aucune présence ou commentaire à enregistrer.');
        setSaving(false);
        return;
      }

      const promises = Array.from(visitorIdsToSave).map(visitorId => {
        return fetch(`${process.env.REACT_APP_BACKEND_URL}/api/bergerie/public/presence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitor_id: visitorId,
            date: selectedDate,
            present: presences[visitorId] !== undefined ? presences[visitorId] : null,
            ville: ville,
            bergerie_month: monthNum,
            type: type,
            commentaire: comments[visitorId] || null
          })
        });
      });

      await Promise.all(promises);
      const dayName = type === 'dimanche' ? 'Dimanche' : 'Jeudi';
      toast.success(`${visitorIdsToSave.size} présences ${dayName} enregistrées pour le ${selectedDate}`);
      await loadVisitors();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const changedCount = Object.keys(presences).length + Object.keys(comments).filter(id => comments[id]?.trim()).length;

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
        {/* Header - identique à MarquerPresencesPage.jsx */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-8 w-8 text-indigo-600" />
              Marquer les Présences
            </h2>
            <p className="text-gray-500 mt-1">Enregistrez les présences pour une date spécifique</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/bergerie/visitors-table?ville=${encodeURIComponent(ville)}&month=${monthNum}`)}
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Vue Tableau
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(`/bergerie/dashboard?ville=${encodeURIComponent(ville)}&month=${monthNum}`)}
            >
              Retour au Dashboard
            </Button>
          </div>
        </div>

        {/* Date Selection - identique à MarquerPresencesPage.jsx */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <label className="font-medium">Sélectionnez la date</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleUncheckAll} className="text-red-600 border-red-200 hover:bg-red-50">
                  <X className="h-4 w-4 mr-2" />
                  Décocher Tout
                </Button>
                <Button 
                  onClick={handleSaveAll} 
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer ({changedCount})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Présences Table - identique à MarquerPresencesPage.jsx */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prénom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Canal d'arrivée</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Présent
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center justify-center gap-1">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Absent
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Commentaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visitors.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        Aucun visiteur trouvé
                      </td>
                    </tr>
                  ) : (
                    visitors.map((visitor) => (
                      <tr key={visitor.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{visitor.lastname}</td>
                        <td className="px-4 py-3 text-sm">{visitor.firstname}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {(visitor.types || [visitor.visitor_type]).filter(Boolean).map((t, idx) => (
                              <span key={idx} className="text-xs">{t}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{visitor.arrival_channel || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <Checkbox
                            checked={presences[visitor.id] === true}
                            onCheckedChange={() => handlePresenceToggle(visitor.id, true)}
                            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Checkbox
                            checked={presences[visitor.id] === false}
                            onCheckedChange={() => handlePresenceToggle(visitor.id, false)}
                            className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCommentDialog(visitor.id)}
                            className={comments[visitor.id] ? 'text-indigo-600' : 'text-gray-400'}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {comments[visitor.id] ? 'Modifier' : 'Commentaire'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Comment Dialog */}
        <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un commentaire</DialogTitle>
            </DialogHeader>
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Votre commentaire..."
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>Annuler</Button>
              <Button onClick={saveComment}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PublicBergerieLayout>
  );
};

export default PublicBergerieMarquerPresencesPage;
