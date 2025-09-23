'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import MapView from '@/components/MapView';
import { apiService, POI } from '@/lib/api';

export default function Home() {
  const [pois, setPOIs] = useState<POI[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>();
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [loading, setLoading] = useState(false);

  // Load POIs on component mount
  useEffect(() => {
    loadPOIs();
    getUserLocation();
  }, []);

  const loadPOIs = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPOIs();
      setPOIs(response.pois);
    } catch (error) {
      console.error('Failed to load POIs:', error);
      // Fallback to sample data if API is not available
      setPOIs([
        { id: 1, name: "Legazpi Cathedral", lat: 13.142, lon: 123.735, category: "Religious Site" },
        { id: 2, name: "Cagsawa Ruins", lat: 13.136, lon: 123.746, category: "Historical Site" },
        { id: 3, name: "Mayon Volcano Viewpoint", lat: 13.257, lon: 123.685, category: "Scenic View" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting user location:', error);
          // Default to Legazpi City center if geolocation fails
          setUserLocation([13.142, 123.735]);
        }
      );
    } else {
      // Default to Legazpi City center if geolocation is not supported
      setUserLocation([13.142, 123.735]);
    }
  };

  const getRecommendation = async () => {
    if (!userLocation) return;
    
    try {
      setLoading(true);
      const response = await apiService.getRecommendations({
        lat: userLocation[0],
        lon: userLocation[1],
      });
      setSelectedPOI(response.recommended);
    } catch (error) {
      console.error('Failed to get recommendation:', error);
      // Fallback to nearest POI
      if (pois.length > 0) {
        setSelectedPOI(pois[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-primary-600">LAKBAI</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI-Powered Tourist Navigation and Recommendation System for Legazpi City. 
            Discover hidden gems, plan your route, and explore Legazpi like never before.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={getRecommendation}
              disabled={loading}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Getting Recommendations...' : 'Get AI Recommendations'}
            </button>
            <button
              onClick={getUserLocation}
              className="bg-secondary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-secondary-700 transition-colors"
            >
              📍 Update My Location
            </button>
          </div>
        </div>

        {/* Map Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Explore Legazpi City
              </h2>
              <MapView
                center={userLocation || [13.142, 123.735]}
                zoom={13}
                pois={pois}
                userLocation={userLocation}
              />
            </div>
          </div>
          
          <div className="space-y-6">
            {/* AI Recommendation Card */}
            {selectedPOI && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  🤖 AI Recommendation
                </h3>
                <div className="border-l-4 border-primary-500 pl-4">
                  <h4 className="font-semibold text-lg text-primary-700">
                    {selectedPOI.name}
                  </h4>
                  {selectedPOI.category && (
                    <span className="inline-block bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-sm mt-2">
                      {selectedPOI.category}
                    </span>
                  )}
                  <p className="text-gray-600 mt-2">
                    Recommended based on your location and preferences.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Available POIs:</span>
                  <span className="font-semibold">{pois.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Location:</span>
                  <span className="font-semibold text-green-600">
                    {userLocation ? '📍 Found' : '📍 Searching...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AI Status:</span>
                  <span className="font-semibold text-blue-600">🤖 Online</span>
                </div>
              </div>
            </div>

            {/* Features Preview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Features
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-blue-500">🗺️</span>
                  <span className="text-gray-700">Interactive Map Navigation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-green-500">🤖</span>
                  <span className="text-gray-700">AI-Powered Recommendations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-purple-500">📱</span>
                  <span className="text-gray-700">Offline Route Storage</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-red-500">🚗</span>
                  <span className="text-gray-700">Multi-Modal Routing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* POI Grid */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Popular Destinations in Legazpi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pois.map((poi) => (
              <div
                key={poi.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPOI(poi)}
              >
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {poi.name}
                </h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    📍 {poi.lat.toFixed(3)}, {poi.lon.toFixed(3)}
                  </span>
                  {poi.category && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                      {poi.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
