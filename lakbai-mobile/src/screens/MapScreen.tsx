import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, type LatLng } from 'react-native-maps';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { COLORS, LEGAZPI_REGION } from '../lib/constants';
import { loadPOIData, POI } from '../lib/poiData';
import { getRecommendations, type Recommendation } from '../lib/recommendationService';
import { getRoutesBatch, type RouteSegment, type RouteResponse } from '../lib/routingService';

// Import SVG as components
import LakbaiLogo from '../../assets/lakbai.svg';
import HomeIcon from '../../assets/material-symbols--home-rounded.svg';
import MapIcon from '../../assets/solar--map-bold.svg';
import SettingsIcon from '../../assets/tdesign--setting-filled.svg';
import ProfileIcon from '../../assets/blank-profile.svg';
import DateIcon from '../../assets/date-fill.svg';

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

export default function MapScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);
  const { itineraryId } = route.params || {};
  
  const [poiData, setPOIData] = useState<POI[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pendingLocation, setPendingLocation] = useState<Location | null>(null);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Itinerary metadata
  const [itineraryTitle, setItineraryTitle] = useState('My Trip');
  const [itineraryDateFrom, setItineraryDateFrom] = useState('');
  const [itineraryDateTo, setItineraryDateTo] = useState('');
  const [itineraryDescription, setItineraryDescription] = useState('Add a description...');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  
  const [currentItineraryId, setCurrentItineraryId] = useState<string | null>(itineraryId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null);
  const [savedItineraries, setSavedItineraries] = useState<any[]>([]);
  const [isItineraryMenuOpen, setIsItineraryMenuOpen] = useState(false);
  
  // Recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  
  // Routing
  const [routeCoordinates, setRouteCoordinates] = useState<Record<string, LatLng[]>>({});
  const [routeInfos, setRouteInfos] = useState<Record<string, any>>({});
  const [transportMode, setTransportMode] = useState<'car' | 'bicycle' | 'foot'>('car');
  
  // Load POI data
  useEffect(() => {
    loadPOIData().then(setPOIData);
  }, []);
  
  // Load user profile picture
  useEffect(() => {
    const loadProfilePicture = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('profile_picture_url')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data?.profile_picture_url) {
          setUserProfilePicture(data.profile_picture_url);
        }
      } catch (error) {
        console.error('Error loading profile picture:', error);
      }
    };
    
    loadProfilePicture();
  }, [user]);
  
  // Load saved itineraries
  useEffect(() => {
    const loadSavedItineraries = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('itineraries')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          setSavedItineraries(data);
        }
      } catch (error) {
        console.error('Error loading saved itineraries:', error);
      }
    };
    
    loadSavedItineraries();
  }, [user]);
  
  // Load itinerary if ID provided
  useEffect(() => {
    if (itineraryId) {
      loadItinerary(itineraryId);
    }
  }, [itineraryId]);
  
  // Fetch AI recommendations when locations change
  useEffect(() => {
    const fetchRecommendations = async () => {
      // Only fetch if we have locations
      if (locations.length === 0) {
        console.log('🤖 No locations yet, skipping recommendations');
        setRecommendations([]);
        setIsLoadingRecommendations(false);
        return;
      }
      
      const currentRoute = locations
        .filter(loc => loc.confirmed) // Only use confirmed locations
        .map(loc => loc.poiID);
      
      console.log('🤖 Fetching recommendations for route:', currentRoute);
      setIsLoadingRecommendations(true);
      
      try {
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
  
  // Calculate routes when locations change
  useEffect(() => {
    const calculateRoutes = async () => {
      if (locations.length < 2) {
        setRouteCoordinates({});
        setRouteInfos({});
        return;
      }

      // Build segments for batch request
      const segments: RouteSegment[] = [];
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
        const batchResults = await getRoutesBatch(segments, ['car', 'bicycle', 'foot']);
        
        if (!batchResults) {
          console.error('No batch results returned from backend');
          return;
        }

        const newRouteInfos: Record<string, any> = {};
        const newRouteCoordinates: Record<string, LatLng[]> = {};

        // Process batch results
        Object.entries(batchResults).forEach(([key, routeData]: [string, RouteResponse]) => {
          newRouteInfos[key] = {
            car: routeData.car ? `${routeData.car.duration}m` : '0m',
            bicycle: routeData.bicycle ? `${routeData.bicycle.duration}m` : '0m',
            foot: routeData.foot ? `${routeData.foot.duration}m` : '0m',
            distance: routeData.distance_formatted,
          };

          // Convert GeoJSON coordinates to React Native Maps format
          const modeData = routeData[transportMode];
          if (modeData && modeData.geometry && modeData.geometry.coordinates) {
            const coords: LatLng[] = modeData.geometry.coordinates.map((coord: number[]) => ({
              latitude: coord[1],
              longitude: coord[0],
            }));
            newRouteCoordinates[key] = coords;
          }
        });

        setRouteInfos(newRouteInfos);
        setRouteCoordinates(newRouteCoordinates);
      } catch (error) {
        console.error('Error calculating routes:', error);
      }
    };

    calculateRoutes();
  }, [locations, transportMode]);
  
  const loadItinerary = async (id: string) => {
    try {
      const { data: itinerary, error: itineraryError } = await supabase
        .from('itineraries')
        .select('*')
        .eq('id', id)
        .single();
      
      if (itineraryError) throw itineraryError;
      
      if (itinerary) {
        setItineraryTitle(itinerary.name || 'My Trip');
        setItineraryDateFrom(itinerary.date_from || '');
        setItineraryDateTo(itinerary.date_to || '');
        setItineraryDescription(itinerary.description || 'Add a description...');
        setCurrentItineraryId(itinerary.id);
        
        // Load locations
        const { data: locationsData, error: locationsError } = await supabase
          .from('itinerary_locations')
          .select('*')
          .eq('itinerary_id', id)
          .order('order_index', { ascending: true });
        
        if (locationsError) throw locationsError;
        
        if (locationsData) {
          const mappedLocations: Location[] = locationsData.map((loc: any) => ({
            id: loc.id,
            poiID: loc.poi_id,
            name: loc.name,
            category: loc.category || 'Other',
            tags: [],
            date: loc.visit_date || '',
            startTime: loc.start_time || '',
            endTime: loc.end_time || '',
            coordinates: [loc.longitude, loc.latitude],
            confirmed: true,
          }));
          setLocations(mappedLocations);
          setIsSidebarCollapsed(false);
        }
        
        setIsItineraryMenuOpen(false);
      }
    } catch (error) {
      console.error('Error loading itinerary:', error);
      Alert.alert('Error', 'Failed to load itinerary');
    }
  };
  
  // Create new itinerary
  const createNewItinerary = () => {
    Alert.alert(
      'Create New Itinerary',
      'This will clear your current itinerary. Any unsaved changes will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Create',
          onPress: () => {
            setLocations([]);
            setPendingLocation(null);
            setEditingLocationId(null);
            setItineraryTitle('My Trip');
            setItineraryDateFrom('');
            setItineraryDateTo('');
            setItineraryDescription('Add a description...');
            setCurrentItineraryId(null);
            setIsItineraryMenuOpen(false);
          },
        },
      ]
    );
  };
  
  // Delete itinerary
  const deleteItinerary = async (id: string) => {
    if (!user) return;
    
    Alert.alert(
      'Delete Itinerary',
      'Are you sure you want to delete this itinerary? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('itineraries')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              
              // Reload saved itineraries
              const { data } = await supabase
                .from('itineraries')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });
              
              if (data) {
                setSavedItineraries(data);
              }
              
              // If deleted current itinerary, create new one
              if (id === currentItineraryId) {
                setLocations([]);
                setPendingLocation(null);
                setEditingLocationId(null);
                setItineraryTitle('My Trip');
                setItineraryDateFrom('');
                setItineraryDateTo('');
                setItineraryDescription('Add a description...');
                setCurrentItineraryId(null);
              }
              
              setIsItineraryMenuOpen(false);
            } catch (error) {
              console.error('Error deleting itinerary:', error);
              Alert.alert('Error', 'Failed to delete itinerary');
            }
          },
        },
      ]
    );
  };
  
  // Handle recommendation click - add to itinerary as pending
  const handleRecommendationClick = (rec: Recommendation) => {
    const poi: POI = {
      poiID: rec.poi_id,
      poiName: rec.name,
      theme: rec.theme,
      lat: rec.coordinates[1],
      long: rec.coordinates[0],
    };
    addPOIToItinerary(poi);
  };
  
  const addPOIToItinerary = (poi: POI) => {
    const today = new Date().toISOString().split('T')[0];
    const newLocation: Location = {
      id: Date.now().toString(),
      poiID: poi.poiID,
      name: poi.poiName,
      category: poi.theme,
      tags: [poi.theme],
      date: today,
      startTime: '09:00',
      endTime: '10:00',
      coordinates: [poi.long, poi.lat],
      confirmed: false,
    };
    setPendingLocation(newLocation);
    setIsSidebarCollapsed(false);
  };

  const confirmLocation = () => {
    if (pendingLocation) {
      const confirmedLocation = { ...pendingLocation, confirmed: true };
      setLocations([...locations, confirmedLocation]);
      setPendingLocation(null);
    }
  };

  const cancelPendingLocation = () => {
    setPendingLocation(null);
  };

  const handlePendingTimeChange = (
    field: 'startTime' | 'endTime' | 'date',
    value: string
  ) => {
    if (pendingLocation) {
      setPendingLocation({ ...pendingLocation, [field]: value });
    }
  };

  const handleTimeChange = (
    locationId: string,
    field: 'startTime' | 'endTime' | 'date',
    value: string
  ) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === locationId ? { ...loc, [field]: value } : loc))
    );
  };

  const toggleEditLocation = (locationId: string) => {
    setEditingLocationId(editingLocationId === locationId ? null : locationId);
  };

  const saveLocationEdit = (locationId: string) => {
    setEditingLocationId(null);
  };
  
  const removeLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id));
  };
  
  const saveItinerary = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save itineraries');
      return;
    }
    
    if (locations.length === 0) {
      Alert.alert('Error', 'Add at least one location to your itinerary');
      return;
    }
    
    setIsSaving(true);
    
    try {
      let itineraryId = currentItineraryId;
      
      // Create or update itinerary
      if (itineraryId) {
        const { error: updateError } = await supabase
          .from('itineraries')
          .update({
            name: itineraryTitle,
            date_from: itineraryDateFrom || null,
            date_to: itineraryDateTo || null,
            description: itineraryDescription,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itineraryId);
        
        if (updateError) throw updateError;
        
        // Delete existing locations
        await supabase
          .from('itinerary_locations')
          .delete()
          .eq('itinerary_id', itineraryId);
      } else {
        const { data: newItinerary, error: insertError } = await supabase
          .from('itineraries')
          .insert({
            user_id: user.id,
            name: itineraryTitle,
            date_from: itineraryDateFrom || null,
            date_to: itineraryDateTo || null,
            description: itineraryDescription,
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        itineraryId = newItinerary.id;
        setCurrentItineraryId(itineraryId);
      }
      
      // Insert locations
      const locationsToInsert = locations.map((loc, index) => ({
        itinerary_id: itineraryId,
        poi_id: loc.poiID,
        name: loc.name,
        category: loc.category,
        latitude: loc.coordinates[1],
        longitude: loc.coordinates[0],
        visit_date: loc.date || null,
        start_time: loc.startTime || null,
        end_time: loc.endTime || null,
        order_index: index,
      }));
      
      const { error: locationsError } = await supabase
        .from('itinerary_locations')
        .insert(locationsToInsert);
      
      if (locationsError) throw locationsError;
      
      Alert.alert('Success', 'Itinerary saved successfully!');
    } catch (error: any) {
      console.error('Error saving itinerary:', error);
      Alert.alert('Error', 'Failed to save itinerary');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigation.replace('Auth');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };
  
  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('profiles').delete().eq('id', user?.id);
              await supabase.auth.signOut();
              navigation.replace('Auth');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Top Bar with Profile, Settings, Version */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBarButton}
          onPress={() => navigation.navigate('Home')}
        >
          {userProfilePicture ? (
            <Image
              source={{ uri: userProfilePicture }}
              style={styles.profileImage}
            />
          ) : (
            <ProfileIcon width={40} height={40} fill={COLORS.gray[700]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.topBarButton}
          onPress={() => setIsSettingsOpen(true)}
        >
          <SettingsIcon width={28} height={28} fill={COLORS.gray[700]} />
        </TouchableOpacity>

        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>v1.0</Text>
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={LEGAZPI_REGION}
        >
          {poiData.map((poi) => (
            <Marker
              key={poi.poiID}
              coordinate={{ latitude: poi.lat, longitude: poi.long }}
              title={poi.poiName}
              description={poi.theme}
              onPress={() => addPOIToItinerary(poi)}
            />
          ))}
          
          {/* Draw routes between locations */}
          {Object.entries(routeCoordinates).map(([key, coords]) => (
            <Polyline
              key={key}
              coordinates={coords}
              strokeColor="#3B82F6"
              strokeWidth={4}
            />
          ))}
        </MapView>
        
        {/* AI Recommendations Panel */}
        {showRecommendations && (
          <View style={styles.recommendationPanel}>
            <TouchableOpacity 
              style={styles.recommendationHeader}
              onPress={() => setShowRecommendations(false)}
            >
              <View style={styles.recommendationHeaderLeft}>
                <Text style={styles.recommendationIcon}>✨</Text>
                <Text style={styles.recommendationTitle}>AI Recommendations</Text>
                <View style={styles.recommendationBadge}>
                  <Text style={styles.recommendationBadgeText}>{recommendations.length}</Text>
                </View>
              </View>
              <Text style={styles.collapseIcon}>−</Text>
            </TouchableOpacity>
            
            {isLoadingRecommendations ? (
              <View style={styles.recommendationLoading}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.recommendationLoadingText}>Finding recommendations...</Text>
              </View>
            ) : recommendations.length === 0 ? (
              <View style={styles.recommendationEmpty}>
                <Text style={styles.recommendationEmptyIcon}>✨</Text>
                <Text style={styles.recommendationEmptyTitle}>AI Ready!</Text>
                <Text style={styles.recommendationEmptyText}>
                  Add a location to get personalized suggestions
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.recommendationList}>
                {(showAllRecommendations ? recommendations : recommendations.slice(0, 3)).map((rec, index) => (
                  <TouchableOpacity
                    key={rec.poi_id}
                    style={styles.recommendationItem}
                    onPress={() => handleRecommendationClick(rec)}
                  >
                    <View style={styles.recommendationRank}>
                      <Text style={styles.recommendationRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.recommendationContent}>
                      <Text style={styles.recommendationName}>{rec.name}</Text>
                      <View style={styles.recommendationMeta}>
                        <View style={styles.recommendationThemeBadge}>
                          <Text style={styles.recommendationThemeText}>{rec.theme}</Text>
                        </View>
                        <Text style={styles.recommendationScore}>
                          {(rec.score * 100).toFixed(0)}%
                        </Text>
                      </View>
                      <Text style={styles.recommendationReason} numberOfLines={2}>
                        {rec.reason}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                
                {recommendations.length > 3 && (
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => setShowAllRecommendations(!showAllRecommendations)}
                  >
                    <Text style={styles.showMoreText}>
                      {showAllRecommendations ? 'Show Less ▲' : `Show More (${recommendations.length - 3}) ▼`}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        )}
        
        {/* Show recommendations button when collapsed */}
        {!showRecommendations && (
          <TouchableOpacity
            style={styles.showRecommendationsButton}
            onPress={() => setShowRecommendations(true)}
          >
            <Text style={styles.showRecommendationsIcon}>✨</Text>
            <Text style={styles.showRecommendationsText}>
              {recommendations.length} AI Suggestions
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Transport Mode Selector */}
        {locations.length > 1 && (
          <View style={styles.transportModeSelector}>
            <TouchableOpacity
              style={[styles.transportModeButton, transportMode === 'car' && styles.transportModeActive]}
              onPress={() => setTransportMode('car')}
            >
              <Text style={[styles.transportModeText, transportMode === 'car' && styles.transportModeTextActive]}>
                🚗 Car
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.transportModeButton, transportMode === 'bicycle' && styles.transportModeActive]}
              onPress={() => setTransportMode('bicycle')}
            >
              <Text style={[styles.transportModeText, transportMode === 'bicycle' && styles.transportModeTextActive]}>
                🚴 Bike
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.transportModeButton, transportMode === 'foot' && styles.transportModeActive]}
              onPress={() => setTransportMode('foot')}
            >
              <Text style={[styles.transportModeText, transportMode === 'foot' && styles.transportModeTextActive]}>
                🚶 Walk
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Itinerary Sidebar */}
      {!isSidebarCollapsed && (
        <View style={styles.itinerarySidebar}>
          <View style={styles.sidebarHeader}>
            <TouchableOpacity onPress={() => setIsItineraryMenuOpen(true)} style={styles.menuButton}>
              <Text style={styles.menuIcon}>⋮</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsSidebarCollapsed(true)}>
              <Text style={styles.collapseButton}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.sidebarContent} contentContainerStyle={styles.sidebarContentContainer}>
            {/* Title */}
            {isEditingTitle ? (
              <TextInput
                style={styles.titleInput}
                value={itineraryTitle}
                onChangeText={setItineraryTitle}
                onBlur={() => setIsEditingTitle(false)}
                autoFocus
              />
            ) : (
              <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
                <Text style={styles.title}>{itineraryTitle}</Text>
              </TouchableOpacity>
            )}
            
            {/* Dates */}
            <View style={styles.datesContainer}>
              <DateIcon width={16} height={16} fill={COLORS.primary} />
              {isEditingDates ? (
                <View>
                  <TextInput
                    style={styles.dateInput}
                    value={itineraryDateFrom}
                    onChangeText={setItineraryDateFrom}
                    placeholder="From (YYYY-MM-DD)"
                  />
                  <TextInput
                    style={styles.dateInput}
                    value={itineraryDateTo}
                    onChangeText={setItineraryDateTo}
                    placeholder="To (YYYY-MM-DD)"
                    onBlur={() => setIsEditingDates(false)}
                  />
                </View>
              ) : (
                <TouchableOpacity onPress={() => setIsEditingDates(true)}>
                  <Text style={styles.dates}>
                    {itineraryDateFrom && itineraryDateTo
                      ? `${itineraryDateFrom} - ${itineraryDateTo}`
                      : 'Add dates'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Description */}
            {isEditingDescription ? (
              <TextInput
                style={styles.descriptionInput}
                value={itineraryDescription}
                onChangeText={setItineraryDescription}
                onBlur={() => setIsEditingDescription(false)}
                multiline
                numberOfLines={3}
                autoFocus
              />
            ) : (
              <TouchableOpacity onPress={() => setIsEditingDescription(true)}>
                <Text style={styles.description}>{itineraryDescription}</Text>
              </TouchableOpacity>
            )}
            
            {/* Locations List */}
            {/* Pending Location Confirmation */}
            {pendingLocation && (
              <View style={styles.pendingLocationCard}>
                <View style={styles.pendingLocationHeader}>
                  <View style={styles.pendingDot} />
                  <View style={styles.pendingLocationInfo}>
                    <Text style={styles.pendingLocationName}>{pendingLocation.name}</Text>
                    <Text style={styles.pendingLocationCategory}>{pendingLocation.category}</Text>
                    
                    {/* Date and Time Inputs */}
                    <View style={styles.timeInputsContainer}>
                      <View style={styles.timeInputRow}>
                        <Text style={styles.timeLabel}>Date:</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={pendingLocation.date}
                          onChangeText={(value) => handlePendingTimeChange('date', value)}
                          placeholder="YYYY-MM-DD"
                        />
                      </View>
                      <View style={styles.timeInputRow}>
                        <Text style={styles.timeLabel}>From:</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={pendingLocation.startTime}
                          onChangeText={(value) => handlePendingTimeChange('startTime', value)}
                          placeholder="HH:MM"
                        />
                      </View>
                      <View style={styles.timeInputRow}>
                        <Text style={styles.timeLabel}>To:</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={pendingLocation.endTime}
                          onChangeText={(value) => handlePendingTimeChange('endTime', value)}
                          placeholder="HH:MM"
                        />
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.pendingLocationActions}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={confirmLocation}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelPendingLocation}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {locations.length === 0 && !pendingLocation ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No locations yet</Text>
                <Text style={styles.emptyStateText}>
                  Click on any marker on the map to add locations to your itinerary
                </Text>
              </View>
            ) : (
              <View style={styles.locationsList}>
                <Text style={styles.locationsTitle}>Locations ({locations.length})</Text>
                {locations.map((location, index) => (
                  <View key={location.id} style={styles.locationCard}>
                    {editingLocationId === location.id ? (
                      <View style={styles.editingLocationCard}>
                        <View style={styles.locationHeader}>
                          <Text style={styles.locationNumber}>{index + 1}</Text>
                          <View style={styles.locationInfo}>
                            <Text style={styles.locationName}>{location.name}</Text>
                            <Text style={styles.locationCategory}>{location.category}</Text>
                          </View>
                        </View>
                        
                        {/* Date and Time Inputs for editing */}
                        <View style={styles.timeInputsContainer}>
                          <View style={styles.timeInputRow}>
                            <Text style={styles.timeLabel}>Date:</Text>
                            <TextInput
                              style={styles.timeInput}
                              value={location.date}
                              onChangeText={(value) => handleTimeChange(location.id, 'date', value)}
                              placeholder="YYYY-MM-DD"
                            />
                          </View>
                          <View style={styles.timeInputRow}>
                            <Text style={styles.timeLabel}>From:</Text>
                            <TextInput
                              style={styles.timeInput}
                              value={location.startTime}
                              onChangeText={(value) => handleTimeChange(location.id, 'startTime', value)}
                              placeholder="HH:MM"
                            />
                          </View>
                          <View style={styles.timeInputRow}>
                            <Text style={styles.timeLabel}>To:</Text>
                            <TextInput
                              style={styles.timeInput}
                              value={location.endTime}
                              onChangeText={(value) => handleTimeChange(location.id, 'endTime', value)}
                              placeholder="HH:MM"
                            />
                          </View>
                        </View>
                        
                        <View style={styles.editLocationActions}>
                          <TouchableOpacity
                            style={styles.saveEditButton}
                            onPress={() => saveLocationEdit(location.id)}
                          >
                            <Text style={styles.saveEditButtonText}>Done</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.locationCardContent}>
                        <View style={styles.locationHeader}>
                          <Text style={styles.locationNumber}>{index + 1}</Text>
                          <View style={styles.locationInfo}>
                            <Text style={styles.locationName}>{location.name}</Text>
                            <Text style={styles.locationCategory}>{location.category}</Text>
                            <Text style={styles.locationTime}>
                              {location.date} • {location.startTime} - {location.endTime}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.locationActions}>
                          <TouchableOpacity onPress={() => toggleEditLocation(location.id)}>
                            <Text style={styles.editButton}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => removeLocation(location.id)}>
                            <Text style={styles.removeButton}>×</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
            
            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={saveItinerary}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {currentItineraryId ? 'Update Itinerary' : 'Save Itinerary'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
      
      {/* Expand Sidebar Button */}
      {isSidebarCollapsed && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsSidebarCollapsed(false)}
        >
          <Text style={styles.expandButtonText}>☰</Text>
        </TouchableOpacity>
      )}
      
      {/* Itinerary Menu Modal */}
      <Modal
        visible={isItineraryMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsItineraryMenuOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsItineraryMenuOpen(false)}
        >
          <View style={styles.itineraryMenuModal}>
            <TouchableOpacity 
              style={styles.newItineraryButton}
              onPress={createNewItinerary}
            >
              <Text style={styles.newItineraryButtonText}>+ New Itinerary</Text>
            </TouchableOpacity>
            
            {savedItineraries.length > 0 && (
              <>
                <View style={styles.menuDivider} />
                <Text style={styles.savedItinerariesHeader}>Saved Itineraries</Text>
                <ScrollView style={styles.savedItinerariesList}>
                  {savedItineraries.map((itinerary) => {
                    const isCurrentItinerary = itinerary.id === currentItineraryId;
                    return (
                      <View 
                        key={itinerary.id}
                        style={[
                          styles.savedItineraryItem,
                          isCurrentItinerary && styles.currentItineraryItem
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.itineraryItemInfo}
                          onPress={() => loadItinerary(itinerary.id)}
                        >
                          <Text style={styles.itineraryItemName}>{itinerary.name}</Text>
                          <Text style={styles.itineraryItemDates}>
                            {itinerary.date_from} - {itinerary.date_to}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteItineraryButton}
                          onPress={() => deleteItinerary(itinerary.id)}
                        >
                          <Text style={styles.deleteItineraryIcon}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Settings Modal */}
      <Modal visible={isSettingsOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settings</Text>
            
            <TouchableOpacity style={styles.modalButton} onPress={handleSignOut}>
              <Text style={styles.modalButtonText}>Sign Out</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.dangerButton]}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.modalButtonTextDanger}>Delete Account</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setIsSettingsOpen(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Home')}
        >
          <HomeIcon width={28} height={28} fill={COLORS.gray[700]} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navButton, styles.navButtonActive]}>
          <MapIcon width={28} height={28} fill={COLORS.white} />
          <Text style={styles.navLabelActive}>Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    gap: 12,
  },
  topBarButton: {
    padding: 2,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  versionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: COLORS.gray[100],
    borderRadius: 10,
  },
  versionText: {
    fontSize: 10,
    color: COLORS.gray[700],
    fontWeight: '600',
  },
  mapWrapper: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  itinerarySidebar: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: '50%',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  menuButton: {
    padding: 3,
  },
  menuIcon: {
    fontSize: 20,
    color: COLORS.gray[700],
    fontWeight: 'bold',
  },
  collapseButton: {
    fontSize: 24,
    color: COLORS.gray[700],
    fontWeight: 'bold',
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarContentContainer: {
    padding: 12,
    paddingBottom: 80,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingBottom: 4,
  },
  datesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dates: {
    fontSize: 12,
    color: COLORS.gray[700],
  },
  dateInput: {
    fontSize: 12,
    color: COLORS.gray[700],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 4,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray[700],
    marginBottom: 16,
  },
  descriptionInput: {
    fontSize: 14,
    color: COLORS.gray[700],
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  locationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  locationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationNumber: {
    width: 28,
    height: 28,
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  locationCategory: {
    fontSize: 11,
    color: COLORS.gray[700],
  },
  removeButton: {
    fontSize: 24,
    color: COLORS.gray[500],
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  expandButton: {
    position: 'absolute',
    bottom: 80,
    right: 12,
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  expandButtonText: {
    fontSize: 20,
    color: COLORS.white,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    paddingVertical: 12,
    paddingHorizontal: 32,
    justifyContent: 'space-around',
  },
  navButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  navButtonActive: {
    backgroundColor: COLORS.primary,
  },
  navLabel: {
    fontSize: 12,
    color: COLORS.gray[700],
    marginTop: 4,
    fontWeight: '500',
  },
  navLabelActive: {
    fontSize: 12,
    color: COLORS.white,
    marginTop: 4,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    padding: 14,
    backgroundColor: COLORS.gray[100],
    borderRadius: 8,
    marginBottom: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  dangerButton: {
    backgroundColor: '#fee',
  },
  modalButtonTextDanger: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c00',
    textAlign: 'center',
  },
  pendingLocationCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  pendingLocationHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  pendingDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  pendingLocationInfo: {
    flex: 1,
  },
  pendingLocationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  pendingLocationCategory: {
    fontSize: 14,
    color: COLORS.gray[700],
    marginBottom: 12,
  },
  timeInputsContainer: {
    gap: 8,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[700],
    width: 45,
  },
  timeInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: COLORS.gray[900],
  },
  pendingLocationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 12,
    backgroundColor: COLORS.gray[200],
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: COLORS.gray[700],
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.gray[700],
    textAlign: 'center',
  },
  locationsList: {
    marginBottom: 16,
  },
  locationCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editButton: {
    fontSize: 18,
    paddingHorizontal: 8,
  },
  locationTime: {
    fontSize: 12,
    color: COLORS.gray[700],
    marginTop: 4,
  },
  editingLocationCard: {
    width: '100%',
  },
  editLocationActions: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  saveEditButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveEditButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  // Itinerary Menu Modal
  itineraryMenuModal: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  newItineraryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  newItineraryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 16,
  },
  savedItinerariesHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  savedItinerariesList: {
    maxHeight: 300,
  },
  savedItineraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.gray[50],
  },
  currentItineraryItem: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  itineraryItemInfo: {
    flex: 1,
  },
  itineraryItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  itineraryItemDates: {
    fontSize: 12,
    color: COLORS.gray[700],
  },
  deleteItineraryButton: {
    padding: 8,
  },
  deleteItineraryIcon: {
    fontSize: 20,
  },
  // Recommendations Panel
  recommendationPanel: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 320,
    maxHeight: '60%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  recommendationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendationIcon: {
    fontSize: 20,
  },
  recommendationTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  recommendationBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  collapseIcon: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  recommendationLoading: {
    padding: 24,
    alignItems: 'center',
  },
  recommendationLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.gray[700],
  },
  recommendationEmpty: {
    padding: 24,
    alignItems: 'center',
  },
  recommendationEmptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  recommendationEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  recommendationEmptyText: {
    fontSize: 12,
    color: COLORS.gray[700],
    textAlign: 'center',
  },
  recommendationList: {
    maxHeight: 400,
  },
  recommendationItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  recommendationRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendationRankText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  recommendationThemeBadge: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendationThemeText: {
    fontSize: 11,
    color: COLORS.gray[700],
  },
  recommendationScore: {
    fontSize: 11,
    color: COLORS.gray[700],
  },
  recommendationReason: {
    fontSize: 13,
    color: COLORS.gray[700],
    lineHeight: 18,
  },
  showMoreButton: {
    padding: 12,
    backgroundColor: COLORS.gray[50],
    alignItems: 'center',
  },
  showMoreText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  showRecommendationsButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    gap: 8,
  },
  showRecommendationsIcon: {
    fontSize: 18,
  },
  showRecommendationsText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  // Transport Mode Selector
  transportModeSelector: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  transportModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
  },
  transportModeActive: {
    backgroundColor: COLORS.primary,
  },
  transportModeText: {
    fontSize: 12,
    color: COLORS.gray[700],
    fontWeight: '600',
  },
  transportModeTextActive: {
    color: COLORS.white,
  },
});
