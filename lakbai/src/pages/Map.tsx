import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import lakbaiIcon from "../assets/lakbai.svg";
import homeIcon from "../assets/material-symbols--home-rounded.svg";
import mapIcon from "../assets/solar--map-bold.svg";
import settingsIcon from "../assets/tdesign--setting-filled.svg";
import profileIcon from "../assets/blank-profile.svg";
import editIcon from "../assets/tabler--edit.svg";
import carIcon from "../assets/mingcute--car-fill.svg";
import bicycleIcon from "../assets/iconoir--bicycle.svg";
import walkIcon from "../assets/ri--walk-fill.svg";
import { loadPOIData, type POI } from "../lib/poiData";
import LocationCard from "../components/LocationCard";

interface Location {
  id: string;
  poiID: number;
  name: string;
  category: string;
  tags: string[];
  date: string;
  startTime: string;
  endTime: string;
  coordinates: [number, number];
  confirmed: boolean;
}

interface RouteInfo {
  car: string;
  bicycle: string;
  foot: string;
  distance: string;
}

export default function Map() {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [lng] = useState(123.7447);
  const [lat] = useState(13.1414);
  const [zoom] = useState(12);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pendingLocation, setPendingLocation] = useState<Location | null>(null);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [routeInfos, setRouteInfos] = useState<Record<string, RouteInfo>>({});
  const [poiData, setPOIData] = useState<POI[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);

  // Load POI data from CSV
  useEffect(() => {
    loadPOIData().then(setPOIData);
  }, []);

  // Initialize map and add POI markers
  useEffect(() => {
    if (map.current || !mapContainer.current || poiData.length === 0) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap Contributors",
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "bottom-right");

    // Add custom clickable markers for all POIs
    poiData.forEach((poi) => {
      // Create container for the marker
      const container = document.createElement("div");
      container.style.cssText = `
        width: 0;
        height: 0;
        position: relative;
      `;

      // Create the actual marker element
      const el = document.createElement("div");
      el.className = "poi-marker";
      el.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: #6DD14A;
        border: 3px solid white;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        left: -16px;
        top: -32px;
      `;

      // Add inner dot for better visibility
      const innerDot = document.createElement("div");
      innerDot.style.cssText = `
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: white;
        pointer-events: none;
      `;
      el.appendChild(innerDot);

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.2)";
        el.style.boxShadow = "0 4px 16px rgba(109,209,74,0.6)";
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
      });

      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Marker clicked:", poi.poiName);
        
        // Zoom to marker location
        if (map.current) {
          map.current.flyTo({
            center: [poi.long, poi.lat],
            zoom: 16,
            duration: 1000,
          });
        }
        
        // Delay showing the card until after zoom animation
        setTimeout(() => {
          // Get marker position on screen
          const rect = el.getBoundingClientRect();
          setCardPosition({
            x: rect.right + 16, // 16px offset to the right
            y: rect.top,
          });
          setSelectedPOI(poi);
        }, 1100); // Wait 1100ms (slightly after 1000ms zoom animation)
      });

      container.appendChild(el);

      // Create marker with container element
      const marker = new maplibregl.Marker({
        element: container,
        anchor: "center",
      })
        .setLngLat([poi.long, poi.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      popupRef.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, [lng, lat, zoom, poiData]);

  // Fetch route info from OSRM
  const fetchRouteInfo = async (
    from: [number, number],
    to: [number, number],
    profile: string
  ) => {
    try {
      const response = await fetch(
        `http://router.project-osrm.org/route/v1/${profile}/${from[0]},${from[1]};${to[0]},${to[1]}?overview=false`
      );
      const data = await response.json();
      if (data.code === "Ok" && data.routes && data.routes[0]) {
        const duration = data.routes[0].duration; // in seconds
        const distance = data.routes[0].distance; // in meters
        return {
          duration: Math.round(duration / 60), // convert to minutes
          distance: distance, // keep in meters
        };
      }
    } catch (error) {
      console.error(`Error fetching ${profile} route:`, error);
    }
    return { duration: 0, distance: 0 };
  };

  // Calculate route between two specific locations
  const calculateRoute = async (from: Location, to: Location) => {
    const key = `${from.id}-${to.id}`;
    
    const [carInfo, bicycleInfo, footInfo] = await Promise.all([
      fetchRouteInfo(from.coordinates, to.coordinates, "driving"),
      fetchRouteInfo(from.coordinates, to.coordinates, "cycling"),
      fetchRouteInfo(from.coordinates, to.coordinates, "foot"),
    ]);

    const distanceInMeters = carInfo.distance;
    const formattedDistance = distanceInMeters >= 1000 
      ? `${(distanceInMeters / 1000).toFixed(1)} km`
      : `${Math.round(distanceInMeters)} m`;

    setRouteInfos(prev => ({
      ...prev,
      [key]: {
        car: `${carInfo.duration}m`,
        bicycle: `${bicycleInfo.duration}m`,
        foot: `${footInfo.duration}m`,
        distance: formattedDistance,
      }
    }));
  };

  // Calculate routes between consecutive locations
  useEffect(() => {
    const calculateRoutes = async () => {
      const newRouteInfos: Record<string, RouteInfo> = {};

      for (let i = 0; i < locations.length - 1; i++) {
        const from = locations[i];
        const to = locations[i + 1];
        const key = `${from.id}-${to.id}`;

        const [carInfo, bicycleInfo, footInfo] = await Promise.all([
          fetchRouteInfo(from.coordinates, to.coordinates, "driving"),
          fetchRouteInfo(from.coordinates, to.coordinates, "cycling"),
          fetchRouteInfo(from.coordinates, to.coordinates, "walking"),
        ]);

        newRouteInfos[key] = {
          car: `${carInfo.duration}m`,
          bicycle: `${bicycleInfo.duration}m`,
          foot: `${footInfo.duration}m`,
          distance: `${carInfo.distance} km`,
        };
      }

      setRouteInfos(newRouteInfos);
    };

    if (locations.length > 1) {
      calculateRoutes();
    }
  }, [locations]);

  const handleTimeChange = (
    locationId: string,
    field: "startTime" | "endTime" | "date",
    value: string
  ) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === locationId ? { ...loc, [field]: value } : loc))
    );
  };

  const handlePendingTimeChange = (
    field: "startTime" | "endTime" | "date",
    value: string
  ) => {
    if (pendingLocation) {
      setPendingLocation({ ...pendingLocation, [field]: value });
    }
  };

  const addPOIToItinerary = (poi: POI) => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    const newLocation: Location = {
      id: Date.now().toString(),
      poiID: poi.poiID,
      name: poi.poiName,
      category: poi.theme,
      tags: [poi.theme],
      date: today,
      startTime: "09:00",
      endTime: "10:00",
      coordinates: [poi.long, poi.lat],
      confirmed: false,
    };
    setPendingLocation(newLocation);
  };

  const confirmLocation = () => {
    if (pendingLocation) {
      const confirmedLocation = { ...pendingLocation, confirmed: true };
      setLocations([...locations, confirmedLocation]);
      setPendingLocation(null);
      
      // Calculate routes if there are existing locations
      if (locations.length > 0) {
        const lastLocation = locations[locations.length - 1];
        calculateRoute(lastLocation, confirmedLocation);
      }
    }
  };

  const cancelPendingLocation = () => {
    setPendingLocation(null);
  };

  const toggleEditLocation = (locationId: string) => {
    setEditingLocationId(editingLocationId === locationId ? null : locationId);
  };

  const saveLocationEdit = (locationId: string) => {
    setEditingLocationId(null);
    // Recalculate routes if needed
    const locationIndex = locations.findIndex(loc => loc.id === locationId);
    if (locationIndex > 0) {
      calculateRoute(locations[locationIndex - 1], locations[locationIndex]);
    }
    if (locationIndex < locations.length - 1) {
      calculateRoute(locations[locationIndex], locations[locationIndex + 1]);
    }
  };

  const removeLocation = (locationId: string) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== locationId));
  };

  return (
    <div className="h-screen w-screen bg-white flex overflow-hidden">
      {/* Left Navigation Sidebar */}
      <aside
        className="relative w-[155px] h-full bg-[#f7f7f7] flex-shrink-0"
        role="complementary"
        aria-label="Sidebar navigation"
      >
        {/* Logo */}
        <div className="absolute w-16 h-16 top-8 left-1/2 -translate-x-1/2 flex items-center justify-center">
          <img
            src={lakbaiIcon}
            alt="Lakbai Logo"
            className="w-full h-full"
            style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(31%) saturate(1679%) hue-rotate(50deg) brightness(95%) contrast(89%)' }}
          />
        </div>

        {/* Navigation */}
        <nav aria-label="Main navigation" className="absolute top-32 left-1/2 -translate-x-1/2 flex flex-col gap-4">
          <button
            onClick={() => navigate("/")}
            className="w-14 h-14 flex items-center justify-center bg-[#f0fbea] rounded-full cursor-pointer transition-all hover:bg-[#d9f5cc] hover:scale-110"
            aria-label="Home"
            type="button"
          >
            <img
              src={homeIcon}
              alt=""
              className="w-8 h-8"
              style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(31%) saturate(1679%) hue-rotate(50deg) brightness(95%) contrast(89%)' }}
              aria-hidden="true"
            />
          </button>

          <button
            className="w-14 h-14 flex items-center justify-center bg-[#6dd14a] rounded-full cursor-pointer transition-all hover:bg-[#5ec13b] hover:scale-110 shadow-md"
            aria-label="Map"
            aria-current="page"
            type="button"
          >
            <img
              src={mapIcon}
              alt=""
              className="w-8 h-8"
              style={{ filter: 'brightness(0) invert(1)' }}
              aria-hidden="true"
            />
          </button>
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 w-full pb-8 flex flex-col items-center gap-4">
          {/* Settings Button */}
          <button
            className="w-10 h-10 flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:bg-gray-200 rounded-full"
            aria-label="Settings"
            type="button"
          >
            <img
              src={settingsIcon}
              alt=""
              className="w-7 h-7"
              style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(31%) saturate(1679%) hue-rotate(50deg) brightness(95%) contrast(89%)' }}
            />
          </button>

          {/* Version Badge */}
          <div className="bg-[#6dd14a] rounded-full px-4 py-1.5 flex items-center justify-center">
            <span className="font-medium text-black text-[10px] whitespace-nowrap">
              version 1.2
            </span>
          </div>

          {/* Profile Button */}
          <button
            className="w-12 h-12 cursor-pointer transition-all hover:scale-110 hover:ring-2 hover:ring-lakbai-green rounded-full overflow-hidden"
            aria-label="User profile"
            type="button"
          >
            <img 
              className="w-full h-full object-cover rounded-full" 
              alt="User profile" 
              src={profileIcon} 
            />
          </button>
        </div>
      </aside>

      {/* Map Area */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Location Card appears next to clicked marker */}
        {selectedPOI && cardPosition && (
          <div
            style={{
              position: 'fixed',
              left: `${cardPosition.x}px`,
              top: `${cardPosition.y}px`,
              zIndex: 1000,
            }}
          >
            <LocationCard
              poi={selectedPOI}
              onAddToItinerary={() => {
                addPOIToItinerary(selectedPOI);
                setSelectedPOI(null);
                setCardPosition(null);
              }}
              onClose={() => {
                setSelectedPOI(null);
                setCardPosition(null);
              }}
            />
          </div>
        )}
      </div>

      {/* Right Itinerary Sidebar */}
      <div className="w-[500px] bg-white flex flex-col shadow-lg border-l border-gray-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-lakbai-green">Itinerary</span>
            </div>
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Itinerary Section */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Itinerary</h2>
          </div>

          {/* Pending Location - Show before confirming */}
          {pendingLocation && (
            <div className="mb-6 border-2 border-lakbai-green rounded-2xl p-5 bg-lakbai-green-bg">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 pt-1">
                  {locations.length === 0 ? (
                    <div className="w-6 h-6 bg-lakbai-green rounded-full flex items-center justify-center shadow-md">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-lakbai-green rounded-full shadow-md"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{pendingLocation.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{pendingLocation.category}</p>
                  
                  {/* Date and Time Inputs */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-700 font-semibold w-12">Date:</label>
                      <input
                        type="date"
                        value={pendingLocation.date}
                        onChange={(e) => handlePendingTimeChange("date", e.target.value)}
                        className="flex-1 px-3 py-2 text-sm font-medium border-2 border-lakbai-green rounded-xl focus:outline-none focus:ring-2 focus:ring-lakbai-green focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-700 font-semibold w-12">From:</label>
                      <input
                        type="time"
                        value={pendingLocation.startTime}
                        onChange={(e) => handlePendingTimeChange("startTime", e.target.value)}
                        className="flex-1 px-3 py-2 text-sm font-medium border-2 border-lakbai-green rounded-xl focus:outline-none focus:ring-2 focus:ring-lakbai-green focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-700 font-semibold w-12">To:</label>
                      <input
                        type="time"
                        value={pendingLocation.endTime}
                        onChange={(e) => handlePendingTimeChange("endTime", e.target.value)}
                        className="flex-1 px-3 py-2 text-sm font-medium border-2 border-lakbai-green rounded-xl focus:outline-none focus:ring-2 focus:ring-lakbai-green focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {pendingLocation.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-white text-lakbai-green-dark text-xs rounded-full border border-lakbai-green"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={confirmLocation}
                  className="flex-1 bg-lakbai-green text-white px-4 py-2 rounded-lg hover:bg-lakbai-green-dark transition-colors font-medium"
                >
                  Confirm
                </button>
                <button
                  onClick={cancelPendingLocation}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {locations.length === 0 && !pendingLocation ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-lakbai-green-bg rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-lakbai-green"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No locations yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Click on any marker on the map to add locations to your itinerary
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {locations.map((location, index) => (
                <div key={location.id} className="relative">
                  {/* Continuous vertical line spanning from this location to the next */}
                  {index < locations.length - 1 && (
                    <div className="absolute left-2.5 top-0 w-1 bg-lakbai-green" style={{ height: 'calc(100% + 1rem)' }}></div>
                  )}
                  
                  {/* Location Card with Circle */}
                  <div className="relative flex gap-3 mb-4">
                    {/* Circle Marker - Different style for first and last */}
                    <div className="flex-shrink-0 relative z-10 pt-1">
                      {index === 0 ? (
                        // Starting point - larger circle with dot
                        <div className="w-6 h-6 bg-lakbai-green rounded-full flex items-center justify-center shadow-md">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      ) : index === locations.length - 1 ? (
                        // End point - filled circle
                        <div className="w-6 h-6 bg-lakbai-green rounded-full shadow-md"></div>
                      ) : (
                        // Middle points - smaller filled circles
                        <div className="w-6 h-6 bg-lakbai-green rounded-full shadow-sm flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{location.name}</h3>
                          <p className="text-sm text-gray-500 mb-2">{location.category}</p>
                          
                          {/* Time Display or Edit Mode */}
                          {editingLocationId === location.id ? (
                            <div className="space-y-2 mb-3">
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-700 font-semibold w-12">Date:</label>
                                <input
                                  type="date"
                                  value={location.date}
                                  onChange={(e) => handleTimeChange(location.id, "date", e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm font-medium border-2 border-lakbai-green rounded-xl focus:outline-none focus:ring-2 focus:ring-lakbai-green focus:border-transparent shadow-sm hover:shadow-md transition-all"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-700 font-semibold w-12">From:</label>
                                <input
                                  type="time"
                                  value={location.startTime}
                                  onChange={(e) => handleTimeChange(location.id, "startTime", e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm font-medium border-2 border-lakbai-green rounded-xl focus:outline-none focus:ring-2 focus:ring-lakbai-green focus:border-transparent shadow-sm hover:shadow-md transition-all"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-700 font-semibold w-12">To:</label>
                                <input
                                  type="time"
                                  value={location.endTime}
                                  onChange={(e) => handleTimeChange(location.id, "endTime", e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm font-medium border-2 border-lakbai-green rounded-xl focus:outline-none focus:ring-2 focus:ring-lakbai-green focus:border-transparent shadow-sm hover:shadow-md transition-all"
                                />
                              </div>
                              <button
                                onClick={() => saveLocationEdit(location.id)}
                                className="w-full bg-lakbai-green text-white px-3 py-2 rounded-xl hover:bg-lakbai-green-dark transition-colors text-sm font-semibold shadow-md"
                              >
                                Save Changes
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-600 space-y-1 mb-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <span>{new Date(location.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span>{location.startTime} - {location.endTime}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-2">
                            {location.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-2 py-1 bg-lakbai-green-bg text-lakbai-green-dark text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => toggleEditLocation(location.id)}
                            className="p-1.5 hover:bg-lakbai-green-bg rounded-lg transition-colors"
                            title="Edit schedule"
                          >
                            <img src={editIcon} alt="Edit" className="w-5 h-5" style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(31%) saturate(1679%) hue-rotate(50deg) brightness(95%) contrast(89%)' }} />
                          </button>
                          <button
                            onClick={() => removeLocation(location.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove location"
                          >
                            <svg
                              className="w-5 h-5 text-red-500"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route Info between locations */}
                  {index < locations.length - 1 && (
                    <div className="ml-8 bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                          {routeInfos[`${location.id}-${locations[index + 1].id}`] ? (
                            <>
                              <div className="flex items-center gap-1">
                                <img src={carIcon} alt="Car" className="w-4 h-4" />
                                <span>
                                  {routeInfos[`${location.id}-${locations[index + 1].id}`].car}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <img src={bicycleIcon} alt="Bicycle" className="w-4 h-4" />
                                <span>
                                  {routeInfos[`${location.id}-${locations[index + 1].id}`].bicycle}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <img src={walkIcon} alt="Walk" className="w-4 h-4" />
                                <span>
                                  {routeInfos[`${location.id}-${locations[index + 1].id}`].foot}
                                </span>
                              </div>
                              <span className="text-gray-400">•</span>
                              <span className="font-medium">
                                {routeInfos[`${location.id}-${locations[index + 1].id}`].distance}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">Calculating route...</span>
                          )}
                        </div>
                      </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Action */}
        <div className="px-8 py-6 border-t border-gray-200">
          <button className="w-full bg-lakbai-green text-white py-4 rounded-xl font-semibold hover:bg-lakbai-green-dark transition-colors">
            Generate Full Itinerary
          </button>
        </div>
      </div>
    </div>
  );
}
