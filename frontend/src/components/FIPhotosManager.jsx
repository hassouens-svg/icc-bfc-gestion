import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Upload, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

const FIPhotosManager = ({ fiId, initialPhotos = [] }) => {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    setPhotos(initialPhotos || []);
  }, [initialPhotos]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (photos.length >= 3) {
      toast.error('Maximum 3 photos autorisées');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/fi/upload-photo`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur upload:', errorText);
        throw new Error('Upload échoué');
      }
      
      const data = await response.json();
      const newPhotos = [...photos, data.photo_url];
      
      // Mise à jour sur le serveur
      await updatePhotos(newPhotos);
      
      setPhotos(newPhotos);
      toast.success('Photo ajoutée avec succès');
      
      // Reset input
      e.target.value = '';
    } catch (error) {
      console.error('Erreur complète:', error);
      const errorMsg = error.message || 'Erreur lors de l\'upload';
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const updatePhotos = async (newPhotos) => {
    try {
      if (!fiId) {
        throw new Error('Aucune FI assignée');
      }
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/fi/familles-impact/${fiId}/photos`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newPhotos)
        }
      );
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Erreur mise à jour:', error);
        throw new Error(`Mise à jour échouée: ${error}`);
      }
    } catch (error) {
      console.error('Erreur updatePhotos:', error);
      throw error;
    }
  };

  const removePhoto = async (index) => {
    if (!window.confirm('Supprimer cette photo ?')) return;
    
    const newPhotos = photos.filter((_, i) => i !== index);
    
    try {
      await updatePhotos(newPhotos);
      setPhotos(newPhotos);
      if (currentPhotoIndex >= newPhotos.length) {
        setCurrentPhotoIndex(Math.max(0, newPhotos.length - 1));
      }
      toast.success('Photo supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Carousel automatique
  useEffect(() => {
    if (photos.length > 1) {
      const interval = setInterval(() => {
        setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [photos]);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Photos de la FI ({photos.length}/3)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Carousel principal */}
        {photos.length > 0 ? (
          <div className="relative">
            <div className="h-64 bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={photos[currentPhotoIndex]} 
                alt={`Photo ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
            
            {photos.length > 1 && (
              <>
                {/* Indicateurs */}
                <div className="flex justify-center gap-2 mt-3">
                  {photos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhotoIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentPhotoIndex 
                          ? 'bg-purple-600 w-6' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Photo ${idx + 1}`}
                    />
                  ))}
                </div>
                
                {/* Boutons navigation */}
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={prevPhoto}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={nextPhoto}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="h-64 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400">
            <ImageIcon className="w-16 h-16 mb-2" />
            <p className="text-sm">Aucune photo ajoutée</p>
            <p className="text-xs mt-1">Ajoutez jusqu'à 3 photos de votre FI</p>
          </div>
        )}

        {/* Miniatures et gestion */}
        <div className="space-y-4">
          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <img 
                    src={photo} 
                    className={`w-20 h-20 object-cover rounded cursor-pointer border-2 transition ${
                      idx === currentPhotoIndex 
                        ? 'border-purple-500 shadow-lg' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => setCurrentPhotoIndex(idx)}
                    alt={`Miniature ${idx + 1}`}
                  />
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg"
                    title="Supprimer cette photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload nouvelle photo */}
          {photos.length < 3 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Ajouter une photo ({photos.length}/3)
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading || photos.length >= 3}
                className="cursor-pointer"
              />
              {uploading && (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Upload en cours...
                </p>
              )}
              <p className="text-xs text-gray-500">
                Formats acceptés : JPG, PNG, GIF. Taille max : 5 MB
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FIPhotosManager;