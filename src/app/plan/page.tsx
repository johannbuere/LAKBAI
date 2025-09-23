'use client';

import React, { useState, useEffect } from 'react';
import MapView from '@/components/MapView';
import Navbar from '@/components/Navbar';
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

export default function PlanPage() {
  const [pois, setPOIs] = useState<POI[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>();
  const [selectedPOIs, setSelectedPOIs] = useState<POI[]>([]);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [currentRoute, setCurrentRoute] = useState<number[][] | undefined>();
  const [transportMode, setTransportMode] = useState<'driving' | 'cycling' | 'walking'>('driving');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<POI[]>([]);
  const [tripDuration, setTripDuration] = useState<number>(4); // hours
  const [tripPreferences, setTripPreferences] = useState<string[]>([]);

  const categories = ['Historical Site', 'Religious Site', 'Scenic View', 'Waterfront', 'Nature Park', 'Cultural Site'];

  // Load POIs and get user location on mount
  useEffect(() => {
    loadPOIs();
    getUserLocation();
  }, []);

  const loadPOIs = async () => {
    try {
      const response = await apiService.getPOIs();
      setPOIs(response.pois);
    } catch (error) {
      console.error('Failed to load POIs:', error);
      // Fallback data
      setPOIs([
        { id: 1, name: "Legazpi Cathedral", lat: 13.142, lon: 123.735, category: "Religious Site" },
        { id: 2, name: "Cagsawa Ruins", lat: 13.136, lon: 123.746, category: "Historical Site" },
        { id: 3, name: "Mayon Volcano Viewpoint", lat: 13.257, lon: 123.685, category: "Scenic View" },
        { id: 4, name: "Embarcadero de Legazpi", lat: 13.143, lon: 123.742, category: "Waterfront" },
        { id: 5, name: "Albay Park and Wildlife", lat: 13.148, lon: 123.731, category: "Nature Park" },
      ]);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(location);
          
          // Add as starting point
          setRoutePoints([{
            id: 'start',
            name: 'My Location',
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            type: 'start',
          }]);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Legazpi center
          const defaultLocation: [number, number] = [13.142, 123.735];
          setUserLocation(defaultLocation);
          setRoutePoints([{
            id: 'start',
            name: 'Legazpi City Center',
            lat: 13.142,
            lon: 123.735,
            type: 'start',
          }]);
        }
      );
    }
  };

  const addPOIToRoute = (poi: POI) => {
    if (selectedPOIs.find(p => p.id === poi.id)) return;
    
    setSelectedPOIs([...selectedPOIs, poi]);
    setRoutePoints(prev => [
      ...prev,
      {
        id: `poi-${poi.id}`,
        name: poi.name,
        lat: poi.lat,
        lon: poi.lon,
        type: 'waypoint',
        estimatedTime: 60, // Default 1 hour
      }
    ]);
  };

  const removePOIFromRoute = (poiId: number) => {
    setSelectedPOIs(prev => prev.filter(p => p.id !== poiId));
    setRoutePoints(prev => prev.filter(p => p.id !== `poi-${poiId}`));
  };

  const getAISuggestions = async () => {
    if (!userLocation) return;
    
    try {
      // Get AI recommendation based on current location and preferences
      const response = await apiService.getRecommendations({
        lat: userLocation[0],
        lon: userLocation[1],
      });
      
      // Filter POIs based on preferences and trip duration
      const filteredPOIs = pois.filter(poi => 
        tripPreferences.length === 0 || tripPreferences.includes(poi.category || '')
      );
      
      setAISuggestions([response.recommended, ...filteredPOIs.slice(0, 3)]);
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      // Fallback to top-rated POIs
      setAISuggestions(pois.slice(0, 3));
    }
  };

  const calculateRoute = async () => {
    if (routePoints.length < 2) return;
    
    setIsLoadingRoute(true);
    try {
      // For now, create a simple route connecting all points
      // In a real implementation, you'd use OSRM to get optimal routing
      const routeCoordinates = routePoints.map(point => [point.lon, point.lat]);
      setCurrentRoute(routeCoordinates);
    } catch (error) {
      console.error('Failed to calculate route:', error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const saveRoute = async () => {
    try {
      const routeData = {
        points: routePoints,
        transportMode,
        duration: tripDuration,
        preferences: tripPreferences,
        route: currentRoute,
        createdAt: new Date().toISOString(),
      };
      
      await apiService.storeOfflineRoute(routeData);
      alert('Route saved for offline use!');
    } catch (error) {
      console.error('Failed to save route:', error);
      alert('Failed to save route. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Left Panel - Planning Interface */}
        <div className="w-1/2 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              🗺️ Plan Your Legazpi Adventure
            </h1>
            
            {/* Trip Preferences */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Trip Preferences</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={tripDuration}
                    onChange={(e) => setTripDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="1"
                    max="12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transport Mode
                  </label>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="driving">🚗 Driving</option>
                    <option value="cycling">🚴 Cycling</option>
                    <option value="walking">🚶 Walking</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => {
                        setTripPreferences(prev => 
                          prev.includes(category)
                            ? prev.filter(p => p !== category)
                            : [...prev, category]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-sm ${
                        tripPreferences.includes(category)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">🤖 AI Suggestions</h3>
                <button
                  onClick={getAISuggestions}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                >
                  Get Suggestions
                </button>
              </div>
              
              {aiSuggestions.length > 0 && (
                <div className="space-y-2">
                  {aiSuggestions.slice(0, 3).map(poi => (
                    <div
                      key={poi.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => addPOIToRoute(poi)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{poi.name}</h4>
                          <p className="text-sm text-gray-600">{poi.category}</p>
                          {poi.description && (
                            <p className="text-xs text-gray-500 mt-1">{poi.description}</p>
                          )}
                        </div>
                        <button
                          className="text-primary-600 hover:text-primary-800 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            addPOIToRoute(poi);
                          }}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Route */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Route</h3>
              
              {routePoints.length > 0 ? (
                <div className="space-y-2">
                  {routePoints.map((point, index) => (
                    <div key={point.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-full text-sm font-medium mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{point.name}</p>
                          <p className="text-sm text-gray-600">
                            {point.type === 'start' ? '🏁 Starting Point' : 
                             point.type === 'destination' ? '🎯 Destination' : '📍 Stop'}
                            {point.estimatedTime && ` • ${point.estimatedTime} min`}
                          </p>
                        </div>
                      </div>
                      
                      {point.type === 'waypoint' && (
                        <button
                          onClick={() => removePOIFromRoute(parseInt(point.id.split('-')[1]))}
                          className="ml-auto text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Click on POIs or locations on the map to build your route
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={calculateRoute}
                disabled={routePoints.length < 2 || isLoadingRoute}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingRoute ? 'Calculating...' : 'Calculate Route'}
              </button>
              
              <button
                onClick={saveRoute}
                disabled={routePoints.length < 2}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💾 Save Route
              </button>
            </div>

            {/* Route Stats */}
            {selectedPOIs.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Trip Summary</h4>
                <div className="text-sm text-blue-800">
                  <p>📍 {selectedPOIs.length} stops planned</p>
                  <p>⏱️ Estimated duration: {tripDuration} hours</p>
                  <p>🚗 Transport: {transportMode}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="w-1/2 relative flex-shrink-0" style={{ height: 'calc(100vh - 64px)' }}>
          <MapView
            center={userLocation || [13.142, 123.735]}
            zoom={13}
            pois={pois}
            userLocation={userLocation}
            height="100%"
          />
          
          {/* Map Overlay - Quick Actions */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Quick Add</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {pois.slice(0, 5).map(poi => (
                <button
                  key={poi.id}
                  className={`w-full p-2 text-left rounded border text-xs ${
                    selectedPOIs.find(p => p.id === poi.id)
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => addPOIToRoute(poi)}
                >
                  <p className="font-medium truncate">{poi.name}</p>
                  <p className="text-gray-600">{poi.category}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
