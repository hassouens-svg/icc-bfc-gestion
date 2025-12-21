import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Book, Youtube, Loader2, Clock, Eye, ThumbsUp, X, Calendar, Home, LogOut, BarChart3, Save, Plus, ExternalLink, Sparkles, FileText, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const PainDuJourAdminPage = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Content state
  const [selectedDate, setSelectedDate] = useState(today);
  const [livresBible, setLivresBible] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState([]);
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());
  const [fetchingYoutube, setFetchingYoutube] = useState({ priere: false, enseignement: false });
  const [videoInfo, setVideoInfo] = useState({ priere: null, enseignement: null });
  
  // Form state
  const [form, setForm] = useState({
    date: today,
    lien_priere: '',
    titre_priere: '',
    lien_enseignement: '',
    titre_enseignement: '',
    thumbnail_priere: '',
    thumbnail_enseignement: '',
    duration_priere: '',
    duration_enseignement: '',
    versets: [],
    resume: null,
    quiz: null
  });
  const [newVerset, setNewVerset] = useState({ livre: '', chapitre: '', verset_debut: '', verset_fin: '' });
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizStats, setQuizStats] = useState(null);

  // Check existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('pain_du_jour_token');
    const user = localStorage.getItem('pain_du_jour_user');
    if (token && user) {
      const userData = JSON.parse(user);
      if (['super_admin', 'pasteur', 'gestion_projet'].includes(userData.role)) {
        setIsAuthenticated(true);
        setCurrentUser(userData);
      }
    }
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadLivres();
      loadStats();
    }
  }, [isAuthenticated, statsYear]);

  // Load content when date changes
  useEffect(() => {
    if (isAuthenticated && selectedDate) {
      loadContent(selectedDate);
    }
  }, [isAuthenticated, selectedDate]);

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    setLoginLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Identifiants incorrects');
      }
      
      const allowedRoles = ['super_admin', 'pasteur', 'gestion_projet'];
      if (!allowedRoles.includes(data.user.role)) {
        toast.error('Accès réservé aux administrateurs (Pasteur, Super Admin, Gestion Projet)');
        return;
      }
      
      localStorage.setItem('pain_du_jour_token', data.token);
      localStorage.setItem('pain_du_jour_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      toast.success(`Bienvenue ${data.user.username} !`);
      
    } catch (error) {
      toast.error(error.message || 'Erreur de connexion');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pain_du_jour_token');
    localStorage.removeItem('pain_du_jour_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    toast.info('Déconnexion réussie');
  };

  const getToken = () => localStorage.getItem('pain_du_jour_token');

  const loadContent = async (date) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pain-du-jour/${date}`);
      const data = await response.json();
      setForm({
        date: data.date || date,
        lien_priere: data.lien_priere || '',
        titre_priere: data.titre_priere || '',
        lien_enseignement: data.lien_enseignement || '',
        titre_enseignement: data.titre_enseignement || '',
        thumbnail_priere: data.thumbnail_priere || '',
        thumbnail_enseignement: data.thumbnail_enseignement || '',
        duration_priere: data.duration_priere || '',
        duration_enseignement: data.duration_enseignement || '',
        versets: data.versets || [],
        resume: data.resume || null,
        quiz: data.quiz || null
      });
      
      // Charger les stats du quiz si disponible
      if (data.quiz) {
        loadQuizStats(date);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadQuizStats = async (date) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/pain-du-jour/quiz/stats/${date}`,
        { headers: { 'Authorization': `Bearer ${getToken()}` } }
      );
      const data = await response.json();
      setQuizStats(data);
    } catch (error) {
      console.error('Error loading quiz stats:', error);
    }
  };
  
  const generateResumeQuiz = async () => {
    if (!form.lien_enseignement) {
      toast.error('Veuillez d\'abord ajouter un lien YouTube pour l\'enseignement');
      return;
    }
    
    setGeneratingQuiz(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pain-du-jour/generate-resume-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          youtube_url: form.lien_enseignement,
          video_title: form.titre_enseignement
        })
      });
      
      if (!response.ok) throw new Error('Erreur lors de la génération');
      
      const data = await response.json();
      setForm(prev => ({
        ...prev,
        resume: data.resume,
        quiz: data.quiz
      }));
      
      toast.success('Résumé et quiz générés avec succès ! N\'oubliez pas d\'enregistrer.');
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error('Erreur lors de la génération du résumé et quiz');
    } finally {
      setGeneratingQuiz(false);
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
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/pain-du-jour/stats/${statsYear}`,
        { headers: { 'Authorization': `Bearer ${getToken()}` } }
      );
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

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
        
        if (type === 'priere') {
          setForm(prev => ({ 
            ...prev, 
            titre_priere: prev.titre_priere || data.title,
            thumbnail_priere: data.thumbnail_url,
            duration_priere: data.duration
          }));
        } else {
          setForm(prev => ({ 
            ...prev, 
            titre_enseignement: prev.titre_enseignement || data.title,
            thumbnail_enseignement: data.thumbnail_url,
            duration_enseignement: data.duration
          }));
        }
        
        toast.success(`Vidéo trouvée : ${data.title.substring(0, 40)}...`);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur lors de la récupération');
      }
    } catch (error) {
      console.error('Error fetching YouTube info:', error);
      toast.error('Erreur de connexion');
    } finally {
      setFetchingYoutube(prev => ({ ...prev, [type]: false }));
    }
  }, []);

  const handleSaveContent = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        ...form,
        date: selectedDate
      };
      console.log('Saving data:', dataToSave); // Debug
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pain-du-jour`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(dataToSave)
      });
      
      if (!response.ok) throw new Error('Erreur');
      toast.success('Contenu enregistré avec succès !');
      
      // Recharger le contenu pour confirmer
      await loadContent(selectedDate);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const addVerset = () => {
    if (!newVerset.livre) {
      toast.error('Sélectionnez au moins un livre');
      return;
    }
    setForm(prev => ({
      ...prev,
      versets: [...prev.versets, { ...newVerset }]
    }));
    setNewVerset({ livre: '', chapitre: '', verset_debut: '', verset_fin: '' });
    toast.success('Verset ajouté');
  };

  const removeVerset = (index) => {
    setForm(prev => ({
      ...prev,
      versets: prev.versets.filter((_, i) => i !== index)
    }));
  };

  // Prepare chart data
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
  })).sort((a, b) => parseInt(a.semaine.replace('S', '')) - parseInt(b.semaine.replace('S', '')));

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

  // Login Page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
            <CardTitle className="text-center text-xl">
              🍞 Le Pain du Jour - Administration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-center text-gray-600 text-sm mb-4">
              Accès réservé : Pasteur, Super Admin, Gestion Projet
            </p>
            
            <div className="space-y-2">
              <Label>Nom d'utilisateur</Label>
              <Input
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="Votre nom d'utilisateur"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <Input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="Votre mot de passe"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            <Button 
              onClick={handleLogin} 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loginLoading}
            >
              {loginLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Se connecter
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => navigate('/pain-du-jour')}
            >
              ← Retour à la page publique
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/pain-du-jour')}
                className="text-white hover:bg-white/20"
              >
                <Home className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">🍞 Administration - Le Pain du Jour</h1>
                <p className="text-blue-100 text-xs md:text-sm">Connecté : {currentUser?.username} ({currentUser?.role})</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              size="sm" 
              className="bg-white/20 hover:bg-white/30 border-white/30"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="content" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="content">📝 Contenu</TabsTrigger>
            <TabsTrigger value="versets">📖 Versets</TabsTrigger>
            <TabsTrigger value="quiz">🎯 Quiz</TabsTrigger>
            <TabsTrigger value="stats">📊 Stats</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            {/* Date Selector */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-amber-600" />
                    <Label>Date du contenu :</Label>
                  </div>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(today)}
                  >
                    Aujourd'hui
                  </Button>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </CardContent>
            </Card>

            {/* Prayer Video */}
            <Card className="border-purple-200">
              <CardHeader className="bg-purple-50 py-3">
                <CardTitle className="text-base text-purple-800 flex items-center gap-2">
                  🙏 Temps de Prière Prophétique
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lien YouTube</Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.lien_priere}
                        onChange={(e) => setForm({ ...form, lien_priere: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fetchYoutubeInfo(form.lien_priere, 'priere')}
                        disabled={fetchingYoutube.priere || !form.lien_priere}
                      >
                        {fetchingYoutube.priere ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Titre (auto-rempli ou personnalisé)</Label>
                    <Input
                      value={form.titre_priere}
                      onChange={(e) => setForm({ ...form, titre_priere: e.target.value })}
                      placeholder="Ex: Prière du matin - Semaine 51"
                    />
                  </div>
                </div>
                {videoInfo.priere && (
                  <div className="bg-purple-50 p-3 rounded-lg flex items-start gap-3">
                    <img src={videoInfo.priere.thumbnail_url} alt="Thumbnail" className="w-32 h-auto rounded" />
                    <div className="text-sm">
                      <p className="font-medium line-clamp-2">{videoInfo.priere.title}</p>
                      <p className="text-gray-500 text-xs mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {videoInfo.priere.duration}</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {videoInfo.priere.view_count.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {videoInfo.priere.like_count.toLocaleString()}</span>
                      </p>
                      <p className="text-gray-500 text-xs">{videoInfo.priere.channel_title}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Teaching Video */}
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50 py-3">
                <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                  📚 Enseignement du Jour
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lien YouTube</Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.lien_enseignement}
                        onChange={(e) => setForm({ ...form, lien_enseignement: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fetchYoutubeInfo(form.lien_enseignement, 'enseignement')}
                        disabled={fetchingYoutube.enseignement || !form.lien_enseignement}
                      >
                        {fetchingYoutube.enseignement ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Titre (auto-rempli ou personnalisé)</Label>
                    <Input
                      value={form.titre_enseignement}
                      onChange={(e) => setForm({ ...form, titre_enseignement: e.target.value })}
                      placeholder="Ex: La foi qui déplace les montagnes"
                    />
                  </div>
                </div>
                {videoInfo.enseignement && (
                  <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3">
                    <img src={videoInfo.enseignement.thumbnail_url} alt="Thumbnail" className="w-32 h-auto rounded" />
                    <div className="text-sm">
                      <p className="font-medium line-clamp-2">{videoInfo.enseignement.title}</p>
                      <p className="text-gray-500 text-xs mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {videoInfo.enseignement.duration}</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {videoInfo.enseignement.view_count.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {videoInfo.enseignement.like_count.toLocaleString()}</span>
                      </p>
                      <p className="text-gray-500 text-xs">{videoInfo.enseignement.channel_title}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={handleSaveContent} className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Enregistrer le contenu du {new Date(selectedDate).toLocaleDateString('fr-FR')}
            </Button>
          </TabsContent>

          {/* Versets Tab */}
          <TabsContent value="versets" className="space-y-4">
            <Card className="border-green-200">
              <CardHeader className="bg-green-50 py-3">
                <CardTitle className="text-base text-green-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Book className="h-5 w-5" />
                    Versets du {new Date(selectedDate).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="text-sm font-normal">({form.versets.length} verset{form.versets.length > 1 ? 's' : ''})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Current Versets */}
                {form.versets.length > 0 && (
                  <div className="space-y-2">
                    <Label>Versets ajoutés</Label>
                    <div className="space-y-2">
                      {form.versets.map((v, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                          <span className="font-medium">
                            📖 {v.livre} {v.chapitre ? `${v.chapitre}` : ''}{v.verset_debut ? `:${v.verset_debut}` : ''}{v.verset_fin ? `-${v.verset_fin}` : ''}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => removeVerset(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Verset */}
                <div className="border-t pt-4">
                  <Label className="mb-3 block font-medium">Ajouter un nouveau verset</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <Select value={newVerset.livre} onValueChange={(v) => setNewVerset({ ...newVerset, livre: v })}>
                      <SelectTrigger className="col-span-2 md:col-span-1">
                        <SelectValue placeholder="Livre..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {livresBible.map(livre => (
                          <SelectItem key={livre} value={livre}>{livre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="text"
                      placeholder="Chapitres (ex: 1, 2, 3)"
                      value={newVerset.chapitre}
                      onChange={(e) => setNewVerset({ ...newVerset, chapitre: e.target.value })}
                    />
                    <Input
                      type="text"
                      placeholder="Verset début"
                      value={newVerset.verset_debut}
                      onChange={(e) => setNewVerset({ ...newVerset, verset_debut: e.target.value })}
                    />
                    <Input
                      type="text"
                      placeholder="Verset fin (opt.)"
                      value={newVerset.verset_fin}
                      onChange={(e) => setNewVerset({ ...newVerset, verset_fin: e.target.value })}
                    />
                    <Button onClick={addVerset} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-1" /> Ajouter
                    </Button>
                  </div>
                </div>

                {/* Save Button */}
                <Button onClick={handleSaveContent} className="w-full bg-amber-600 hover:bg-amber-700 mt-4" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Enregistrer les versets
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz" className="space-y-4">
            <Card className="border-purple-200">
              <CardHeader className="bg-purple-50 py-3">
                <CardTitle className="text-base text-purple-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Résumé & Quiz - {new Date(selectedDate).toLocaleDateString('fr-FR')}
                  </span>
                  {form.quiz && (
                    <span className="text-sm font-normal bg-green-100 text-green-700 px-2 py-1 rounded">
                      ✅ Configuré
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Génération */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Générer depuis la transcription YouTube
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Le système récupère automatiquement les sous-titres de la vidéo YouTube, analyse la prédication (à partir de la 25e minute), et génère un résumé structuré avec un quiz de 10 questions.
                  </p>
                  {!form.lien_enseignement ? (
                    <p className="text-sm text-amber-600">⚠️ Ajoutez d'abord un lien YouTube dans l'onglet "Contenu"</p>
                  ) : (
                    <Button 
                      onClick={generateResumeQuiz} 
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={generatingQuiz}
                    >
                      {generatingQuiz ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Analyse de la transcription...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          {form.quiz ? 'Régénérer' : 'Générer'} le résumé et quiz
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Prévisualisation du résumé */}
                {form.resume && (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Résumé généré
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <strong>Titre:</strong> {form.resume.titre}
                      </div>
                      <div>
                        <strong>Résumé:</strong>
                        <p className="text-gray-700 mt-1">{form.resume.resume?.substring(0, 300)}...</p>
                      </div>
                      <div>
                        <strong>Points clés:</strong> {form.resume.points_cles?.length || 0}
                      </div>
                      <div>
                        <strong>Versets cités:</strong> {form.resume.versets_cites?.join(', ') || 'Aucun'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Prévisualisation du quiz */}
                {form.quiz && (
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h4 className="font-medium text-indigo-800 mb-3 flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Quiz généré ({form.quiz.length} questions)
                    </h4>
                    <div className="space-y-2 text-sm max-h-60 overflow-y-auto">
                      {form.quiz.map((q, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border">
                          <p className="font-medium text-gray-800">{idx + 1}. {q.question}</p>
                          <p className="text-green-600 text-xs mt-1">
                            ✓ {q.options[q.correct_index]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistiques du quiz */}
                {quizStats && quizStats.total_participants > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Résultats du quiz
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{quizStats.total_participants}</p>
                        <p className="text-xs text-gray-600">Participants</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{quizStats.average_score}/10</p>
                        <p className="text-xs text-gray-600">Score moyen</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg col-span-2 md:col-span-1">
                        <p className="text-2xl font-bold text-purple-600">
                          {Math.round((quizStats.average_score / 10) * 100)}%
                        </p>
                        <p className="text-xs text-gray-600">Réussite moyenne</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                {form.quiz && (
                  <Button onClick={handleSaveContent} className="w-full bg-purple-600 hover:bg-purple-700" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Enregistrer le résumé et quiz
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            {/* Year Selector */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <BarChart3 className="h-5 w-5 text-amber-600" />
                  <Label>Année :</Label>
                  <Select value={statsYear.toString()} onValueChange={(v) => setStatsYear(parseInt(v))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={loadStats}>
                    Actualiser
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {chartData.reduce((acc, d) => acc + d.clics_priere, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Clics Prière</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {chartData.reduce((acc, d) => acc + d.clics_enseignement, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Clics Enseignement</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {chartData.reduce((acc, d) => acc + d.reponses, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Réponses Sondage</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-amber-600">
                    {chartData.length}
                  </p>
                  <p className="text-sm text-gray-600">Semaines actives</p>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">📋 Détails par semaine</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-left">Semaine</th>
                        <th className="py-3 px-4 text-center">Clics Prière</th>
                        <th className="py-3 px-4 text-center">Clics Enseignement</th>
                        <th className="py-3 px-4 text-center">Réponses</th>
                        <th className="py-3 px-4 text-center">Lecture Oui</th>
                        <th className="py-3 px-4 text-center">Vidéo Oui</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500">Aucune donnée pour {statsYear}</td>
                        </tr>
                      ) : (
                        chartData.map((row, idx) => (
                          <tr key={idx} className="border-t hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{row.semaine}</td>
                            <td className="py-3 px-4 text-center">{row.clics_priere}</td>
                            <td className="py-3 px-4 text-center">{row.clics_enseignement}</td>
                            <td className="py-3 px-4 text-center">{row.reponses}</td>
                            <td className="py-3 px-4 text-center text-green-600">{row.lecture_oui}</td>
                            <td className="py-3 px-4 text-center text-green-600">{row.video_oui}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">📈 Clics par semaine</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="semaine" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="clics_priere" fill="#8b5cf6" name="Prière" />
                      <Bar dataKey="clics_enseignement" fill="#3b82f6" name="Enseignement" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">📊 Réponses sondage</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="semaine" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="reponses" stroke="#f59e0b" strokeWidth={2} name="Réponses" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Pie Charts */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">📖 Lectures effectuées</CardTitle>
                </CardHeader>
                <CardContent>
                  {pieDataLecture.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieDataLecture}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={70}
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
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieDataVideo}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={70}
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PainDuJourAdminPage;
