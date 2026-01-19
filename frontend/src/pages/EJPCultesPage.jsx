import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { ArrowLeft, Music, Upload, Play, Pause, Trash2, Plus, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

const EJPCultesPage = () => {
  const navigate = useNavigate();
  const [cultes, setCultes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [audioError, setAudioError] = useState(null);
  const audioRef = useRef(null);
  
  const [formData, setFormData] = useState({
    date: '',
    titre: '',
    orateur: '',
    audioFile: null
  });

  useEffect(() => {
    loadCultes();
  }, []);

  const loadCultes = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ejp/cultes`);
      if (response.ok) {
        const data = await response.json();
        setCultes(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('audio/')) {
        toast.error('Veuillez sélectionner un fichier audio (MP3, WAV, etc.)');
        return;
      }
      setFormData({ ...formData, audioFile: file });
    }
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.titre || !formData.orateur) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (!formData.audioFile) {
      toast.error('Veuillez sélectionner un fichier audio');
      return;
    }

    setUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('date', formData.date);
      formDataToSend.append('titre', formData.titre);
      formDataToSend.append('orateur', formData.orateur);
      formDataToSend.append('audio', formData.audioFile);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ejp/cultes`, {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        toast.success('Culte ajouté avec succès');
        setShowAddDialog(false);
        setFormData({ date: '', titre: '', orateur: '', audioFile: null });
        loadCultes();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce culte ?')) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ejp/cultes/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast.success('Culte supprimé');
        loadCultes();
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const togglePlay = (culte) => {
    if (playingId === culte.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = `${process.env.REACT_APP_BACKEND_URL}/api/ejp/cultes/${culte.id}/audio`;
        audioRef.current.play();
        setPlayingId(culte.id);
      }
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Audio element caché */}
      <audio 
        ref={audioRef} 
        onEnded={() => setPlayingId(null)}
        onError={() => {
          toast.error('Erreur de lecture audio');
          setPlayingId(null);
        }}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/ejp')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Cultes EJP</h1>
                <p className="text-sm text-gray-500">Audios des cultes</p>
              </div>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="bg-pink-600 hover:bg-pink-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        ) : cultes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Music className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucun culte enregistré</p>
              <Button onClick={() => setShowAddDialog(true)} className="mt-4 bg-pink-600 hover:bg-pink-700">
                Ajouter le premier culte
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {cultes.map((culte) => (
              <Card key={culte.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Bouton Play */}
                    <button
                      onClick={() => togglePlay(culte)}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                        playingId === culte.id 
                          ? 'bg-pink-600 text-white' 
                          : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                      }`}
                    >
                      {playingId === culte.id ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6 ml-1" />
                      )}
                    </button>
                    
                    {/* Infos */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{culte.titre}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(culte.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {culte.orateur}
                        </span>
                      </div>
                    </div>
                    
                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(culte.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Ajouter */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un culte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date du culte</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Titre</Label>
              <Input
                placeholder="Ex: Culte de louange"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              />
            </div>
            <div>
              <Label>Nom de celui qui apporte la parole</Label>
              <Input
                placeholder="Ex: Pasteur Jean"
                value={formData.orateur}
                onChange={(e) => setFormData({ ...formData, orateur: e.target.value })}
              />
            </div>
            <div>
              <Label>Fichier audio (MP3, WAV...)</Label>
              <div className="mt-2">
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-colors">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-500">
                    {formData.audioFile ? formData.audioFile.name : 'Cliquez pour sélectionner'}
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={uploading}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {uploading ? 'Envoi...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EJPCultesPage;
