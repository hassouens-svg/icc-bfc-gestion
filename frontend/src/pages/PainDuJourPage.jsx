import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Book, Play, Settings, CheckCircle, BarChart3, ExternalLink, Youtube, Loader2, Clock, Eye, ThumbsUp, X, Calendar, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const PainDuJourPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [content, setContent] = useState({ date: today, versets: [] });
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [livresBible, setLivresBible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [stats, setStats] = useState([]);
  const [fetchingYoutube, setFetchingYoutube] = useState({ priere: false, enseignement: false });
  const [videoInfo, setVideoInfo] = useState({ priere: null, enseignement: null });
  
  // Admin form state
  const [adminForm, setAdminForm] = useState({
    date: today,
    lien_priere: '',
    titre_priere: '',
    lien_enseignement: '',
    titre_enseignement: '',
    thumbnail_priere: '',
    thumbnail_enseignement: '',
    duration_priere: '',
    duration_enseignement: '',
    versets: []
  });
  const [newVerset, setNewVerset] = useState({ livre: '', chapitre: '', verset_debut: '', verset_fin: '' });
  
  // Sondage state
  const [sondage, setSondage] = useState({ lecture: '', video: '' });

  // Permissions
  const canEdit = user?.role && ['super_admin', 'pasteur', 'gestion_projet'].includes(user.role);

  useEffect(() => {
    loadContent(selectedDate);
    loadLivres();
  }, [selectedDate]);

  const loadContent = async (date) => {
    setLoading(true);
    try {
      const endpoint = date === today ? 'today' : date;
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pain-du-jour/${endpoint}`);
      const data = await response.json();
      setContent(data);
      if (data.date) {
        setAdminForm({
          date: data.date || today,
          lien_priere: data.lien_priere || '',
          titre_priere: data.titre_priere || '',
          lien_enseignement: data.lien_enseignement || '',
          titre_enseignement: data.titre_enseignement || '',
          thumbnail_priere: data.thumbnail_priere || '',
          thumbnail_enseignement: data.thumbnail_enseignement || '',
          duration_priere: data.duration_priere || '',
          duration_enseignement: data.duration_enseignement || '',
          versets: data.versets || []
        });
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLivres = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pain-du-jour/livres`);
      const data = await response.json();
      setLivresBible(data);
    } catch (error) {
      console.error('Error loading livres:', error);
    }
  };

  const loadStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const year = new Date().getFullYear();
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/pain-du-jour/stats/${year}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Fetch YouTube video info
  const fetchYoutubeInfo = useCallback(async (url, type) => {
    if (!url || url.length < 10) return;
    
    setFetchingYoutube(prev => ({ ...prev, [type]: true }));
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pain-du-jour/youtube-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (response.ok) {
        const data = await response.json();
        setVideoInfo(prev => ({ ...prev, [type]: data }));
        
        // Auto-fill title if empty
        if (type === 'priere' && !adminForm.titre_priere) {
          setAdminForm(prev => ({ 
            ...prev, 
            titre_priere: data.title,
            thumbnail_priere: data.thumbnail_url,
            duration_priere: data.duration
          }));
        } else if (type === 'enseignement' && !adminForm.titre_enseignement) {
          setAdminForm(prev => ({ 
            ...prev, 
            titre_enseignement: data.title,
            thumbnail_enseignement: data.thumbnail_url,
            duration_enseignement: data.duration
          }));
        }
        
        toast.success(`Vidéo trouvée : ${data.title.substring(0, 50)}...`);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur lors de la récupération');
      }
    } catch (error) {
      console.error('Error fetching YouTube info:', error);
    } finally {
      setFetchingYoutube(prev => ({ ...prev, [type]: false }));
    }
  }, [adminForm.titre_priere, adminForm.titre_enseignement]);

  const handleAdminOpen = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Veuillez vous connecter');
      return;
    }
    if (!canEdit) {
      toast.error('Accès non autorisé');
      return;
    }
    loadStats();
    setShowAdminDialog(true);
  };

  const handleSaveContent = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pain-du-jour`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(adminForm)
      });
      if (!response.ok) throw new Error('Erreur');
      toast.success('Contenu enregistré !');
      loadContent(adminForm.date);
      setShowAdminDialog(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const addVerset = () => {
    if (!newVerset.livre || !newVerset.chapitre || !newVerset.verset_debut) {
      toast.error('Remplissez livre, chapitre et verset');
      return;
    }
    setAdminForm(prev => ({
      ...prev,
      versets: [...prev.versets, { ...newVerset }]
    }));
    setNewVerset({ livre: '', chapitre: '', verset_debut: '', verset_fin: '' });
  };

  const removeVerset = (index) => {
    setAdminForm(prev => ({
      ...prev,
      versets: prev.versets.filter((_, i) => i !== index)
    }));
  };

  const trackClick = async (type) => {
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pain-du-jour/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, date: selectedDate })
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const handleSubmitSondage = async () => {
    if (!sondage.lecture || !sondage.video) {
      toast.error('Veuillez répondre aux deux questions');
      return;
    }
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pain-du-jour/sondage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          lecture_reponse: sondage.lecture,
          video_reponse: sondage.video
        })
      });
      toast.success('Merci pour votre participation !');
      setSubmitted(true);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?\s]{11})/);
    return match ? match[1] : null;
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return `S${Math.ceil(diff / oneWeek)}`;
  };

  // Navigation date
  const changeDate = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Préparer les données pour les graphiques
  const chartData = stats.map(s => ({
    semaine: s.semaine,
    clics_priere: s.clicks_priere || 0,
    clics_enseignement: s.clicks_enseignement || 0,
    reponses: s.total_reponses || 0,
    lecture_oui: s.lecture_oui || 0,
    lecture_non: s.lecture_non || 0,
    lecture_partiel: s.lecture_partiel || 0,
    video_oui: s.video_oui || 0,
    video_non: s.video_non || 0,
    video_partiel: s.video_partiel || 0,
  })).sort((a, b) => {
    const numA = parseInt(a.semaine.replace('S', ''));
    const numB = parseInt(b.semaine.replace('S', ''));
    return numA - numB;
  });

  // Aggregate data for pie charts
  const totalLecture = chartData.reduce((acc, d) => ({
    oui: acc.oui + d.lecture_oui,
    non: acc.non + d.lecture_non,
    partiel: acc.partiel + d.lecture_partiel
  }), { oui: 0, non: 0, partiel: 0 });

  const totalVideo = chartData.reduce((acc, d) => ({
    oui: acc.oui + d.video_oui,
    non: acc.non + d.video_non,
    partiel: acc.partiel + d.video_partiel
  }), { oui: 0, non: 0, partiel: 0 });

  const pieDataLecture = [
    { name: 'Oui', value: totalLecture.oui, color: '#22c55e' },
    { name: 'Non', value: totalLecture.non, color: '#ef4444' },
    { name: 'Partiellement', value: totalLecture.partiel, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const pieDataVideo = [
    { name: 'Oui', value: totalVideo.oui, color: '#22c55e' },
    { name: 'Non', value: totalVideo.non, color: '#ef4444' },
    { name: 'Pas totalement', value: totalVideo.partiel, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const isToday = selectedDate === today;
  const formattedDate = new Date(selectedDate).toLocaleDateString('fr-FR', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 md:py-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-white hover:bg-white/20"
              >
                <Home className="h-5 w-5" />
              </Button>
              <img
                src="https://customer-assets.emergentagent.com/job_dijon-icc-hub/artifacts/foeikpvk_IMG_2590.png"
                alt="ICC Logo"
                className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white p-1 shadow-lg"
              />
              <div>
                <h1 className="text-xl md:text-3xl font-bold">🍞 Le Pain du Jour</h1>
                <p className="text-amber-100 text-xs md:text-sm">Nourriture spirituelle quotidienne</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/pain-du-jour/admin')} 
              variant="outline" 
              size="sm" 
              className="bg-white/20 hover:bg-white/30 border-white/30"
            >
              <Settings className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Mettre à jour</span>
              <span className="md:hidden">MAJ</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Verset d'introduction */}
        <Card className="bg-white/80 backdrop-blur border-amber-200 shadow-xl">
          <CardContent className="p-4 md:p-6 text-center">
            <div className="text-3xl md:text-4xl mb-3 md:mb-4">📖</div>
            <blockquote className="text-lg md:text-xl font-serif italic text-amber-800 mb-2 md:mb-3">
              "Donne-nous aujourd'hui notre pain quotidien"
            </blockquote>
            <p className="text-sm text-gray-600 font-medium mb-3 md:mb-4">— Matthieu 6:11</p>
            <p className="text-gray-700 text-sm leading-relaxed max-w-2xl mx-auto">
              Jésus ne parlait pas seulement du pain physique, de la nourriture matérielle. Il parlait surtout 
              de <strong>nourriture spirituelle</strong>, de la Parole de Dieu et des enseignements divins. 
              Car c'est cette nourriture qui fortifie notre être intérieur, qui édifie notre âme et notre esprit. 
              Chaque jour, prenons le temps de nous nourrir de cette manne céleste.
            </p>
          </CardContent>
        </Card>

        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)} className="h-8 w-8 md:h-10 md:w-10">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center px-4">
            <p className={`text-base md:text-lg font-medium ${isToday ? 'text-amber-800' : 'text-gray-700'}`}>
              📅 {formattedDate}
            </p>
            {isToday && <span className="text-xs text-amber-600 font-medium">(Aujourd'hui)</span>}
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => changeDate(1)} 
            disabled={selectedDate >= today}
            className="h-8 w-8 md:h-10 md:w-10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isToday && (
            <Button variant="link" size="sm" onClick={() => setSelectedDate(today)} className="text-amber-600">
              Revenir à aujourd'hui
            </Button>
          )}
        </div>

        {/* Versets du jour - EN DEUXIÈME POSITION */}
        <Card className="bg-white shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 md:py-4">
            <CardTitle className="flex items-center justify-between text-base md:text-lg">
              <div className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Versets du Jour
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://emcitv.com/bible/', '_blank')}
                className="bg-white/20 hover:bg-white/30 border-white/30 text-white text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Lire sur EMCI TV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {content.versets && content.versets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="text-left py-3 md:py-4 px-4 md:px-6 font-semibold text-green-800 text-sm md:text-lg">Livre</th>
                      <th className="text-center py-3 md:py-4 px-4 md:px-6 font-semibold text-green-800 text-sm md:text-lg">Chapitre</th>
                      <th className="text-center py-3 md:py-4 px-4 md:px-6 font-semibold text-green-800 text-sm md:text-lg">Versets</th>
                      <th className="text-center py-3 md:py-4 px-4 md:px-6 font-semibold text-green-800 text-sm md:text-lg">Lire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.versets.map((v, idx) => (
                      <tr key={idx} className="border-t hover:bg-green-50/50">
                        <td className="py-3 md:py-4 px-4 md:px-6 font-medium text-gray-800 text-sm md:text-lg">{v.livre}</td>
                        <td className="py-3 md:py-4 px-4 md:px-6 text-center text-gray-700 text-sm md:text-lg">{v.chapitre}</td>
                        <td className="py-3 md:py-4 px-4 md:px-6 text-center text-gray-700 text-sm md:text-lg">
                          {v.verset_fin ? `${v.verset_debut} - ${v.verset_fin}` : v.verset_debut}
                        </td>
                        <td className="py-3 md:py-4 px-4 md:px-6 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open('https://emcitv.com/bible/', '_blank')}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📖</div>
                <p className="text-gray-500">Aucun verset configuré pour cette date</p>
                <Button
                  variant="link"
                  onClick={() => window.open('https://emcitv.com/bible/', '_blank')}
                  className="text-green-600 mt-2"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Lire la Bible sur EMCI TV
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Temps de prière prophétique */}
        <Card className="bg-white shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 md:py-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              🙏 Temps de Prière Prophétique
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {content.lien_priere ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm md:text-base">{content.titre_priere || 'Temps de prière du jour'}</p>
                    {content.duration_priere && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" /> {content.duration_priere}
                      </p>
                    )}
                  </div>
                </div>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-inner">
                  {getYouTubeId(content.lien_priere) ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(content.lien_priere)}`}
                      title="Temps de prière"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Aperçu non disponible</p>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => {
                    trackClick('priere');
                    window.open(content.lien_priere, '_blank');
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  Regarder sur YouTube
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🙏</div>
                <p className="text-gray-500">Aucun temps de prière configuré pour cette date</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enseignements du jour */}
        <Card className="bg-white shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 md:py-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              📚 Enseignements du Jour
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {content.lien_enseignement ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm md:text-base">{content.titre_enseignement || 'Enseignement du jour'}</p>
                    {content.duration_enseignement && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" /> {content.duration_enseignement}
                      </p>
                    )}
                  </div>
                </div>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-inner">
                  {getYouTubeId(content.lien_enseignement) ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(content.lien_enseignement)}`}
                      title="Enseignement"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Aperçu non disponible</p>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => {
                    trackClick('enseignement');
                    window.open(content.lien_enseignement, '_blank');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  Regarder sur YouTube
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📚</div>
                <p className="text-gray-500">Aucun enseignement configuré pour cette date</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sondage - Only show for today */}
        {isToday && (
          <Card className="bg-white shadow-lg border-2 border-amber-200">
            <CardHeader className="bg-amber-50 py-3">
              <CardTitle className="text-amber-800 flex items-center gap-2 text-base md:text-lg">
                <BarChart3 className="h-5 w-5" />
                📊 Votre Participation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {submitted ? (
                <div className="text-center py-6 md:py-8">
                  <CheckCircle className="h-12 w-12 md:h-16 md:w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg md:text-xl font-medium text-green-700">Merci pour votre participation !</p>
                  <p className="text-gray-500 mt-2 text-sm">Vos réponses ont été enregistrées.</p>
                </div>
              ) : (
                <div className="space-y-5 md:space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm md:text-base font-medium">Avez-vous pu faire les lectures du jour ?</Label>
                    <RadioGroup value={sondage.lecture} onValueChange={(v) => setSondage({...sondage, lecture: v})}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Oui" id="lecture-oui" />
                        <Label htmlFor="lecture-oui" className="text-sm md:text-base">Oui ✅</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Non" id="lecture-non" />
                        <Label htmlFor="lecture-non" className="text-sm md:text-base">Non ❌</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Partiellement" id="lecture-partiel" />
                        <Label htmlFor="lecture-partiel" className="text-sm md:text-base">Partiellement 📖</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm md:text-base font-medium">Avez-vous pu regarder les vidéos ?</Label>
                    <RadioGroup value={sondage.video} onValueChange={(v) => setSondage({...sondage, video: v})}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Oui" id="video-oui" />
                        <Label htmlFor="video-oui" className="text-sm md:text-base">Oui ✅</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Non" id="video-non" />
                        <Label htmlFor="video-non" className="text-sm md:text-base">Non ❌</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Pas totalement" id="video-partiel" />
                        <Label htmlFor="video-partiel" className="text-sm md:text-base">Pas totalement 🎬</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button 
                    onClick={handleSubmitSondage} 
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    disabled={!sondage.lecture || !sondage.video}
                  >
                    {(!sondage.lecture || !sondage.video) ? (
                      '⚠️ Répondez aux deux questions'
                    ) : (
                      'Enregistrer mes réponses ✓'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="text-center py-6 md:py-8 text-gray-500 text-xs md:text-sm">
          <p>© {new Date().getFullYear()} ICC BFC-ITALIE - Le Pain du Jour</p>
        </footer>
      </main>

      {/* Dialog Admin - Mise à jour */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
              <span>⚙️ Gérer le contenu</span>
              <Button variant="outline" size="sm" onClick={() => setShowStatsDialog(true)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Statistiques
              </Button>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="content" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">📝 Contenu</TabsTrigger>
              <TabsTrigger value="versets">📖 Versets</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              {/* Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Date du contenu
                </Label>
                <Input 
                  type="date" 
                  value={adminForm.date} 
                  onChange={(e) => setAdminForm({...adminForm, date: e.target.value})}
                />
              </div>

              {/* Temps de prière */}
              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50 py-3">
                  <CardTitle className="text-base text-purple-800">🙏 Temps de Prière Prophétique</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label>Lien YouTube</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={adminForm.lien_priere} 
                        onChange={(e) => setAdminForm({...adminForm, lien_priere: e.target.value})}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => fetchYoutubeInfo(adminForm.lien_priere, 'priere')}
                        disabled={fetchingYoutube.priere || !adminForm.lien_priere}
                      >
                        {fetchingYoutube.priere ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Youtube className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Titre (auto-rempli depuis YouTube)</Label>
                    <Input 
                      value={adminForm.titre_priere} 
                      onChange={(e) => setAdminForm({...adminForm, titre_priere: e.target.value})}
                      placeholder="Ex: Prière du matin - Semaine 51"
                    />
                  </div>
                  {videoInfo.priere && (
                    <div className="bg-purple-50 p-3 rounded-lg flex items-start gap-3">
                      <img 
                        src={videoInfo.priere.thumbnail_url} 
                        alt="Thumbnail" 
                        className="w-24 h-auto rounded"
                      />
                      <div className="text-sm">
                        <p className="font-medium line-clamp-2">{videoInfo.priere.title}</p>
                        <p className="text-gray-500 text-xs mt-1 flex items-center gap-2">
                          <Clock className="h-3 w-3" /> {videoInfo.priere.duration}
                          <Eye className="h-3 w-3 ml-2" /> {videoInfo.priere.view_count.toLocaleString()}
                          <ThumbsUp className="h-3 w-3 ml-2" /> {videoInfo.priere.like_count.toLocaleString()}
                        </p>
                        <p className="text-gray-500 text-xs">{videoInfo.priere.channel_title}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enseignement */}
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50 py-3">
                  <CardTitle className="text-base text-blue-800">📚 Enseignement du Jour</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label>Lien YouTube</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={adminForm.lien_enseignement} 
                        onChange={(e) => setAdminForm({...adminForm, lien_enseignement: e.target.value})}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => fetchYoutubeInfo(adminForm.lien_enseignement, 'enseignement')}
                        disabled={fetchingYoutube.enseignement || !adminForm.lien_enseignement}
                      >
                        {fetchingYoutube.enseignement ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Youtube className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Titre (auto-rempli depuis YouTube)</Label>
                    <Input 
                      value={adminForm.titre_enseignement} 
                      onChange={(e) => setAdminForm({...adminForm, titre_enseignement: e.target.value})}
                      placeholder="Ex: La foi qui déplace les montagnes"
                    />
                  </div>
                  {videoInfo.enseignement && (
                    <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3">
                      <img 
                        src={videoInfo.enseignement.thumbnail_url} 
                        alt="Thumbnail" 
                        className="w-24 h-auto rounded"
                      />
                      <div className="text-sm">
                        <p className="font-medium line-clamp-2">{videoInfo.enseignement.title}</p>
                        <p className="text-gray-500 text-xs mt-1 flex items-center gap-2">
                          <Clock className="h-3 w-3" /> {videoInfo.enseignement.duration}
                          <Eye className="h-3 w-3 ml-2" /> {videoInfo.enseignement.view_count.toLocaleString()}
                          <ThumbsUp className="h-3 w-3 ml-2" /> {videoInfo.enseignement.like_count.toLocaleString()}
                        </p>
                        <p className="text-gray-500 text-xs">{videoInfo.enseignement.channel_title}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="versets" className="mt-4">
              <Card className="border-green-200">
                <CardHeader className="bg-green-50 py-3">
                  <CardTitle className="text-base text-green-800">📖 Versets du Jour</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Liste des versets ajoutés */}
                  {adminForm.versets.length > 0 && (
                    <div className="space-y-2">
                      <Label>Versets ajoutés ({adminForm.versets.length})</Label>
                      {adminForm.versets.map((v, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                          <span className="font-medium">
                            {v.livre} {v.chapitre}:{v.verset_debut}{v.verset_fin ? `-${v.verset_fin}` : ''}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => removeVerset(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ajouter un verset */}
                  <div className="border-t pt-4">
                    <Label className="mb-3 block">Ajouter un nouveau verset</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Select value={newVerset.livre} onValueChange={(v) => setNewVerset({...newVerset, livre: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Livre..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {livresBible.map(livre => (
                            <SelectItem key={livre} value={livre}>{livre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input 
                        type="number" 
                        placeholder="Chapitre"
                        value={newVerset.chapitre}
                        onChange={(e) => setNewVerset({...newVerset, chapitre: e.target.value})}
                      />
                      <Input 
                        type="number" 
                        placeholder="Verset début"
                        value={newVerset.verset_debut}
                        onChange={(e) => setNewVerset({...newVerset, verset_debut: e.target.value})}
                      />
                      <Input 
                        type="number" 
                        placeholder="Verset fin (opt.)"
                        value={newVerset.verset_fin}
                        onChange={(e) => setNewVerset({...newVerset, verset_fin: e.target.value})}
                      />
                    </div>
                    <Button variant="outline" onClick={addVerset} className="w-full mt-3">
                      + Ajouter ce verset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setShowAdminDialog(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleSaveContent} className="flex-1 bg-amber-600 hover:bg-amber-700">
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Stats */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📊 Statistiques - Le Pain du Jour ({new Date().getFullYear()})</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="table" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="table">📋 Tableau</TabsTrigger>
              <TabsTrigger value="clicks">📈 Clics</TabsTrigger>
              <TabsTrigger value="sondages">🥧 Sondages</TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="mt-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Détails par semaine</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-2 px-3 text-left">Semaine</th>
                          <th className="py-2 px-3 text-center">Clics Prière</th>
                          <th className="py-2 px-3 text-center">Clics Enseignement</th>
                          <th className="py-2 px-3 text-center">Réponses</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-500">Aucune donnée</td>
                          </tr>
                        ) : (
                          chartData.map((row, idx) => (
                            <tr key={idx} className={`border-t ${row.semaine === getCurrentWeek() ? 'bg-amber-50' : ''}`}>
                              <td className="py-2 px-3 font-medium">
                                {row.semaine} {row.semaine === getCurrentWeek() ? '(actuelle)' : ''}
                              </td>
                              <td className="py-2 px-3 text-center">{row.clics_priere}</td>
                              <td className="py-2 px-3 text-center">{row.clics_enseignement}</td>
                              <td className="py-2 px-3 text-center">{row.reponses}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clicks" className="mt-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">📈 Évolution des clics par semaine</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="semaine" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="clics_priere" fill="#8b5cf6" name="Clics Prière" />
                      <Bar dataKey="clics_enseignement" fill="#3b82f6" name="Clics Enseignement" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">📊 Évolution des réponses au sondage</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="semaine" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="reponses" stroke="#f59e0b" strokeWidth={2} name="Réponses" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sondages" className="mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">📖 Lectures effectuées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pieDataLecture.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={pieDataLecture}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {pieDataLecture.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-gray-500 py-8">Aucune donnée</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">🎬 Vidéos regardées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pieDataVideo.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={pieDataVideo}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {pieDataVideo.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-gray-500 py-8">Aucune donnée</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-4">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">📊 Résumé global</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{totalLecture.oui + totalVideo.oui}</p>
                      <p className="text-sm text-gray-600">Total "Oui"</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-amber-600">{totalLecture.partiel + totalVideo.partiel}</p>
                      <p className="text-sm text-gray-600">Total "Partiel"</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{totalLecture.non + totalVideo.non}</p>
                      <p className="text-sm text-gray-600">Total "Non"</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {chartData.reduce((acc, d) => acc + d.clics_priere + d.clics_enseignement, 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Clics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Button variant="outline" onClick={() => setShowStatsDialog(false)} className="w-full mt-4">
            Fermer
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PainDuJourPage;
