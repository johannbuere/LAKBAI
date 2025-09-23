'use client';

import React, { useEffect, useRef } from 'react';
import type { POI } from '@/lib/api';
import { renderMarkerHtml } from '@/components/Marker';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  pois?: POI[];
  userLocation?: [number, number];
  height?: string;
  onMarkerClick?: (poi: POI) => void;
}

const MapView: React.FC<MapViewProps> = ({
  center = [13.142, 123.735],
  zoom = 13,
  pois = [],
  userLocation,
  height = '400px',
  onMarkerClick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && mapRef.current && !mapInstanceRef.current) {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        const L = (window as any).L;

        const map = L.map(mapRef.current!, {
          center: center,
          zoom: zoom,
          scrollWheelZoom: true,
          zoomControl: true,
        });
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        if (userLocation) {
          L.circleMarker(userLocation, {
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.8,
            radius: 8,
          }).bindPopup('📍 Your Location').addTo(map);
        }

        pois.forEach((poi) => {
          const icon = L.divIcon({
            className: '',
            html: renderMarkerHtml({ id: poi.id, coordinates: [poi.lat, poi.lon], category: poi.category }),
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          });
          const marker = L.marker([poi.lat, poi.lon], { icon });
          marker.addTo(map);
          marker.on('click', () => onMarkerClick && onMarkerClick(poi));
          marker.bindTooltip(poi.name, { permanent: false, direction: 'top' });
        });

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

  useEffect(() => {
    if (mapInstanceRef.current) {
      const L = (window as any).L;
      const map = mapInstanceRef.current;

      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
          map.removeLayer(layer);
        }
      });

      if (userLocation) {
        L.circleMarker(userLocation, {
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.8,
          radius: 8,
        }).bindPopup('📍 Your Location').addTo(map);
      }

      pois.forEach((poi) => {
        const icon = L.divIcon({
          className: '',
          html: renderMarkerHtml({ id: poi.id, coordinates: [poi.lat, poi.lon], category: poi.category }),
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });
        const marker = L.marker([poi.lat, poi.lon], { icon });
        marker.addTo(map);
        marker.on('click', () => onMarkerClick && onMarkerClick(poi));
        marker.bindTooltip(poi.name, { permanent: false, direction: 'top' });
      });
    }
  }, [pois, userLocation]);

  return (
    <div className="w-full rounded-lg overflow-hidden border" style={{ height }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: height }} />
    </div>
  );
};

export default MapView;


