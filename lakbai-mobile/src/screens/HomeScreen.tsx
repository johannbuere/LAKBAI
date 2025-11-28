import React, { useState, useEffect } from 'react';
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
  FlatList,
} from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/constants';
import { countries } from '../lib/countries';

// Import SVG as components
import LakbaiLogo from '../../assets/lakbai.svg';
import HomeIcon from '../../assets/material-symbols--home-rounded.svg';
import MapIcon from '../../assets/solar--map-bold.svg';
import SettingsIcon from '../../assets/tdesign--setting-filled.svg';
import ProfileIcon from '../../assets/blank-profile.svg';
import DeleteIcon from '../../assets/delete-fill.svg';

export default function HomeScreen({ navigation }: any) {
  const { user: authUser, signOut } = useAuth();
  
  const [user, setUser] = useState({
    username: authUser?.email?.split('@')[0] || 'User',
    profession: 'Add profession',
    location: 'Add location',
    country: 'Philippines',
    countryCode: 'PH',
    joinDate: new Date().toISOString().split('T')[0],
    bio: 'Add a bio to tell others about yourself...',
    profilePicture: null as string | null,
    favoriteItineraryId: null as string | null,
    favoriteItinerary: '',
  });
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [isLoadingItineraries, setIsLoadingItineraries] = useState(true);
  
  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!authUser) return;
      
      setIsLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          // Load itineraries to get favorite name
          const { data: itinerariesData } = await supabase
            .from('itineraries')
            .select('*')
            .eq('user_id', authUser.id)
            .order('updated_at', { ascending: false });
          
          const favoriteItinerary = itinerariesData?.find(
            (itin: any) => itin.id === data.favorite_itinerary_id
          );
          
          setUser({
            username: data.username || authUser.email?.split('@')[0] || 'User',
            profession: data.profession || 'Add profession',
            location: data.location || 'Add location',
            country: data.country || 'Philippines',
            countryCode: data.country_code || 'PH',
            joinDate: data.join_date || new Date().toISOString().split('T')[0],
            bio: data.bio || 'Add a bio to tell others about yourself...',
            profilePicture: data.profile_picture_url,
            favoriteItineraryId: data.favorite_itinerary_id,
            favoriteItinerary: favoriteItinerary?.name || '',
          });
          setEditedUser({
            username: data.username || authUser.email?.split('@')[0] || 'User',
            profession: data.profession || 'Add profession',
            location: data.location || 'Add location',
            country: data.country || 'Philippines',
            countryCode: data.country_code || 'PH',
            joinDate: data.join_date || new Date().toISOString().split('T')[0],
            bio: data.bio || 'Add a bio to tell others about yourself...',
            profilePicture: data.profile_picture_url,
            favoriteItineraryId: data.favorite_itinerary_id,
            favoriteItinerary: favoriteItinerary?.name || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    loadProfile();
  }, [authUser]);
  
  // Load itineraries
  useEffect(() => {
    const loadItineraries = async () => {
      if (!authUser) return;
      
      setIsLoadingItineraries(true);
      try {
        const { data, error } = await supabase
          .from('itineraries')
          .select('*')
          .eq('user_id', authUser.id)
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          setItineraries(data);
        }
      } catch (error) {
        console.error('Error loading itineraries:', error);
      } finally {
        setIsLoadingItineraries(false);
      }
    };
    
    loadItineraries();
  }, [authUser]);
  
  const handleSaveProfile = async () => {
    if (!authUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editedUser.username,
          profession: editedUser.profession,
          location: editedUser.location,
          country: editedUser.country,
          country_code: editedUser.countryCode,
          join_date: editedUser.joinDate,
          bio: editedUser.bio,
        })
        .eq('id', authUser.id);
      
      if (error) throw error;
      
      setUser({ ...editedUser });
      setIsEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };
  
  const handleDeleteItinerary = async (id: string) => {
    Alert.alert(
      'Delete Itinerary',
      'Are you sure you want to delete this itinerary?',
      [
        { text: 'Cancel', style: 'cancel' },
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
              
              setItineraries(itineraries.filter(item => item.id !== id));
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete itinerary');
            }
          },
        },
      ]
    );
  };
  
  const handleToggleFavorite = async (id: string) => {
    const itinerary = itineraries.find(item => item.id === id);
    if (!itinerary || !authUser) return;
    
    const newFavoriteState = !itinerary.is_favorite;
    
    try {
      const { error: itineraryError } = await supabase
        .from('itineraries')
        .update({ is_favorite: newFavoriteState })
        .eq('id', id);
      
      if (itineraryError) throw itineraryError;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          favorite_itinerary_id: newFavoriteState ? id : null,
        })
        .eq('id', authUser.id);
      
      if (profileError) throw profileError;
      
      setItineraries(
        itineraries.map(item =>
          item.id === id ? { ...item, is_favorite: newFavoriteState } : item
        )
      );
      
      if (newFavoriteState) {
        setUser(prev => ({
          ...prev,
          favoriteItinerary: itinerary.name,
          favoriteItineraryId: id,
        }));
      } else {
        setUser(prev => ({
          ...prev,
          favoriteItinerary: '',
          favoriteItineraryId: null,
        }));
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update favorite');
    }
  };
  
  const handleOpenItinerary = (id: string) => {
    navigation.navigate('Map', { itineraryId: id });
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
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
              // Delete user's data
              await supabase.from('itineraries').delete().eq('user_id', authUser?.id);
              await supabase.from('profiles').delete().eq('id', authUser?.id);
              
              // Delete the auth user (requires RLS policy or Edge Function)
              const { error: deleteError } = await supabase.rpc('delete_user');
              
              if (deleteError) {
                console.error('Delete user error:', deleteError);
                Alert.alert(
                  'Account Deletion',
                  'Your profile data has been deleted. Please contact support to fully remove your account.',
                  [{ text: 'OK', onPress: () => signOut() }]
                );
                return;
              }
              
              await signOut();
              Alert.alert('Success', 'Account deleted successfully');
            } catch (error: any) {
              console.error('Delete account error:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
            }
          },
        },
      ]
    );
  };

  const handleCountrySelect = (countryCode: string, countryName: string) => {
    setEditedUser({
      ...editedUser,
      countryCode,
      country: countryName,
    });
    setShowCountryPicker(false);
    setCountrySearch('');
  };

  const filteredCountries = countrySearch.trim() === ''
    ? countries
    : countries.filter(country =>
        country.name.toLowerCase().includes(countrySearch.toLowerCase())
      );
  
  if (isLoadingProfile || isLoadingItineraries) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Top Bar with Profile, Settings, Version */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarButton}>
          {user?.profilePicture ? (
            <Image
              source={{ uri: user.profilePicture }}
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

      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        {/* Profile Section */}
        <View style={styles.profileCard}>
          {user.profilePicture ? (
            <Image
              source={{ uri: user.profilePicture }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImage}>
              <ProfileIcon width={100} height={100} />
            </View>
          )}
          
          {isEditingProfile ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.input}
                value={editedUser.username}
                onChangeText={(text) => setEditedUser({ ...editedUser, username: text })}
                placeholder="Username"
                placeholderTextColor={COLORS.gray[500]}
              />
              <TextInput
                style={styles.input}
                value={editedUser.profession}
                onChangeText={(text) => setEditedUser({ ...editedUser, profession: text })}
                placeholder="Profession"
                placeholderTextColor={COLORS.gray[500]}
              />
              <TextInput
                style={styles.input}
                value={editedUser.location}
                onChangeText={(text) => setEditedUser({ ...editedUser, location: text })}
                placeholder="Location"
                placeholderTextColor={COLORS.gray[500]}
              />
              
              {/* Country Picker Button */}
              <TouchableOpacity
                style={styles.countryButton}
                onPress={() => setShowCountryPicker(true)}
              >
                <Image
                  source={{ uri: `https://flagsapi.com/${editedUser.countryCode}/shiny/32.png` }}
                  style={styles.flagIcon}
                />
                <Text style={styles.countryButtonText}>{editedUser.country}</Text>
              </TouchableOpacity>

              <TextInput
                style={[styles.input, styles.textArea]}
                value={editedUser.bio}
                onChangeText={(text) => setEditedUser({ ...editedUser, bio: text })}
                placeholder="Bio"
                placeholderTextColor={COLORS.gray[500]}
                multiline
                numberOfLines={4}
              />
              
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setEditedUser({ ...user });
                    setIsEditingProfile(false);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.buttonTextWhite}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{user.username}</Text>
              <Text style={styles.profession}>{user.profession}</Text>
              
              {/* Join Date */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📅</Text>
                <Text style={styles.infoText}>{user.joinDate}</Text>
              </View>
              
              {/* Location */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📍</Text>
                <Text style={styles.infoText}>{user.location}</Text>
              </View>
              
              {/* Country with Flag */}
              <View style={styles.infoRow}>
                <Image
                  source={{ uri: `https://flagsapi.com/${user.countryCode}/shiny/32.png` }}
                  style={styles.flagIcon}
                />
                <Text style={styles.infoText}>{user.country}</Text>
              </View>
              
              <Text style={styles.bio}>{user.bio}</Text>
              
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => setIsEditingProfile(true)}
              >
                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Favorite Itinerary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorite Itinerary</Text>
          {user.favoriteItinerary ? (
            <TouchableOpacity
              style={styles.favoriteCard}
              onPress={() => handleOpenItinerary(user.favoriteItineraryId!)}
            >
              <Text style={styles.favoriteIcon}>⭐</Text>
              <Text style={styles.favoriteText}>{user.favoriteItinerary}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyText}>No favorite itinerary set</Text>
          )}
        </View>
        
        {/* Itineraries List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Itineraries</Text>
          {itineraries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No itineraries yet</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate('Map')}
              >
                <Text style={styles.createButtonText}>Create First Itinerary</Text>
              </TouchableOpacity>
            </View>
          ) : (
            itineraries.map((itinerary) => (
              <View key={itinerary.id} style={styles.itineraryCard}>
                <TouchableOpacity
                  style={styles.itineraryContent}
                  onPress={() => handleOpenItinerary(itinerary.id)}
                >
                  <Text style={styles.itineraryName}>{itinerary.name}</Text>
                  <Text style={styles.itineraryDate}>
                    {itinerary.date_from && itinerary.date_to
                      ? `${itinerary.date_from} - ${itinerary.date_to}`
                      : new Date(itinerary.created_at).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.itineraryActions}>
                  <TouchableOpacity onPress={() => handleToggleFavorite(itinerary.id)}>
                    <Text style={styles.actionIcon}>
                      {itinerary.is_favorite ? '⭐' : '☆'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteItinerary(itinerary.id)}>
                    <DeleteIcon width={20} height={20} fill="#d32f2f" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      
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

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.countryPickerModal}>
            <View style={styles.countryPickerHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.searchInput}
              value={countrySearch}
              onChangeText={setCountrySearch}
              placeholder="Search countries..."
              placeholderTextColor={COLORS.gray[500]}
            />
            
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => handleCountrySelect(item.code, item.name)}
                >
                  <Image
                    source={{ uri: `https://flagsapi.com/${item.code}/shiny/32.png` }}
                    style={styles.flagIcon}
                  />
                  <Text style={styles.countryName}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No countries found</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navButton, styles.navButtonActive]}>
          <HomeIcon width={28} height={28} fill={COLORS.white} />
          <Text style={styles.navLabelActive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Map')}
        >
          <MapIcon width={28} height={28} fill={COLORS.gray[700]} />
          <Text style={styles.navLabel}>Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    gap: 16,
  },
  topBarButton: {
    padding: 4,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  versionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.gray[700],
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  profession: {
    fontSize: 16,
    color: COLORS.gray[700],
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: COLORS.gray[700],
    textAlign: 'center',
    marginBottom: 16,
  },
  editProfileButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editProfileButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  editForm: {
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    color: COLORS.gray[900],
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray[200],
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  buttonTextWhite: {
    fontWeight: 'bold',
    color: COLORS.white,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  favoriteCard: {
    backgroundColor: COLORS.primaryLight,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  favoriteText: {
    fontSize: 16,
    color: COLORS.gray[900],
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  createButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  itineraryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  itineraryContent: {
    flex: 1,
  },
  itineraryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  itineraryDate: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  itineraryActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
  deleteIcon: {
    width: 20,
    height: 20,
    tintColor: '#d32f2f',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    marginBottom: 12,
  },
  modalButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  dangerButton: {
    backgroundColor: '#ffebee',
  },
  modalButtonTextDanger: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    paddingVertical: 8,
    paddingHorizontal: 24,
    justifyContent: 'space-around',
  },
  navButton: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  navButtonActive: {
    backgroundColor: COLORS.primary,
  },
  navLabel: {
    fontSize: 10,
    color: COLORS.gray[700],
    marginTop: 3,
    fontWeight: '500',
  },
  navLabelActive: {
    fontSize: 10,
    color: COLORS.white,
    marginTop: 3,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  flagIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  countryButtonText: {
    fontSize: 14,
    color: COLORS.gray[900],
    flex: 1,
  },
  countryPickerModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  countryPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.gray[700],
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: COLORS.gray[100],
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    color: COLORS.gray[900],
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  countryName: {
    fontSize: 14,
    color: COLORS.gray[900],
  },
});
