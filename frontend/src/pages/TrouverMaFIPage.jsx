import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { MapPin, Navigation, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TrouverMaFIPage = () => {
  const navigate = useNavigate();
  const [userAddress, setUserAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [fisWithCoords, setFisWithCoords] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [nearestFIs, setNearestFIs] = useState([]);

  // Fonction pour géocoder une adresse avec Nominatim
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      // Clone response to avoid "body stream already read" error
      const data = await response.clone().json();
      
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

  // Calculer la distance entre deux points (formule Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleSearch = async () => {
    if (!userAddress.trim()) {
      toast.error('Veuillez entrer votre adresse');
      return;
    }

    setLoading(true);
    
    try {
      // 1. Géocoder l'adresse utilisateur
      toast.info('Recherche de votre position...');
      const userGeo = await geocodeAddress(userAddress);
      
      if (!userGeo) {
        toast.error('Adresse introuvable. Vérifiez votre saisie.');
        setLoading(false);
        return;
      }
      
      setUserCoords(userGeo);
      
      // 2. Récupérer toutes les FI avec adresses
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/public/fi/all`);
      // Clone response to avoid "body stream already read" error
      const fis = await response.clone().json();
      
      if (fis.length === 0) {
        toast.warning('Aucune Famille d\'Impact trouvée avec adresse');
        setLoading(false);
        return;
      }
      
      // 3. Géocoder toutes les adresses des FI
      toast.info(`Géolocalisation de ${fis.length} Familles d'Impact...`);
      const fisWithGeo = [];
      
      for (const fi of fis) {
        if (fi.adresse) {
          // Ajouter ville pour améliorer précision
          const fullAddress = `${fi.adresse}, ${fi.ville}, France`;
          const coords = await geocodeAddress(fullAddress);
          
          if (coords) {
            const distance = calculateDistance(
              userGeo.lat, userGeo.lon,
              coords.lat, coords.lon
            );
            
            fisWithGeo.push({
              ...fi,
              lat: coords.lat,
              lon: coords.lon,
              distance: distance
            });
          }
        }
        
        // Respecter la limite de 1 req/sec de Nominatim
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
      
      // 4. Trier par distance et prendre les 5 plus proches
      fisWithGeo.sort((a, b) => a.distance - b.distance);
      const nearest = fisWithGeo.slice(0, 5);
      
      setFisWithCoords(fisWithGeo);
      setNearestFIs(nearest);
      
      toast.success(`${nearest.length} Familles d'Impact trouvées près de chez vous !`);
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trouver ma Famille d'Impact</h1>
            <p className="text-gray-600 mt-1">Localisez la FI la plus proche de chez vous</p>
          </div>
          <Button onClick={() => navigate('/login')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Entrez votre adresse</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Adresse complète</Label>
                <Input
                  placeholder="Ex: 10 Rue de la Paix, 21000 Dijon"
                  value={userAddress}
                  onChange={(e) => setUserAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <p className="text-xs text-gray-500">
                  Saisissez: numéro + rue + code postal + ville
                </p>
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                <Navigation className="h-4 w-4 mr-2" />
                {loading ? 'Recherche en cours...' : 'Trouver les FI proches'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {nearestFIs.length > 0 && (
          <>
            {/* List of nearest FIs */}
            <Card>
              <CardHeader>
                <CardTitle>📍 Les 5 Familles d'Impact les plus proches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {nearestFIs.map((fi, index) => (
                    <div 
                      key={fi.id} 
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold">
                              {index + 1}
                            </span>
                            <div>
                              <h3 className="font-semibold text-lg">{fi.nom}</h3>
                              <p className="text-sm text-gray-600">{fi.adresse}</p>
                              <p className="text-sm text-gray-500">{fi.ville}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600">
                            {fi.distance.toFixed(1)} km
                          </p>
                          <p className="text-xs text-gray-500">de chez vous</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            <Card>
              <CardHeader>
                <CardTitle>🗺️ Carte interactive</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: '500px', width: '100%' }}>
                  <MapContainer
                    center={userCoords ? [userCoords.lat, userCoords.lon] : [47.3220, 5.0415]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* User location marker */}
                    {userCoords && (
                      <Marker 
                        position={[userCoords.lat, userCoords.lon]}
                        icon={L.divIcon({
                          className: 'custom-marker',
                          html: '<div style="background-color: #ef4444; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
                          iconSize: [30, 30]
                        })}
                      >
                        <Popup>
                          <strong>Votre position</strong>
                          <br />
                          {userAddress}
                        </Popup>
                      </Marker>
                    )}
                    
                    {/* FI markers */}
                    {fisWithCoords.map((fi) => (
                      <Marker 
                        key={fi.id} 
                        position={[fi.lat, fi.lon]}
                        icon={L.divIcon({
                          className: 'custom-marker',
                          html: '<div style="font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🏠</div>',
                          iconSize: [32, 32],
                          iconAnchor: [16, 32]
                        })}
                      >
                        <Popup maxWidth={250}>
                          <div style={{padding: '8px'}}>
                            <h3 style={{fontWeight: 'bold', fontSize: '16px', marginBottom: '8px', color: '#4f46e5'}}>
                              {fi.nom}
                            </h3>
                            <div style={{marginBottom: '6px'}}>
                              <strong>📍 Adresse :</strong><br />
                              {fi.adresse}, {fi.ville}
                            </div>
                            {fi.pilote_nom && (
                              <div style={{marginBottom: '6px'}}>
                                <strong>👤 Pilote :</strong><br />
                                {fi.pilote_nom}
                              </div>
                            )}
                            {fi.pilote_telephone && (
                              <div style={{marginBottom: '6px'}}>
                                <strong>📞 Téléphone :</strong><br />
                                <a href={`tel:${fi.pilote_telephone}`} style={{color: '#4f46e5', textDecoration: 'underline'}}>
                                  {fi.pilote_telephone}
                                </a>
                              </div>
                            )}
                            {(fi.heure_debut || fi.heure_fin) && (
                              <div style={{marginBottom: '6px'}}>
                                <strong>🕐 Horaires :</strong><br />
                                {fi.heure_debut && fi.heure_fin ? (
                                  <span>{fi.heure_debut} - {fi.heure_fin}</span>
                                ) : fi.heure_debut ? (
                                  <span>Début : {fi.heure_debut}</span>
                                ) : (
                                  <span>Fin : {fi.heure_fin}</span>
                                )}
                              </div>
                            )}
                            <div style={{marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb'}}>
                              <span style={{color: '#4f46e5', fontWeight: 600}}>
                                📏 À {fi.distance.toFixed(1)} km
                              </span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
                <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white"></div>
                    <span>Votre position</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🏠</span>
                    <span>Familles d'Impact (cliquez pour voir les détails)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default TrouverMaFIPage;
