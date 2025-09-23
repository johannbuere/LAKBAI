'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { POI } from '@/lib/api';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  pois?: POI[];
  route?: number[][];
  userLocation?: [number, number];
  onLocationSelect?: (lat: number, lon: number) => void;
}

const MapView: React.FC<MapViewProps> = ({
  center = [13.142, 123.735], // Default to Legazpi City center
  zoom = 13,
  pois = [],
  route,
  userLocation,
  onLocationSelect,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    // Dynamically import Leaflet
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      // Fix for default markers in react-leaflet
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    });
  }, []);

  if (!isClient || !L) {
    return (
      <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  // Custom icon for POIs
  const poiIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // Custom icon for user location
  const userIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6">
        <circle cx="12" cy="12" r="8" stroke="#1E40AF" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="#FFFFFF"/>
      </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>Your Location</Popup>
          </Marker>
        )}
        
        {/* POI markers */}
        {pois.map((poi) => (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lon]}
            icon={poiIcon}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{poi.name}</h3>
                {poi.description && (
                  <p className="text-sm text-gray-600 mt-1">{poi.description}</p>
                )}
                {poi.category && (
                  <span className="inline-block bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs mt-2">
                    {poi.category}
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Route polyline */}
        {route && route.length > 0 && (
          <Polyline
            positions={route.map(coord => [coord[1], coord[0]] as [number, number])} // Note: Leaflet uses [lat, lon] but GeoJSON uses [lon, lat]
            pathOptions={{
              color: '#EF4444',
              weight: 4,
              opacity: 0.8,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
