'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MapView from '@/features/MapView';
import Planning from '@/features/Planning';
import { apiService, POI } from '@/lib/api';

interface RoutePoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: 'start' | 'destination' | 'waypoint';
  estimatedTime?: number;
  notes?: string;
}

const PlanPage: React.FC = () => {
  const [pois, setPOIs] = useState<POI[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>();
  const [selectedPOIs, setSelectedPOIs] = useState<POI[]>([]);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [currentRoute, setCurrentRoute] = useState<number[][] | undefined>();
  const [transportMode, setTransportMode] = useState<'driving' | 'cycling' | 'walking'>('driving');
  const [tripDuration, setTripDuration] = useState<number>(4);

  useEffect(() => {
    loadPOIs();
    getUserLocation();
  }, []);

  const loadPOIs = async () => {
    try {
      const response = await apiService.getPOIs();
      setPOIs(response.pois);
    } catch (e) {
      setPOIs([
        { id: 1, name: 'Legazpi Cathedral', lat: 13.142, lon: 123.735, category: 'Religious Site' },
        { id: 2, name: 'Cagsawa Ruins', lat: 13.136, lon: 123.746, category: 'Historical Site' },
      ]);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setRoutePoints([{ id: 'start', name: 'My Location', lat: loc[0], lon: loc[1], type: 'start' }]);
        },
        () => {
          const fallback: [number, number] = [13.142, 123.735];
          setUserLocation(fallback);
          setRoutePoints([{ id: 'start', name: 'Legazpi City Center', lat: 13.142, lon: 123.735, type: 'start' }]);
        }
      );
    }
  };

  const addPOIToRoute = (poi: POI) => {
    if (selectedPOIs.find((p) => p.id === poi.id)) return;
    setSelectedPOIs([...selectedPOIs, poi]);
    setRoutePoints((prev) => [
      ...prev,
      { id: `poi-${poi.id}`, name: poi.name, lat: poi.lat, lon: poi.lon, type: 'waypoint', estimatedTime: 60 },
    ]);
  };

  const removePOIFromRoute = (poiId: number) => {
    setSelectedPOIs((prev) => prev.filter((p) => p.id !== poiId));
    setRoutePoints((prev) => prev.filter((p) => p.id !== `poi-${poiId}`));
  };

  const calculateRoute = async () => {
    if (routePoints.length < 2) return;
    const routeCoordinates = routePoints.map((p) => [p.lon, p.lat]);
    setCurrentRoute(routeCoordinates);
  };

  const saveRoute = async () => {
    const routeData = {
      points: routePoints,
      transportMode,
      duration: tripDuration,
      route: currentRoute,
      createdAt: new Date().toISOString(),
    };
    await apiService.storeOfflineRoute(routeData);
    alert('Route saved for offline use!');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0">
        <div className="order-2 md:order-1 bg-[var(--bg)] border-r border-slate-200" style={{ height: 'calc(100vh - 64px)' }}>
          <Planning
            pois={pois}
            selectedPOIs={selectedPOIs}
            routePoints={routePoints}
            onAdd={addPOIToRoute}
            onRemove={removePOIFromRoute}
            onCalculate={calculateRoute}
            onSave={saveRoute}
            transportMode={transportMode}
            setTransportMode={setTransportMode}
            tripDuration={tripDuration}
            setTripDuration={setTripDuration}
          />
        </div>
        <div className="order-1 md:order-2" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="h-full p-3">
            <MapView
              center={userLocation || [13.142, 123.735]}
              zoom={13}
              pois={pois}
              userLocation={userLocation}
              height="100%"
              onMarkerClick={addPOIToRoute}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PlanPage;


