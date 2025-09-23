'use client';

import React, { useEffect, useRef } from 'react';
import { POI } from '@/lib/api';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  pois?: POI[];
  userLocation?: [number, number];
  height?: string;
}

const MapView: React.FC<MapViewProps> = ({
  center = [13.142, 123.735],
  zoom = 13,
  pois = [],
  userLocation,
  height = '400px',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && mapRef.current && !mapInstanceRef.current) {
      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        const L = (window as any).L;
        
        // Initialize map with proper container size
        const map = L.map(mapRef.current!, {
          center: center,
          zoom: zoom,
          scrollWheelZoom: true,
          zoomControl: true,
        });
        mapInstanceRef.current = map;

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        // Add user location marker (blue dot)
        if (userLocation) {
          L.circleMarker(userLocation, {
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.8,
            radius: 8,
          }).bindPopup('📍 Your Location').addTo(map);
        }

        // Add POI markers (red pins)
        pois.forEach((poi) => {
          L.marker([poi.lat, poi.lon])
            .bindPopup(`
              <div>
                <h3><strong>${poi.name}</strong></h3>
                ${poi.category ? `<p><em>${poi.category}</em></p>` : ''}
                ${poi.description ? `<p>${poi.description}</p>` : ''}
              </div>
            `)
            .addTo(map);
        });

        // Fix map size after container is ready
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      };
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map when data changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      const L = (window as any).L;
      const map = mapInstanceRef.current;

      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
          map.removeLayer(layer);
        }
      });

      // Re-add markers
      if (userLocation) {
        L.circleMarker(userLocation, {
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.8,
          radius: 8,
        }).bindPopup('📍 Your Location').addTo(map);
      }

      pois.forEach((poi) => {
        L.marker([poi.lat, poi.lon])
          .bindPopup(`
            <div>
              <h3><strong>${poi.name}</strong></h3>
              ${poi.category ? `<p><em>${poi.category}</em></p>` : ''}
              ${poi.description ? `<p>${poi.description}</p>` : ''}
            </div>
          `)
          .addTo(map);
      });
    }
  }, [pois, userLocation]);

  return (
    <div 
      className="w-full rounded-lg overflow-hidden shadow-md border"
      style={{ height }}
    >
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: height,
        }} 
      />
    </div>
  );
};

export default MapView;
