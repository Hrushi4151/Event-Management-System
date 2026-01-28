'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

// Component to update map center when position changes
function MapUpdater({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], 13);
    }
  }, [center, map]);
  
  return null;
}

export default function MapPicker({ onLocationSelect, initialPosition }) {
  const [position, setPosition] = useState(initialPosition || { lat: 20.5937, lng: 78.9629 });
  const [mounted, setMounted] = useState(false);
  const isUpdatingFromProps = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update position when initialPosition changes (from dropdown selection)
  useEffect(() => {
    if (initialPosition && initialPosition.lat && initialPosition.lng) {
      const isDifferent = 
        Math.abs(position.lat - initialPosition.lat) > 0.0001 ||
        Math.abs(position.lng - initialPosition.lng) > 0.0001;
      
      if (isDifferent) {
        isUpdatingFromProps.current = true;
        setPosition(initialPosition);
      }
    }
  }, [initialPosition, position.lat, position.lng]);

  // Handle position changes from map clicks
  const handlePositionChange = (newPosition) => {
    isUpdatingFromProps.current = false;
    setPosition(newPosition);
    if (onLocationSelect) {
      onLocationSelect(newPosition);
    }
  };

  // Reset the flag after position update
  useEffect(() => {
    if (isUpdatingFromProps.current) {
      isUpdatingFromProps.current = false;
    }
  }, [position]);

  if (!mounted) {
    return (
      <div className="w-full h-96 bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border-2 border-gray-700 z-[400]">
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={position} />
        <LocationMarker position={position} onPositionChange={handlePositionChange} />
      </MapContainer>
      <p className="text-xs text-gray-400 mt-2">
        📍 Click on the map to select event location
      </p>
    </div>
  );
}
