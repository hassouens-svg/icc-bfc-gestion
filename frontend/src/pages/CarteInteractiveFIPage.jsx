import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { MapPin, Home, Clock, Phone, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '../utils/api';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom house icon for FI markers
const houseIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  className: 'fi-house-icon'
});

const CarteInteractiveFIPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [loading, setLoading] = useState(true);
  const [fisWithCoords, setFisWithCoords] = useState([]);
  const [selectedFI, setSelectedFI] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectedCity, setSelectedCity] = useState('all');
  const [cities, setCities] = useState([]);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!['superviseur_fi', 'super_admin', 'pasteur', 'responsable_eglise', 'responsable_secteur'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    loadFIsWithCoords();
  }, [user, navigate]);

  // Fonction pour géocoder une adresse avec Nominatim
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Erreur géocodage:', error);
      return null;
    }
  };

  const loadFIsWithCoords = async () => {
    setLoading(true);
    try {
      // Récupérer toutes les FI avec adresses
      const response = await fetch(`${backendUrl}/api/public/fi/all`);
      const fis = await response.json();
      
      if (fis.length === 0) {
        toast.warning('Aucune Famille d\'Impact trouvée avec adresse');
        setLoading(false);
        return;
      }

      // Extract unique cities (filter out empty values)
      const uniqueCities = [...new Set(fis.map(fi => fi.ville).filter(ville => ville && ville.trim() !== ''))].sort();
      setCities(uniqueCities);
      
      // Filter FIs that have coordinates (geocoded in backend)
      const fisWithCoords = fis.filter(fi => fi.latitude && fi.longitude).map(fi => ({
        ...fi,
        lat: fi.latitude,
        lon: fi.longitude
      }));
      
      // For FIs without coordinates, geocode them on the fly (fallback)
      const fisWithoutCoords = fis.filter(fi => !fi.latitude || !fi.longitude);
      
      if (fisWithoutCoords.length > 0) {
        toast.info(`Géolocalisation de ${fisWithoutCoords.length} FI(s) en cours...`);
        
        for (const fi of fisWithoutCoords) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const coords = await geocodeAddress(fi.adresse);
          if (coords) {
            fisWithCoords.push({
              ...fi,
              lat: coords.lat,
              lon: coords.lon
            });
          }
        }
      }
      
      if (fisWithCoords.length === 0) {
        toast.error('Impossible de géolocaliser les FI');
      } else {
        toast.success(`${fisWithCoords.length} Famille(s) d'Impact chargée(s)!`);
        setFisWithCoords(fisWithCoords);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des FI');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (fi) => {
    setSelectedFI(fi);
    setCurrentPhotoIndex(0);
    setModalOpen(true);
  };

  const handleNextPhoto = () => {
    if (selectedFI && selectedFI.photos && selectedFI.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % selectedFI.photos.length);
    }
  };

  const handlePrevPhoto = () => {
    if (selectedFI && selectedFI.photos && selectedFI.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + selectedFI.photos.length) % selectedFI.photos.length);
    }
  };

  const filteredFIs = selectedCity === 'all' 
    ? fisWithCoords 
    : fisWithCoords.filter(fi => fi.ville === selectedCity);

  // Calculate map center based on filtered FIs
  const mapCenter = filteredFIs.length > 0
    ? [
        filteredFIs.reduce((sum, fi) => sum + fi.lat, 0) / filteredFIs.length,
        filteredFIs.reduce((sum, fi) => sum + fi.lon, 0) / filteredFIs.length
      ]
    : [48.8566, 2.3522]; // Paris par défaut

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600">Chargement de la carte...</p>
          <p className="text-sm text-gray-400">Géolocalisation des Familles d'Impact en cours...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Carte Interactive des Familles d'Impact</h2>
            <p className="text-gray-500 mt-1">Visualisez toutes les FI sur une carte</p>
          </div>
        </div>

        {/* City Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Filtrer par ville</label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une ville" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <MapPin className="h-5 w-5 text-indigo-600" />
                <span className="text-lg font-semibold text-gray-700">
                  {filteredFIs.length} FI{filteredFIs.length > 1 ? 's' : ''} affichée{filteredFIs.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card>
          <CardContent className="p-0">
            {filteredFIs.length > 0 ? (
              <MapContainer 
                center={mapCenter} 
                zoom={12} 
                style={{ height: '600px', width: '100%' }}
                key={`${selectedCity}-${filteredFIs.length}`}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredFIs.map((fi) => (
                  <Marker
                    key={fi.id}
                    position={[fi.lat, fi.lon]}
                    icon={houseIcon}
                    eventHandlers={{
                      click: () => handleMarkerClick(fi)
                    }}
                  >
                    <Popup>
                      <div className="text-center">
                        <h3 className="font-semibold text-lg">{fi.nom}</h3>
                        <p className="text-sm text-gray-600">{fi.ville}</p>
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={() => handleMarkerClick(fi)}
                        >
                          Voir les détails
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Home className="h-16 w-16 text-gray-300" />
                <p className="text-gray-500 text-lg">Aucune Famille d'Impact à afficher</p>
                <p className="text-sm text-gray-400">
                  {selectedCity === 'all' 
                    ? 'Aucune FI avec adresse trouvée' 
                    : `Aucune FI avec adresse à ${selectedCity}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FI Details Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-indigo-600" />
              <span>{selectedFI?.nom}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedFI && (
            <div className="space-y-6">
              {/* Photo Carousel */}
              {selectedFI.photos && selectedFI.photos.length > 0 && (
                <div className="relative">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={`${backendUrl}/api/uploads/${selectedFI.photos[currentPhotoIndex]}`}
                      alt={`Photo ${currentPhotoIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {selectedFI.photos.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevPhoto}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                      >
                        <ChevronLeft className="h-6 w-6 text-gray-700" />
                      </button>
                      <button
                        onClick={handleNextPhoto}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                      >
                        <ChevronRight className="h-6 w-6 text-gray-700" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                        {currentPhotoIndex + 1} / {selectedFI.photos.length}
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedFI.photos && selectedFI.photos.length === 0 && (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Home className="h-16 w-16 mx-auto mb-2 opacity-50" />
                    <p>Aucune photo disponible</p>
                  </div>
                </div>
              )}

              {/* FI Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-indigo-600 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Ville</p>
                        <p className="text-base font-semibold text-gray-900">{selectedFI.ville}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Horaires</p>
                        <p className="text-base font-semibold text-gray-900">
                          {selectedFI.heure_debut && selectedFI.heure_fin
                            ? `${selectedFI.heure_debut} - ${selectedFI.heure_fin}`
                            : 'Non spécifié'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pilotes Info */}
              {selectedFI.pilotes && selectedFI.pilotes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pilote{selectedFI.pilotes.length > 1 ? 's' : ''}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedFI.pilotes.map((pilote, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{pilote.nom}</p>
                          </div>
                          {pilote.telephone && (
                            <div className="flex items-center space-x-2 text-indigo-600">
                              <Phone className="h-4 w-4" />
                              <a href={`tel:${pilote.telephone}`} className="font-medium hover:underline">
                                {pilote.telephone}
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Address */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-red-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Adresse</p>
                      <p className="text-base text-gray-900">{selectedFI.adresse}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CarteInteractiveFIPage;
