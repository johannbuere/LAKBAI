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
import menuIcon from "../assets/zondicons--dots-horizontal-triple.svg";
import { loadPOIData, type POI } from "../lib/poiData";
import LocationCard from "../components/LocationCard";
import { getRoute, getRoutesBatch } from "../lib/routingService";
import RecommendationPanel from "../components/RecommendationPanel";
import { getRecommendations, type Recommendation } from "../lib/recommendationService";

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
  geometry?: string; // Store the route geometry
}

interface RouteGeometry {
  car?: any;
  bicycle?: any;
  foot?: any;
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
  const [routeGeometries, setRouteGeometries] = useState<Record<string, RouteGeometry>>({});
  const [activeRoutes, setActiveRoutes] = useState<Record<string, string>>({}); // key: locationPair, value: profile (car/bicycle/foot)
  const [poiData, setPOIData] = useState<POI[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Recommendation state
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  
  // Itinerary metadata state
  const [itineraryTitle, setItineraryTitle] = useState("My Trip");
  const [itineraryDateFrom, setItineraryDateFrom] = useState("");
  const [itineraryDateTo, setItineraryDateTo] = useState("");
  const [itineraryDescription, setItineraryDescription] = useState("Add a description...");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load POI data from CSV
  useEffect(() => {
    loadPOIData().then(setPOIData);
  }, []);

  // Fetch AI recommendations when locations change
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (locations.length === 0) {
        setRecommendations([]);
        return;
      }

      console.log('🤖 Fetching recommendations for route:', locations.map(loc => loc.poiID));
      setIsLoadingRecommendations(true);
      try {
        const currentRoute = locations.map(loc => loc.poiID);
        const recs = await getRecommendations(currentRoute, 10);
        console.log('✅ Got recommendations:', recs.length, recs);
        setRecommendations(recs);
      } catch (error) {
        console.error('❌ Failed to fetch recommendations:', error);
        setRecommendations([]);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
  }, [locations]);

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

  // Adjust map controls position based on sidebar state
  useEffect(() => {
    if (!map.current) return;
    
    const controlContainer = document.querySelector('.maplibregl-ctrl-bottom-right');
    if (controlContainer instanceof HTMLElement) {
      if (isSidebarCollapsed) {
        controlContainer.style.right = '10px';
        controlContainer.style.transition = 'right 0.2s ease-out';
      } else {
        controlContainer.style.right = '510px'; // 500px sidebar + 10px margin
        controlContainer.style.transition = 'right 0.2s ease-out';
      }
    }
  }, [isSidebarCollapsed]);

