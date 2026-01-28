'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom user location icon (blue marker)
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to fit map bounds
function FitBounds({ userLocation, eventLocation }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation && eventLocation) {
      const bounds = L.latLngBounds(
        [userLocation.lat, userLocation.lng],
        [eventLocation.lat, eventLocation.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, userLocation, eventLocation]);

  return null;
}

export default function MapDisplay({ coordinates, locationName }) {
  const [mounted, setMounted] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    setMounted(true);
    getUserLocation();
  }, []);

  // Fetch route when both locations are available
  useEffect(() => {
    if (userLocation && coordinates) {
      fetchRoute();
    }
  }, [userLocation, coordinates]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('Unable to get your location. Please enable location services.');
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const fetchRoute = async () => {
    if (!userLocation || !coordinates) return;

    setLoadingRoute(true);
    try {
      // Use OSRM API to get route
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${coordinates.lng},${coordinates.lat}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const routeCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        const distanceKm = (route.distance / 1000).toFixed(2);
        const durationMin = Math.round(route.duration / 60);

        setRouteData({
          coordinates: routeCoordinates,
          distance: distanceKm,
          duration: durationMin
        });
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setLoadingRoute(false);
    }
  };

  if (!mounted || !coordinates || !coordinates.lat || !coordinates.lng) {
    return null;
  }

  const eventPosition = [coordinates.lat, coordinates.lng];
  const centerPosition = userLocation 
    ? [(userLocation.lat + coordinates.lat) / 2, (userLocation.lng + coordinates.lng) / 2]
    : eventPosition;

  const getDirectionsUrl = () => {
    // 💡 Prioritize the EXACT address text entered by the user
    // This is passed as 'locationName' from the event data
    const address = (locationName && typeof locationName === 'string') ? locationName.trim() : "";
    const hasAddress = address.length > 0;
    
    // If we have an actual address string, use it (exactly as entered). 
    // Otherwise fallback to lat/lng coordinates.
    const destQuery = hasAddress ? address : `${coordinates.lat},${coordinates.lng}`;
    const destination = encodeURIComponent(destQuery);
    
    const isApple = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);
    
    if (isApple) {
      // Apple Maps: Use daddr for destination address
      return `http://maps.apple.com/?daddr=${destination}&dirflg=d`;
    }
    
    // Google Maps: 
    // Using the 'dir' API with 'destination' parameter.
    // If 'destination' is a string, Google Maps will search for it first.
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  };

  return (
    <div className="w-full">
      <div className="h-96 rounded-lg overflow-hidden border-2 border-gray-700 mb-3 relative">
        <MapContainer
          center={centerPosition}
          zoom={userLocation ? 12 : 15}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Event Location Marker */}
          <Marker position={eventPosition}>
            <Popup>{locationName || 'Event Location'}</Popup>
          </Marker>
          
          {/* User Location Marker */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>Your Location</Popup>
            </Marker>
          )}
          
          {/* Route Line */}
          {routeData && routeData.coordinates && (
            <>
              <Polyline 
                positions={routeData.coordinates} 
                color="#3b82f6" 
                weight={5}
                opacity={0.7}
              />
              <FitBounds userLocation={userLocation} eventLocation={coordinates} />
            </>
          )}
        </MapContainer>
      </div>
      
      {/* Location Status and Route Info */}
      <div className="space-y-2 mb-3">
        {loadingLocation && (
          <div className="bg-blue-900 text-blue-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-200"></div>
            Getting your location...
          </div>
        )}
        
        {loadingRoute && (
          <div className="bg-blue-900 text-blue-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-200"></div>
            Calculating route...
          </div>
        )}
        
        {locationError && (
          <div className="bg-yellow-900 text-yellow-200 px-4 py-2 rounded-lg text-sm">
            📍 {locationError}
          </div>
        )}
        
        {routeData && (
          <div className="bg-green-900 text-green-200 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📏</span>
              <div>
                <div className="font-bold text-lg">Distance: {routeData.distance} km</div>
                <div className="text-xs text-green-300">Estimated travel time: ~{routeData.duration} minutes by car</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <a
        href={getDirectionsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
      >
        🗺️ Get Directions
      </a>
    </div>
  );
}
