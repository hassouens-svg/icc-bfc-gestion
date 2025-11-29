# 📸 Guide d'implémentation complet - Photos et Numéro Pilote

## ✅ Backend TERMINÉ

### Endpoints disponibles

```
POST /api/visitors/upload-photo - Upload photo visiteur
POST /api/fi/upload-photo - Upload photo FI  
PUT /api/fi/familles-impact/{fi_id}/photos - Mettre à jour photos FI (pilote)
GET /api/uploads/{filename} - Récupérer image
```

### Modèles mis à jour
- `Visitor` : `photo_url` ajouté
- `FamilleImpact` : `photos` (array max 3) ajouté
- `User` : `telephone` existe déjà

---

## 🎯 Frontend à implémenter

### 1. Page Gestion des Accès (Création compte pilote)

**Fichier** : `/app/frontend/src/pages/GestionAccesPage.jsx`

**Modification** : Rendre le champ téléphone OBLIGATOIRE pour les pilotes

**Code à ajouter** :

```jsx
// Dans le formulaire de création d'utilisateur, vers la ligne 150-200

// Chercher où le formulaire affiche les champs

<div>
  <Label>Téléphone {formData.role === 'pilote_fi' && <span className="text-red-500">*</span>}</Label>
  <Input
    type="tel"
    placeholder="0612345678"
    value={formData.telephone || ''}
    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
    required={formData.role === 'pilote_fi'}
  />
  {formData.role === 'pilote_fi' && !formData.telephone && (
    <p className="text-xs text-red-500 mt-1">Le numéro de téléphone est obligatoire pour les pilotes</p>
  )}
</div>

// Dans la fonction de soumission, ajouter validation :

const handleSubmit = async () => {
  // Validation pour pilote
  if (formData.role === 'pilote_fi' && !formData.telephone) {
    toast.error('Le numéro de téléphone est obligatoire pour les pilotes');
    return;
  }
  
  // ... reste du code
};
```

---

### 2. Page Espace Pilote FI (Ajout photos)

**Fichier** : `/app/frontend/src/pages/PiloteFIPage.jsx` (ou similaire)

**Créer si n'existe pas** : Page dédiée pour l'espace pilote

**Code complet** :

```jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';

const PiloteFISpace = () => {
  const [fi, setFi] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    loadMyFI();
  }, []);

  const loadMyFI = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/fi/familles-impact`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      if (!response.ok) throw new Error('Erreur chargement');
      
      const data = await response.json();
      if (data.length > 0) {
        setFi(data[0]);
        setPhotos(data[0].photos || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur chargement de votre FI');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (photos.length >= 3) {
      toast.error('Maximum 3 photos autorisées');
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
      
      if (!response.ok) throw new Error('Upload échoué');
      
      const data = await response.json();
      const newPhotos = [...photos, data.photo_url];
      
      // Mise à jour sur le serveur
      await updatePhotos(newPhotos);
      
      setPhotos(newPhotos);
      toast.success('Photo ajoutée avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const updatePhotos = async (newPhotos) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/fi/familles-impact/${fi.id}/photos`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newPhotos)
        }
      );
      
      if (!response.ok) throw new Error('Mise à jour échouée');
    } catch (error) {
      throw error;
    }
  };

  const removePhoto = async (index) => {
    if (!window.confirm('Supprimer cette photo ?')) return;
    
    const newPhotos = photos.filter((_, i) => i !== index);
    
    try {
      await updatePhotos(newPhotos);
      setPhotos(newPhotos);
      toast.success('Photo supprimée');
    } catch (error) {
      toast.error('Erreur suppression');
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

  if (!fi) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Chargement de votre FI...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mon Espace - {fi.nom}</h1>

      {/* Carousel Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Photos de la FI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Affichage carousel */}
          {photos.length > 0 ? (
            <div className="relative">
              <div className="h-64 bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={photos[currentPhotoIndex]} 
                  alt={`Photo ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {photos.length > 1 && (
                <>
                  {/* Indicateurs */}
                  <div className="flex justify-center gap-2 mt-2">
                    {photos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPhotoIndex(idx)}
                        className={`w-2 h-2 rounded-full transition ${
                          idx === currentPhotoIndex ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Boutons navigation */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)}
                  >
                    <ChevronRight />
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Aucune photo ajoutée</p>
            </div>
          )}

          {/* Miniatures et gestion */}
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <img 
                    src={photo} 
                    className="w-20 h-20 object-cover rounded cursor-pointer border-2 border-gray-200 hover:border-purple-500"
                    onClick={() => setCurrentPhotoIndex(idx)}
                  />
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Upload nouvelle photo */}
            {photos.length < 3 && (
              <div>
                <Label>Ajouter une photo ({photos.length}/3)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading || photos.length >= 3}
                  className="cursor-pointer"
                />
                {uploading && <p className="text-sm text-gray-500 mt-1">Upload en cours...</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Infos FI */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Nom :</strong> {fi.nom}</p>
            <p><strong>Adresse :</strong> {fi.adresse || 'Non renseignée'}</p>
            <p><strong>Horaires :</strong> {fi.heure_debut} - {fi.heure_fin}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PiloteFISpace;
```

---

### 3. Page Détails Visiteur (Ajout photo)

**Fichier** : `/app/frontend/src/pages/VisitorDetailPage.jsx` (ou similaire)

**Modification** : Ajouter champ photo dans le formulaire

```jsx
// Dans le formulaire de modification du visiteur

const [photoUploading, setPhotoUploading] = useState(false);

const handlePhotoUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  setPhotoUploading(true);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/visitors/upload-photo`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      }
    );
    
    if (!response.ok) throw new Error('Upload échoué');
    
    const data = await response.json();
    setVisitorData({...visitorData, photo_url: data.photo_url});
    toast.success('Photo ajoutée');
  } catch (error) {
    console.error('Erreur:', error);
    toast.error('Erreur lors de l\'upload');
  } finally {
    setPhotoUploading(false);
  }
};

// Dans le JSX, ajouter dans le formulaire :

<div className="space-y-2">
  <Label>Photo du visiteur</Label>
  
  {visitorData.photo_url && (
    <div className="relative inline-block">
      <img 
        src={visitorData.photo_url} 
        className="w-32 h-32 object-cover rounded-lg"
        alt={`${visitorData.firstname} ${visitorData.lastname}`}
      />
      <button
        onClick={() => setVisitorData({...visitorData, photo_url: null})}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )}
  
  <Input
    type="file"
    accept="image/*"
    onChange={handlePhotoUpload}
    disabled={photoUploading}
  />
  
  {photoUploading && <p className="text-sm text-gray-500">Upload en cours...</p>}
</div>
```

---

### 4. Liste Visiteurs (Affichage photo)

**Fichier** : Page qui affiche la liste des visiteurs

**Modification** : Ajouter colonne photo

```jsx
// Dans le tableau des visiteurs, ajouter une colonne

<TableHead>Photo</TableHead>

// Dans les lignes du tableau :

<TableCell>
  {visiteur.photo_url ? (
    <img 
      src={visiteur.photo_url} 
      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
      alt={`${visiteur.firstname} ${visiteur.lastname}`}
    />
  ) : (
    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
      <span className="text-purple-600 font-medium text-sm">
        {visiteur.firstname?.[0]}{visiteur.lastname?.[0]}
      </span>
    </div>
  )}
</TableCell>
```

---

### 5. Vue Publique FI (Affichage photos et téléphone pilote)

**Fichier** : Page publique affichant les FI disponibles

**Modification** : Afficher carousel et numéro

```jsx
// Dans la carte d'affichage d'une FI

const [currentPhoto, setCurrentPhoto] = useState(0);

useEffect(() => {
  if (fi.photos && fi.photos.length > 1) {
    const interval = setInterval(() => {
      setCurrentPhoto((prev) => (prev + 1) % fi.photos.length);
    }, 3000);
    return () => clearInterval(interval);
  }
}, [fi.photos]);

// Dans le JSX de la carte FI :

<Card className="overflow-hidden">
  {/* Photos en haut */}
  {fi.photos && fi.photos.length > 0 ? (
    <div className="relative h-48">
      <img 
        src={fi.photos[currentPhoto]} 
        className="w-full h-full object-cover"
        alt={fi.nom}
      />
      {fi.photos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {fi.photos.map((_, idx) => (
            <div 
              key={idx}
              className={`w-2 h-2 rounded-full ${
                idx === currentPhoto ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  ) : (
    <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
      <Home className="w-12 h-12 text-purple-300" />
    </div>
  )}
  
  <CardContent className="p-4">
    <h3 className="font-bold text-lg">{fi.nom}</h3>
    <p className="text-sm text-gray-600 mt-1">📍 {fi.adresse}</p>
    
    {/* Récupérer et afficher le numéro du pilote */}
    {fi.pilote_phone && (
      <p className="text-sm text-purple-600 mt-2">
        📞 Contact : {fi.pilote_phone}
      </p>
    )}
    
    <p className="text-sm text-gray-600 mt-1">
      🕐 {fi.heure_debut} - {fi.heure_fin}
    </p>
  </CardContent>
</Card>
```

**Note** : Pour afficher le numéro du pilote, il faut récupérer l'utilisateur pilote via son ID. Ajouter dans l'endpoint `/api/fi/familles-impact` ou `/api/public/fi/all` :

```python
# Dans le backend, modifier l'endpoint pour inclure le numéro du pilote

@api_router.get("/public/fi/all")
async def get_all_fi_public(ville: Optional[str] = None):
    query = {}
    if ville:
        query["ville"] = ville
    
    fis = await db.familles_impact.find(query, {"_id": 0}).to_list(length=None)
    
    # Pour chaque FI, récupérer le numéro du pilote
    for fi in fis:
        if fi.get("pilote_ids") and len(fi["pilote_ids"]) > 0:
            pilote = await db.users.find_one(
                {"id": fi["pilote_ids"][0]},
                {"_id": 0, "telephone": 1}
            )
            if pilote and pilote.get("telephone"):
                fi["pilote_phone"] = pilote["telephone"]
    
    return [fi for fi in fis if fi.get("adresse")]
```

---

## 📊 Récapitulatif

### Backend ✅ TERMINÉ
- [x] Champ `photo_url` pour visiteurs
- [x] Champ `photos` (array) pour FI
- [x] Champ `telephone` pour users (déjà existant)
- [x] Endpoint upload photo visiteur
- [x] Endpoint upload photo FI
- [x] Endpoint mise à jour photos FI (pilote)

### Frontend À FAIRE
- [ ] Rendre téléphone obligatoire pour pilotes (GestionAccesPage)
- [ ] Page espace pilote avec gestion photos
- [ ] Formulaire visiteur avec upload photo
- [ ] Liste visiteurs avec colonne photo
- [ ] Carte FI publique avec carousel et numéro

---

## 🎯 Ordre d'implémentation recommandé

1. **GestionAccesPage** - Téléphone obligatoire pilote (10 min)
2. **Espace Pilote** - Gestion photos FI (30 min)
3. **Visiteur Detail** - Upload photo (15 min)
4. **Liste Visiteurs** - Afficher photo (10 min)
5. **Vue Publique FI** - Carousel + numéro (20 min)

**Total estimé** : 1h30

---

## 🔧 Backend supplémentaire nécessaire

Ajouter le numéro du pilote dans les réponses API des FI :

```python
# Modifier /api/public/fi/all pour inclure pilote_phone
# Code fourni ci-dessus dans la section 5
```

---

**Le backend est 100% opérationnel. Il ne reste que l'implémentation frontend !** 🚀