  // Get OSRM base URLs from environment variables
  // Calculate route between two specific locations using backend API
  const calculateRoute = async (from: Location, to: Location) => {
    const key = `${from.id}-${to.id}`;
    
    try {
      const routeData = await getRoute(
        from.coordinates,
        to.coordinates,
        ["car", "bicycle", "foot"]
      );

      if (!routeData) {
        console.error('No route data returned from backend');
        return;
      }

      setRouteInfos(prev => ({
        ...prev,
        [key]: {
          car: routeData.car ? `${routeData.car.duration}m` : '0m',
          bicycle: routeData.bicycle ? `${routeData.bicycle.duration}m` : '0m',
          foot: routeData.foot ? `${routeData.foot.duration}m` : '0m',
          distance: routeData.distance_formatted,
        }
      }));

      // Store route geometries
      setRouteGeometries(prev => ({
        ...prev,
        [key]: {
          car: routeData.car?.geometry,
          bicycle: routeData.bicycle?.geometry,
          foot: routeData.foot?.geometry,
        }
      }));

      // Automatically display car route on map
      if (routeData.car?.geometry && map.current) {
        // Remove existing route if any
        if (map.current.getLayer(`route-${key}`)) {
          map.current.removeLayer(`route-${key}`);
        }
        if (map.current.getLayer(`route-${key}-arrows`)) {
          map.current.removeLayer(`route-${key}-arrows`);
        }
        if (map.current.getSource(`route-${key}`)) {
          map.current.removeSource(`route-${key}`);
        }

        // Add car route
        map.current.addSource(`route-${key}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: routeData.car.geometry,
          },
        });

        map.current.addLayer({
          id: `route-${key}`,
          type: 'line',
          source: `route-${key}`,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3B82F6',
            'line-width': 4,
            'line-opacity': 0.8,
          },
        });

        // Add directional arrows on the route
        map.current.addLayer({
          id: `route-${key}-arrows`,
          type: 'symbol',
          source: `route-${key}`,
          layout: {
            'symbol-placement': 'line',
            'symbol-spacing': 50,
            'text-field': '▶',
            'text-size': 16,
            'text-keep-upright': false,
            'text-rotation-alignment': 'map',
            'text-pitch-alignment': 'viewport',
          },
          paint: {
            'text-color': '#3B82F6',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        });

        setActiveRoutes(prev => ({
          ...prev,
          [key]: 'car',
        }));
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  // Calculate routes between consecutive locations using batch API
  useEffect(() => {
    const calculateRoutes = async () => {
      if (locations.length < 2) return;

      // Build segments for batch request
      const segments = [];
      for (let i = 0; i < locations.length - 1; i++) {
        const from = locations[i];
        const to = locations[i + 1];
        segments.push({
          id: `${from.id}-${to.id}`,
          from: from.coordinates,
          to: to.coordinates,
        });
      }

      try {
        // Use batch API for better performance
        const batchResults = await getRoutesBatch(segments, ["car", "bicycle", "foot"]);
        
        if (!batchResults) {
          console.error('No batch results returned from backend');
          return;
        }

        const newRouteInfos: Record<string, RouteInfo> = {};
        const newRouteGeometries: Record<string, RouteGeometry> = {};

        // Process batch results
        Object.entries(batchResults).forEach(([key, routeData]) => {
          newRouteInfos[key] = {
            car: routeData.car ? `${routeData.car.duration}m` : '0m',
            bicycle: routeData.bicycle ? `${routeData.bicycle.duration}m` : '0m',
            foot: routeData.foot ? `${routeData.foot.duration}m` : '0m',
            distance: routeData.distance_formatted,
          };

          newRouteGeometries[key] = {
            car: routeData.car?.geometry,
            bicycle: routeData.bicycle?.geometry,
            foot: routeData.foot?.geometry,
          };
        });

        setRouteInfos(newRouteInfos);
        setRouteGeometries(newRouteGeometries);

        // Automatically display all car routes on map with arrows
        if (map.current) {
          Object.entries(newRouteGeometries).forEach(([key, geometries]) => {
            if (geometries.car) {
              // Remove existing route if any
              if (map.current?.getLayer(`route-${key}`)) {
                map.current.removeLayer(`route-${key}`);
              }
              if (map.current?.getLayer(`route-${key}-arrows`)) {
                map.current.removeLayer(`route-${key}-arrows`);
              }
              if (map.current?.getSource(`route-${key}`)) {
                map.current.removeSource(`route-${key}`);
              }

              // Add car route line
              map.current?.addSource(`route-${key}`, {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: geometries.car,
                },
              });

              map.current?.addLayer({
                id: `route-${key}`,
                type: 'line',
                source: `route-${key}`,
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round',
                },
                paint: {
                  'line-color': '#3B82F6',
                  'line-width': 4,
                  'line-opacity': 0.8,
                },
              });

              // Add directional arrows along the route
              map.current?.addLayer({
                id: `route-${key}-arrows`,
                type: 'symbol',
                source: `route-${key}`,
                layout: {
                  'symbol-placement': 'line',
                  'symbol-spacing': 50,
                  'text-field': '▶',
                  'text-size': 16,
                  'text-keep-upright': false,
                  'text-rotation-alignment': 'map',
                  'text-pitch-alignment': 'viewport',
                },
                paint: {
                  'text-color': '#3B82F6',
                  'text-halo-color': '#ffffff',
                  'text-halo-width': 2,
                },
              });
            }
          });

          // Set all routes as active with car profile
          const newActiveRoutes: Record<string, string> = {};
          Object.keys(newRouteGeometries).forEach(key => {
            newActiveRoutes[key] = 'car';
          });
          setActiveRoutes(newActiveRoutes);
        }
      } catch (error) {
        console.error('Error calculating routes:', error);
      }
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

  // Handle recommendation click: zoom to location and add to itinerary
  const handleRecommendationClick = (recommendation: Recommendation) => {
    // Find the POI in our data
    const poi = poiData.find(p => p.poiID === recommendation.poi_id);
    if (!poi) {
      console.error('POI not found:', recommendation.poi_id);
      return;
    }

    // Zoom to the location
    if (map.current) {
      map.current.flyTo({
        center: recommendation.coordinates,
        zoom: 15,
        essential: true,
        duration: 1500,
      });
    }

    // Add POI to itinerary (this will open the confirmation dialog)
    addPOIToItinerary(poi);
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
    const locationIndex = locations.findIndex(loc => loc.id === locationId);
    
    // Remove route layers/sources involving this location
    if (locationIndex > 0) {
      const prevKey = `${locations[locationIndex - 1].id}-${locationId}`;
      if (map.current?.getLayer(`route-${prevKey}`)) {
        map.current.removeLayer(`route-${prevKey}`);
      }
      if (map.current?.getLayer(`route-${prevKey}-arrows`)) {
        map.current.removeLayer(`route-${prevKey}-arrows`);
      }
      if (map.current?.getSource(`route-${prevKey}`)) {
        map.current.removeSource(`route-${prevKey}`);
      }
    }
    
    if (locationIndex < locations.length - 1) {
      const nextKey = `${locationId}-${locations[locationIndex + 1].id}`;
      if (map.current?.getLayer(`route-${nextKey}`)) {
        map.current.removeLayer(`route-${nextKey}`);
      }
      if (map.current?.getLayer(`route-${nextKey}-arrows`)) {
        map.current.removeLayer(`route-${nextKey}-arrows`);
      }
      if (map.current?.getSource(`route-${nextKey}`)) {
        map.current.removeSource(`route-${nextKey}`);
      }
    }

    // Remove from state
    setLocations((prev) => prev.filter((loc) => loc.id !== locationId));

    // Clean up route info and geometries
    setRouteInfos(prev => {
      const newInfos = { ...prev };
      Object.keys(newInfos).forEach(key => {
        if (key.includes(locationId)) {
          delete newInfos[key];
        }
      });
      return newInfos;
    });

    setRouteGeometries(prev => {
      const newGeoms = { ...prev };
      Object.keys(newGeoms).forEach(key => {
        if (key.includes(locationId)) {
          delete newGeoms[key];
        }
      });
      return newGeoms;
    });

    setActiveRoutes(prev => {
      const newRoutes = { ...prev };
      Object.keys(newRoutes).forEach(key => {
        if (key.includes(locationId)) {
          delete newRoutes[key];
        }
      });
      return newRoutes;
    });

    // Reconnect remaining locations if there's a gap
    if (locationIndex > 0 && locationIndex < locations.length - 1) {
      const prevLocation = locations[locationIndex - 1];
      const nextLocation = locations[locationIndex + 1];
      // Calculate route will be triggered by the locations state change
      setTimeout(() => {
        calculateRoute(prevLocation, nextLocation);
      }, 100);
    }
  };

  // Toggle route display on map
  const toggleRouteDisplay = (locationPair: string, profile: 'car' | 'bicycle' | 'foot') => {
    const currentProfile = activeRoutes[locationPair];
    
    // If clicking the same profile, remove the route
    if (currentProfile === profile) {
      // Remove route layer, arrows, and source
      if (map.current?.getLayer(`route-${locationPair}`)) {
        map.current.removeLayer(`route-${locationPair}`);
      }
      if (map.current?.getLayer(`route-${locationPair}-arrows`)) {
        map.current.removeLayer(`route-${locationPair}-arrows`);
      }
      if (map.current?.getSource(`route-${locationPair}`)) {
        map.current.removeSource(`route-${locationPair}`);
      }
      
      setActiveRoutes(prev => {
        const newRoutes = { ...prev };
        delete newRoutes[locationPair];
        return newRoutes;
      });
      return;
    }

    // Remove existing route if any
    if (map.current?.getLayer(`route-${locationPair}`)) {
      map.current.removeLayer(`route-${locationPair}`);
    }
    if (map.current?.getLayer(`route-${locationPair}-arrows`)) {
      map.current.removeLayer(`route-${locationPair}-arrows`);
    }
    if (map.current?.getSource(`route-${locationPair}`)) {
      map.current.removeSource(`route-${locationPair}`);
    }

    // Add new route
    const geometry = routeGeometries[locationPair]?.[profile];
    if (geometry && map.current) {
      // Color based on profile
      const colors = {
        car: '#3B82F6', // blue
        bicycle: '#10B981', // green
        foot: '#F59E0B', // amber
      };

      map.current.addSource(`route-${locationPair}`, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: geometry,
        },
      });

      map.current.addLayer({
        id: `route-${locationPair}`,
        type: 'line',
        source: `route-${locationPair}`,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': colors[profile],
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });

      // Add directional arrows
      map.current.addLayer({
        id: `route-${locationPair}-arrows`,
        type: 'symbol',
        source: `route-${locationPair}`,
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 50,
          'text-field': '\u25b6',
          'text-size': 16,
          'text-keep-upright': false,
          'text-rotation-alignment': 'map',
          'text-pitch-alignment': 'viewport',
        },
        paint: {
          'text-color': colors[profile],
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
        },
      });

      setActiveRoutes(prev => ({
        ...prev,
        [locationPair]: profile,
      }));
    }
  };

  // Itinerary metadata handlers
  const handleTitleDoubleClick = () => {
    setIsEditingTitle(true);
  };

  const handleDescriptionDoubleClick = () => {
    setIsEditingDescription(true);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  const handleDescriptionBlur = () => {
    setIsEditingDescription(false);
  };

  const deleteAllItinerary = () => {
    if (window.confirm("Are you sure you want to delete the entire itinerary? This cannot be undone.")) {
      // Remove all route layers and sources from the map
      Object.keys(activeRoutes).forEach((locationPair) => {
        if (map.current?.getLayer(`route-${locationPair}`)) {
          map.current.removeLayer(`route-${locationPair}`);
        }
        if (map.current?.getLayer(`route-${locationPair}-arrows`)) {
          map.current.removeLayer(`route-${locationPair}-arrows`);
        }
        if (map.current?.getSource(`route-${locationPair}`)) {
          map.current.removeSource(`route-${locationPair}`);
        }
      });

      setLocations([]);
      setPendingLocation(null);
      setRouteInfos({});
      setRouteGeometries({});
      setActiveRoutes({});
      setItineraryTitle("My Trip");
      setItineraryDateFrom("");
      setItineraryDateTo("");
      setItineraryDescription("Add a description...");
      setIsMenuOpen(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="h-screen w-screen bg-white flex overflow-hidden relative">
      {/* Toggle Button - Fixed position on the right side */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className={`fixed top-1/2 -translate-y-1/2 z-50 bg-lakbai-green text-white p-3 rounded-l-lg shadow-lg hover:bg-lakbai-green-dark transition-all duration-200 ease-out ${
          isSidebarCollapsed ? 'right-0' : 'right-[500px]'
        }`}
        aria-label={isSidebarCollapsed ? "Open itinerary" : "Close itinerary"}
      >
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M9 5l7 7-7 7"></path>
        </svg>
      </button>

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

        {/* AI Recommendation Panel - Only show on localhost */}
        <RecommendationPanel
          recommendations={recommendations}
          onRecommendationClick={handleRecommendationClick}
          isLoading={isLoadingRecommendations}
        />

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
      <div 
        className={`fixed right-0 top-0 h-full w-[500px] bg-white flex flex-col shadow-lg border-l border-gray-200 transition-transform duration-200 ease-out z-40 ${
          isSidebarCollapsed ? 'translate-x-full' : 'translate-x-0'
        }`}
      >
        {/* Header - Note-taking Style */}
        <div className="px-8 py-6 border-b border-gray-200">
          {/* Title and Menu */}
          <div className="flex items-start justify-between mb-4">
            {isEditingTitle ? (
              <input
                type="text"
                value={itineraryTitle}
                onChange={(e) => setItineraryTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTitleBlur();
                  }
                }}
                className="text-2xl font-bold text-gray-900 border-2 border-lakbai-green rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-lakbai-green"
                autoFocus
              />
            ) : (
              <h1 
                className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-lakbai-green transition-colors"
                onDoubleClick={handleTitleDoubleClick}
                title="Double-click to edit"
              >
                {itineraryTitle}
              </h1>
            )}
            
            {/* Triple Dot Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Options menu"
              >
                <img src={menuIcon} alt="Menu" className="w-6 h-6" />
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      // TODO: Save itinerary to user account when account integration is ready
                      console.log('Save itinerary - Account integration pending');
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={deleteAllItinerary}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm text-red-600 transition-colors border-t border-gray-100"
                  >
                    Delete All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Date Range - Note-taking Style */}
          <div className="mb-4">
            {(itineraryDateFrom || itineraryDateTo) && !isEditingDates ? (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span className="text-sm text-gray-700">
                  {itineraryDateFrom && new Date(itineraryDateFrom + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {itineraryDateFrom && itineraryDateTo && ' - '}
                  {itineraryDateTo && new Date(itineraryDateTo + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setIsEditingDates(true)}
                  className="ml-auto text-xs text-lakbai-green hover:text-lakbai-green-dark font-medium"
                >
                  Edit dates
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="date"
                    value={itineraryDateFrom}
                    onChange={(e) => setItineraryDateFrom(e.target.value)}
                    placeholder="Start date"
                    className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lakbai-green focus:border-transparent hover:border-lakbai-green transition-colors"
                  />
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="date"
                    value={itineraryDateTo}
                    onChange={(e) => setItineraryDateTo(e.target.value)}
                    placeholder="End date"
                    className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lakbai-green focus:border-transparent hover:border-lakbai-green transition-colors"
                  />
                </div>
                {(itineraryDateFrom || itineraryDateTo) && (
                  <button
                    onClick={() => setIsEditingDates(false)}
                    className="text-xs text-lakbai-green hover:text-lakbai-green-dark font-medium"
                  >
                    Done
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {isEditingDescription ? (
            <textarea
              value={itineraryDescription}
              onChange={(e) => setItineraryDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              className="w-full px-3 py-2 text-sm text-gray-700 border-2 border-lakbai-green rounded-xl focus:outline-none focus:ring-2 focus:ring-lakbai-green resize-none"
              rows={3}
              autoFocus
            />
          ) : (
            <p 
              className="text-sm text-gray-600 italic cursor-pointer hover:text-lakbai-green transition-colors"
              onDoubleClick={handleDescriptionDoubleClick}
              title="Double-click to edit"
            >
              {itineraryDescription}
            </p>
          )}
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
                              <button
                                onClick={() => toggleRouteDisplay(`${location.id}-${locations[index + 1].id}`, 'car')}
                                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all flex-1 ${
                                  activeRoutes[`${location.id}-${locations[index + 1].id}`] === 'car'
                                    ? 'bg-blue-100 text-blue-700 font-semibold shadow-md border-2 border-blue-300'
                                    : 'hover:bg-gray-100 border-2 border-transparent'
                                }`}
                              >
                                <img src={carIcon} alt="Car" className="w-5 h-5" />
                                <span className="text-xs">
                                  {routeInfos[`${location.id}-${locations[index + 1].id}`].car}
                                </span>
                                <span className="text-[10px] text-gray-500">Car</span>
                              </button>
                              <button
                                onClick={() => toggleRouteDisplay(`${location.id}-${locations[index + 1].id}`, 'bicycle')}
                                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all flex-1 ${
                                  activeRoutes[`${location.id}-${locations[index + 1].id}`] === 'bicycle'
                                    ? 'bg-green-100 text-green-700 font-semibold shadow-md border-2 border-green-300'
                                    : 'hover:bg-gray-100 border-2 border-transparent'
                                }`}
                              >
                                <img src={bicycleIcon} alt="Bicycle" className="w-5 h-5" />
                                <span className="text-xs">
                                  {routeInfos[`${location.id}-${locations[index + 1].id}`].bicycle}
                                </span>
                                <span className="text-[10px] text-gray-500">Bike</span>
                              </button>
                              <button
                                onClick={() => toggleRouteDisplay(`${location.id}-${locations[index + 1].id}`, 'foot')}
                                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all flex-1 ${
                                  activeRoutes[`${location.id}-${locations[index + 1].id}`] === 'foot'
                                    ? 'bg-amber-100 text-amber-700 font-semibold shadow-md border-2 border-amber-300'
                                    : 'hover:bg-gray-100 border-2 border-transparent'
                                }`}
                              >
                                <img src={walkIcon} alt="Walk" className="w-5 h-5" />
                                <span className="text-xs">
                                  {routeInfos[`${location.id}-${locations[index + 1].id}`].foot}
                                </span>
                                <span className="text-[10px] text-gray-500">Walk</span>
                              </button>
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
