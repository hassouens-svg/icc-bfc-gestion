import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Book, Play, Settings, CheckCircle, BarChart3, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const PainDuJourPage = () => {
  const user = getUser();
  const today = new Date().toISOString().split('T')[0];
  const [content, setContent] = useState({ date: today, versets: [] });
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [livresBible, setLivresBible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [stats, setStats] = useState([]);
  
  // Admin form state
  const [adminForm, setAdminForm] = useState({
    date: today,
    lien_priere: '',
    titre_priere: '',
    lien_enseignement: '',
    titre_enseignement: '',
    versets: []
  });
  const [newVerset, setNewVerset] = useState({ livre: '', chapitre: '', verset_debut: '', verset_fin: '' });
  
  // Sondage state
  const [sondage, setSondage] = useState({ lecture: '', video: '' });

  // Permissions
  const canEdit = user?.role && ['super_admin', 'pasteur', 'gestion_projet'].includes(user.role);

  useEffect(() => {
    loadContent();
    loadLivres();
  }, []);

  const loadContent = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pain-du-jour/today`);
      const data = await response.json();
      setContent(data);
      if (data.date) {
        setAdminForm({
          date: data.date || today,
          lien_priere: data.lien_priere || '',
          titre_priere: data.titre_priere || '',
          lien_enseignement: data.lien_enseignement || '',
          titre_enseignement: data.titre_enseignement || '',
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
      loadContent();
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
        body: JSON.stringify({ type, date: today })
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
          date: today,
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
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]{11})/);
    return match ? match[1] : null;
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return `S${Math.ceil(diff / oneWeek)}`;
  };

  // Préparer les données pour les graphiques
  const chartData = stats.map(s => ({
    semaine: s.semaine,
    clics_priere: s.clicks_priere || 0,
    clics_enseignement: s.clicks_enseignement || 0,
    reponses: s.total_reponses || 0
  })).sort((a, b) => {
    const numA = parseInt(a.semaine.replace('S', ''));
    const numB = parseInt(b.semaine.replace('S', ''));
    return numA - numB;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-6 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="https://customer-assets.emergentagent.com/job_dijon-icc-hub/artifacts/foeikpvk_IMG_2590.png"
                alt="ICC Logo"
                className="w-16 h-16 rounded-full bg-white p-1 shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-bold">🍞 Le Pain du Jour</h1>
                <p className="text-amber-100 text-sm">Nourriture spirituelle quotidienne</p>
              </div>
            </div>
            {canEdit && (
              <Button onClick={handleAdminOpen} variant="outline" className="bg-white/20 hover:bg-white/30 border-white/30">
                <Settings className="h-4 w-4 mr-2" />
                Mettre à jour
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Verset d'introduction */}
        <Card className="bg-white/80 backdrop-blur border-amber-200 shadow-xl">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">📖</div>
            <blockquote className="text-xl font-serif italic text-amber-800 mb-3">
              "Donne-nous aujourd'hui notre pain quotidien"
            </blockquote>
            <p className="text-sm text-gray-600 font-medium mb-4">— Matthieu 6:11</p>
            <p className="text-gray-700 text-sm leading-relaxed max-w-2xl mx-auto">
              Jésus ne parlait pas seulement du pain physique, de la nourriture matérielle. Il parlait surtout 
              de <strong>nourriture spirituelle</strong>, de la Parole de Dieu et des enseignements divins. 
              Car c'est cette nourriture qui fortifie notre être intérieur, qui édifie notre âme et notre esprit. 
              Chaque jour, prenons le temps de nous nourrir de cette manne céleste.
            </p>
          </CardContent>
        </Card>

        {/* Date du jour */}
        <div className="text-center">
          <p className="text-lg text-amber-800 font-medium">
            📅 {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Temps de prière prophétique */}
        <Card className="bg-white shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
            <CardTitle className="flex items-center gap-2">
              🙏 Temps de Prière Prophétique
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {content.lien_priere ? (
              <div className="space-y-4">
                <p className="font-medium text-gray-800">{content.titre_priere || 'Temps de prière du jour'}</p>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {getYouTubeId(content.lien_priere) ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(content.lien_priere)}`}
                      title="Temps de prière"
                      className="w-full h-full"
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
                  <Play className="h-4 w-4 mr-2" />
                  Regarder sur YouTube
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun temps de prière configuré pour aujourd'hui</p>
            )}
          </CardContent>
        </Card>

        {/* Enseignements du jour */}
        <Card className="bg-white shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
            <CardTitle className="flex items-center gap-2">
              📚 Enseignements du Jour
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {content.lien_enseignement ? (
              <div className="space-y-4">
                <p className="font-medium text-gray-800">{content.titre_enseignement || 'Enseignement du jour'}</p>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {getYouTubeId(content.lien_enseignement) ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(content.lien_enseignement)}`}
                      title="Enseignement"
                      className="w-full h-full"
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
                  <Play className="h-4 w-4 mr-2" />
                  Regarder sur YouTube
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun enseignement configuré pour aujourd'hui</p>
            )}
          </CardContent>
        </Card>

        {/* Versets du jour */}
        <Card className="bg-white shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Versets du Jour
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {content.versets && content.versets.length > 0 ? (
              <table className="w-full">
                <thead className="bg-green-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-green-800 text-lg">Livre</th>
                    <th className="text-center py-4 px-6 font-semibold text-green-800 text-lg">Chapitre</th>
                    <th className="text-center py-4 px-6 font-semibold text-green-800 text-lg">Versets</th>
                  </tr>
                </thead>
                <tbody>
                  {content.versets.map((v, idx) => (
                    <tr key={idx} className="border-t hover:bg-green-50/50">
                      <td className="py-4 px-6 font-medium text-gray-800 text-lg">{v.livre}</td>
                      <td className="py-4 px-6 text-center text-gray-700 text-lg">{v.chapitre}</td>
                      <td className="py-4 px-6 text-center text-gray-700 text-lg">
                        {v.verset_fin ? `${v.verset_debut} - ${v.verset_fin}` : v.verset_debut}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun verset configuré pour aujourd'hui</p>
            )}
          </CardContent>
        </Card>

        {/* Sondage */}
        <Card className="bg-white shadow-lg border-2 border-amber-200">
          <CardHeader className="bg-amber-50">
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              📊 Votre Participation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-xl font-medium text-green-700">Merci pour votre participation !</p>
                <p className="text-gray-500 mt-2">Vos réponses ont été enregistrées.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Avez-vous pu faire les lectures du jour ?</Label>
                  <RadioGroup value={sondage.lecture} onValueChange={(v) => setSondage({...sondage, lecture: v})}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Oui" id="lecture-oui" />
                      <Label htmlFor="lecture-oui">Oui</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Non" id="lecture-non" />
                      <Label htmlFor="lecture-non">Non</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Partiellement" id="lecture-partiel" />
                      <Label htmlFor="lecture-partiel">Partiellement</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Avez-vous pu regarder les vidéos ?</Label>
                  <RadioGroup value={sondage.video} onValueChange={(v) => setSondage({...sondage, video: v})}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Oui" id="video-oui" />
                      <Label htmlFor="video-oui">Oui</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Non" id="video-non" />
                      <Label htmlFor="video-non">Non</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Pas totalement" id="video-partiel" />
                      <Label htmlFor="video-partiel">Pas totalement</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button onClick={handleSubmitSondage} className="w-full bg-amber-600 hover:bg-amber-700">
                  Enregistrer mes réponses
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center py-8 text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} ICC BFC-ITALIE - Le Pain du Jour</p>
        </footer>
      </main>

      {/* Dialog Admin - Mise à jour */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>⚙️ Mettre à jour le contenu</span>
              <Button variant="outline" onClick={() => setShowStatsDialog(true)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Voir les stats
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Date */}
            <div className="space-y-2">
              <Label>Date du contenu</Label>
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
                  <Label>Titre</Label>
                  <Input 
                    value={adminForm.titre_priere} 
                    onChange={(e) => setAdminForm({...adminForm, titre_priere: e.target.value})}
                    placeholder="Ex: Prière du matin - Semaine 51"
                  />
                </div>
                <div>
                  <Label>Lien YouTube</Label>
                  <Input 
                    value={adminForm.lien_priere} 
                    onChange={(e) => setAdminForm({...adminForm, lien_priere: e.target.value})}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Enseignement */}
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50 py-3">
                <CardTitle className="text-base text-blue-800">📚 Enseignement du Jour</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label>Titre</Label>
                  <Input 
                    value={adminForm.titre_enseignement} 
                    onChange={(e) => setAdminForm({...adminForm, titre_enseignement: e.target.value})}
                    placeholder="Ex: La foi qui déplace les montagnes"
                  />
                </div>
                <div>
                  <Label>Lien YouTube</Label>
                  <Input 
                    value={adminForm.lien_enseignement} 
                    onChange={(e) => setAdminForm({...adminForm, lien_enseignement: e.target.value})}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Versets */}
            <Card className="border-green-200">
              <CardHeader className="bg-green-50 py-3">
                <CardTitle className="text-base text-green-800">📖 Versets du Jour</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Liste des versets ajoutés */}
                {adminForm.versets.length > 0 && (
                  <div className="space-y-2">
                    {adminForm.versets.map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-green-50 p-2 rounded">
                        <span>{v.livre} {v.chapitre}:{v.verset_debut}{v.verset_fin ? `-${v.verset_fin}` : ''}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeVerset(idx)} className="text-red-500">×</Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ajouter un verset */}
                <div className="grid grid-cols-4 gap-2">
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
                <Button variant="outline" onClick={addVerset} className="w-full">
                  + Ajouter ce verset
                </Button>
              </CardContent>
            </Card>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAdminDialog(false)} className="flex-1">
                Annuler
              </Button>
              <Button onClick={handleSaveContent} className="flex-1 bg-amber-600 hover:bg-amber-700">
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Stats */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📊 Statistiques - Le Pain du Jour ({new Date().getFullYear()})</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Tableau des stats */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Tableau des clics par semaine</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-4 text-left">Semaine</th>
                      <th className="py-2 px-4 text-center">Clics Prière</th>
                      <th className="py-2 px-4 text-center">Clics Enseignement</th>
                      <th className="py-2 px-4 text-center">Réponses Sondage</th>
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
                          <td className="py-2 px-4 font-medium">{row.semaine} {row.semaine === getCurrentWeek() ? '(actuelle)' : ''}</td>
                          <td className="py-2 px-4 text-center">{row.clics_priere}</td>
                          <td className="py-2 px-4 text-center">{row.clics_enseignement}</td>
                          <td className="py-2 px-4 text-center">{row.reponses}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Graphique des clics */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">📈 Évolution des clics par semaine</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="semaine" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="clics_priere" fill="#8b5cf6" name="Clics Prière" />
                    <Bar dataKey="clics_enseignement" fill="#3b82f6" name="Clics Enseignement" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Graphique des réponses */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">📊 Évolution des réponses au sondage par semaine</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="semaine" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="reponses" stroke="#f59e0b" strokeWidth={2} name="Réponses" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={() => setShowStatsDialog(false)} className="w-full">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PainDuJourPage;
