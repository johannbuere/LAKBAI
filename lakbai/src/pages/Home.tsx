import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { countries, getCountryByName } from "../lib/countries";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import lakbaiIcon from "../assets/lakbai.svg";
import homeIcon from "../assets/material-symbols--home-rounded.svg";
import mapIcon from "../assets/solar--map-bold.svg";
import settingsIcon from "../assets/tdesign--setting-filled.svg";
import profileIcon from "../assets/blank-profile.svg";
import starIcon from "../assets/star.svg";
import editIcon from "../assets/tabler--edit.svg";
import deleteIcon from "../assets/delete-fill.svg";
import openInNewIcon from "../assets/open-in-new-tab-outline.svg";
import dateIcon from "../assets/date-fill.svg";

export default function Home() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  
  // User profile data from Supabase
  const [user, setUser] = useState({
    username: authUser?.username || "User",
    profession: "Add profession",
    joinDate: new Date().toISOString().split('T')[0],
    location: "Add location",
    country: "Philippines",
    countryCode: "PH",
    bio: "Add a bio to tell others about yourself...",
    favoriteItinerary: "",
    favoriteItineraryId: "",
    profilePicture: profileIcon
  });
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Edit mode state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  
  // Country search/dropdown state
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  
  // Profile picture upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  
  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Filter countries based on search - show all if search is empty
  const filteredCountries = countrySearch.trim() === ""
    ? countries
    : countries.filter(country =>
        country.name.toLowerCase().includes(countrySearch.toLowerCase())
      );
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Itineraries from Supabase
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [isLoadingItineraries, setIsLoadingItineraries] = useState(true);
  
  // Load user profile from Supabase
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
        
        if (error) {
          console.error('Error loading profile:', error);
          return;
        }
        
        if (data) {
          // Load itineraries first to get the favorite name
          const { data: itinerariesData } = await supabase
            .from('itineraries')
            .select('*')
            .eq('user_id', authUser.id)
            .order('updated_at', { ascending: false });
          
          let favoriteName = "";
          if (data.favorite_itinerary_id && itinerariesData) {
            const favoriteItinerary = itinerariesData.find(it => it.id === data.favorite_itinerary_id);
            if (favoriteItinerary) {
              favoriteName = favoriteItinerary.name;
            }
          }
          
          setUser({
            username: data.username || authUser.username,
            profession: data.profession || "Add profession",
            joinDate: data.join_date || new Date().toISOString().split('T')[0],
            location: data.location || "Add location",
            country: data.country || "Philippines",
            countryCode: data.country_code || "PH",
            bio: data.bio || "Add a bio to tell others about yourself...",
            favoriteItinerary: favoriteName,
            favoriteItineraryId: data.favorite_itinerary_id || "",
            profilePicture: data.profile_picture_url || profileIcon
          });
          setEditedUser({
            username: data.username || authUser.username,
            profession: data.profession || "Add profession",
            joinDate: data.join_date || new Date().toISOString().split('T')[0],
            location: data.location || "Add location",
            country: data.country || "Philippines",
            countryCode: data.country_code || "PH",
            bio: data.bio || "Add a bio to tell others about yourself...",
            favoriteItinerary: favoriteName,
            favoriteItineraryId: data.favorite_itinerary_id || "",
            profilePicture: data.profile_picture_url || profileIcon
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
  
  // Load itineraries from Supabase
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
        
        if (error) {
          console.error('Error loading itineraries:', error);
          return;
        }
        
        if (data) {
          const mappedItineraries = data.map(itinerary => ({
            id: itinerary.id,
            name: itinerary.name,
            isFavorite: itinerary.is_favorite || false,
            thumbnail: null,
            dateCreated: itinerary.created_at,
            emoji: itinerary.emoji || '🗺️'
          }));
          setItineraries(mappedItineraries);
        }
      } catch (error) {
        console.error('Error loading itineraries:', error);
      } finally {
        setIsLoadingItineraries(false);
      }
    };
    
    loadItineraries();
  }, [authUser]);

  const handleDeleteItinerary = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this itinerary?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('itineraries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setItineraries(itineraries.filter(item => item.id !== id));
    } catch (error: any) {
      console.error('Error deleting itinerary:', error);
      alert('Failed to delete itinerary: ' + error.message);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const itinerary = itineraries.find(item => item.id === id);
    if (!itinerary || !authUser) return;
    
    const newFavoriteState = !itinerary.isFavorite;
    
    try {
      // Update itinerary is_favorite flag
      const { error: itineraryError } = await supabase
        .from('itineraries')
        .update({ is_favorite: newFavoriteState })
        .eq('id', id);
      
      if (itineraryError) throw itineraryError;
      
      // If setting as favorite, update profile's favorite_itinerary_id
      // If removing favorite, clear it from profile if it was this one
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          favorite_itinerary_id: newFavoriteState ? id : (user.favoriteItineraryId === id ? null : user.favoriteItineraryId)
        })
        .eq('id', authUser.id);
      
      if (profileError) throw profileError;
      
      // Update local state
      setItineraries(itineraries.map(item => 
        item.id === id ? { ...item, isFavorite: newFavoriteState } : item
      ));
      
      // Update user's favorite itinerary
      if (newFavoriteState) {
        setUser(prev => ({ ...prev, favoriteItinerary: itinerary.name, favoriteItineraryId: id }));
        setEditedUser(prev => ({ ...prev, favoriteItinerary: itinerary.name, favoriteItineraryId: id }));
      } else if (user.favoriteItineraryId === id) {
        setUser(prev => ({ ...prev, favoriteItinerary: "", favoriteItineraryId: "" }));
        setEditedUser(prev => ({ ...prev, favoriteItinerary: "", favoriteItineraryId: "" }));
      }
    } catch (error: any) {
      console.error('Error updating favorite:', error);
      alert('Failed to update favorite: ' + error.message);
    }
  };

  const handleOpenItinerary = (id: string) => {
    navigate(`/map?itinerary=${id}`);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      alert('Failed to sign out: ' + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!authUser) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone. All your data including itineraries will be permanently deleted.'
    );
    
    if (!confirmed) return;
    
    try {
      // Delete user from auth (cascade will handle profile and itineraries)
      const { error } = await supabase.auth.admin.deleteUser(authUser.id);
      
      if (error) {
        // If admin API not available, try RPC or direct deletion
        const { error: rpcError } = await supabase.rpc('delete_user');
        if (rpcError) throw rpcError;
      }
      
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please contact support.');
    }
  };

  const handleEditProfile = () => {
    setEditedUser({ ...user });
    setCountrySearch(user.country);
    setIsEditingProfile(true);
  };

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
          bio: editedUser.bio,
          join_date: editedUser.joinDate
        })
        .eq('id', authUser.id);
      
      if (error) throw error;
      
      setUser({ ...editedUser });
      setIsEditingProfile(false);
      setShowCountryDropdown(false);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditedUser({ ...user });
    setIsEditingProfile(false);
    setShowCountryDropdown(false);
    setCountrySearch("");
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedUser({ ...editedUser, [field]: value });
  };
  
  const handleCountrySelect = (countryCode: string, countryName: string) => {
    setEditedUser({ 
      ...editedUser, 
      countryCode: countryCode,
      country: countryName 
    });
    setCountrySearch("");
    setShowCountryDropdown(false);
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !authUser) return;
    
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    setIsUploadingPicture(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `${authUser.id}/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;
      
      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', authUser.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setUser({ ...user, profilePicture: publicUrl });
      setEditedUser({ ...editedUser, profilePicture: publicUrl });
      
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture: ' + error.message);
    } finally {
      setIsUploadingPicture(false);
    }
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
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={lakbaiIcon}
              alt="Lakbai Logo"
              className="w-full h-full"
              style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(31%) saturate(1679%) hue-rotate(50deg) brightness(95%) contrast(89%)' }}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Main navigation" className="absolute top-32 left-1/2 -translate-x-1/2 flex flex-col gap-4">
          <button
            className="w-14 h-14 flex items-center justify-center bg-[#6dd14a] rounded-full cursor-pointer transition-all hover:bg-[#5ec13b] hover:scale-110 shadow-md"
            aria-label="Home"
            aria-current="page"
            type="button"
          >
            <img
              src={homeIcon}
              alt=""
              className="w-8 h-8"
              style={{ filter: 'brightness(0) invert(1)' }}
              aria-hidden="true"
            />
          </button>

          <button
            onClick={() => navigate("/map")}
            className="w-14 h-14 flex items-center justify-center bg-[#f0fbea] rounded-full cursor-pointer transition-all hover:bg-[#d9f5cc] hover:scale-110"
            aria-label="Map"
            type="button"
          >
            <img
              src={mapIcon}
              alt=""
              className="w-8 h-8"
              style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(31%) saturate(1679%) hue-rotate(50deg) brightness(95%) contrast(89%)' }}
              aria-hidden="true"
            />
          </button>
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 w-full pb-8 flex flex-col items-center gap-4">
          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
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
              v0.1.0
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
              src={user.profilePicture} 
            />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-lakbai-green p-8">
        <div className="max-w-7xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <div className="flex gap-8">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div className="relative w-40 h-40 rounded-full overflow-hidden bg-gray-200 group">
                  <img 
                    src={user.profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                  {isEditingProfile && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleProfilePictureUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPicture}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="text-white text-center">
                          {isUploadingPicture ? (
                            <div className="text-sm">Uploading...</div>
                          ) : (
                            <>
                              <svg className="w-8 h-8 mx-auto mb-1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                <path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              </svg>
                              <div className="text-xs">Change Photo</div>
                            </>
                          )}
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      {user.username}
                    </h1>
                    <p className="text-xl text-lakbai-green font-medium">
                      {user.profession}
                    </p>
                  </div>
                  {!isEditingProfile ? (
                    <button
                      onClick={handleEditProfile}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Edit profile"
                    >
                      <img src={editIcon} alt="Edit" className="w-6 h-6" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        className="px-4 py-2 bg-lakbai-green text-white rounded-lg hover:bg-lakbai-green-dark transition-colors font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Details */}
                <div className="space-y-3 mb-6">
                  {isEditingProfile ? (
                    <>
                      <div className="flex items-center gap-3">
                        <img src={dateIcon} alt="" className="w-5 h-5" />
                        <input
                          type="date"
                          value={editedUser.joinDate}
                          onChange={(e) => handleInputChange('joinDate', e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lakbai-green focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <input
                          type="text"
                          value={editedUser.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="Location"
                          className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lakbai-green focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <img 
                          src={`https://flagsapi.com/${editedUser.countryCode}/shiny/32.png`}
                          alt={editedUser.country}
                          className="w-6 h-6 rounded"
                        />
                        <div className="flex-1 relative" ref={countryDropdownRef}>
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => {
                              setCountrySearch(e.target.value);
                              setShowCountryDropdown(true);
                            }}
                            onFocus={() => setShowCountryDropdown(true)}
                            placeholder={editedUser.country || "Search country..."}
                            className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lakbai-green focus:border-transparent"
                          />
                          {showCountryDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                              {filteredCountries.length > 0 ? (
                                filteredCountries.map((country) => (
                                  <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleCountrySelect(country.code, country.name)}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-lakbai-green-bg transition-colors text-left"
                                  >
                                    <img 
                                      src={`https://flagsapi.com/${country.code}/shiny/32.png`}
                                      alt={country.name}
                                      className="w-6 h-6 rounded"
                                    />
                                    <span className="text-sm text-gray-900">{country.name}</span>
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  No countries found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-gray-700">
                        <img src={dateIcon} alt="" className="w-5 h-5" />
                        <span>{user.joinDate}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span>{user.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <img 
                          src={`https://flagsapi.com/${user.countryCode}/shiny/32.png`}
                          alt={user.country}
                          className="w-6 h-6 rounded"
                        />
                        <span>{user.country}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Favorite Itinerary */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-lakbai-green mb-2">
                    Favorite Itinerary
                  </h3>
                  {isEditingProfile ? (
                    <select
                      value={editedUser.favoriteItinerary}
                      onChange={(e) => handleInputChange('favoriteItinerary', e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lakbai-green focus:border-transparent"
                    >
                      <option value="">Select favorite itinerary</option>
                      {itineraries.map((itinerary) => (
                        <option key={itinerary.id} value={itinerary.name}>
                          {itinerary.name}
                        </option>
                      ))}
                    </select>
                  ) : user.favoriteItinerary ? (
                    <button 
                      onClick={() => user.favoriteItineraryId && handleOpenItinerary(user.favoriteItineraryId)}
                      className="flex items-center gap-2 hover:bg-lakbai-green-bg px-3 py-2 rounded-lg transition-colors"
                    >
                      <img src={starIcon} alt="" className="w-5 h-5" style={{ 
                        filter: 'brightness(0) saturate(100%) invert(73%) sepia(31%) saturate(1679%) hue-rotate(50deg) brightness(95%) contrast(89%)'
                      }} />
                      <span className="text-gray-900 font-medium">{user.favoriteItinerary}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <img src={starIcon} alt="" className="w-5 h-5 opacity-30" />
                      <span className="text-sm">No favorite itinerary selected</span>
                    </div>
                  )}
                </div>

                {/* About/Bio */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">About</h3>
                  {isEditingProfile ? (
                    <textarea
                      value={editedUser.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lakbai-green focus:border-transparent resize-none"
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* List of Itineraries */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-lakbai-green">
              List of Itineraries
            </h2>

            {isLoadingItineraries ? (
              <div className="text-center py-12">
                <div className="text-gray-500">Loading itineraries...</div>
              </div>
            ) : itineraries.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">No itineraries yet</div>
                <button
                  onClick={() => navigate('/map')}
                  className="px-6 py-3 bg-lakbai-green text-white rounded-xl font-semibold hover:bg-lakbai-green-dark transition-colors"
                >
                  Create Your First Itinerary
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {itineraries.map((itinerary) => (
                <div
                  key={itinerary.id}
                  className="relative bg-lakbai-lime rounded-3xl p-6 shadow-md hover:shadow-xl transition-shadow min-h-[280px] flex flex-col"
                >
                  {/* Favorite Star */}
                  <button
                    onClick={() => handleToggleFavorite(itinerary.id)}
                    className="absolute top-4 right-4 p-2 hover:scale-110 transition-transform"
                    aria-label={itinerary.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <img 
                      src={starIcon} 
                      alt="" 
                      className="w-6 h-6"
                      style={{ 
                        filter: itinerary.isFavorite 
                          ? 'brightness(0) saturate(100%) invert(73%) sepia(31%) saturate(1679%) hue-rotate(50deg) brightness(95%) contrast(89%)'
                          : 'brightness(0) saturate(100%) invert(80%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(89%)'
                      }}
                    />
                  </button>

                  {/* Itinerary Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-4 pr-8">
                    {itinerary.name}
                  </h3>

                  {/* Thumbnail/Preview Area with Emoji */}
                  <div className="flex-1 bg-white/30 rounded-2xl mb-4 flex items-center justify-center">
                    <span className="text-6xl">{itinerary.emoji}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-900/10">
                    <button
                      onClick={() => handleDeleteItinerary(itinerary.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                      aria-label="Delete itinerary"
                    >
                      <img 
                        src={deleteIcon} 
                        alt="Delete" 
                        className="w-6 h-6 opacity-60 group-hover:opacity-100"
                      />
                    </button>

                    <button
                      onClick={() => handleOpenItinerary(itinerary.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white rounded-xl transition-colors font-medium text-gray-900"
                    >
                      <span>Check Itinerary</span>
                      <img src={openInNewIcon} alt="" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
            
            <div className="space-y-4">
              <button
                onClick={handleSignOut}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                Sign Out
              </button>
              
              <button
                onClick={handleDeleteAccount}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
              
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full px-6 py-3 bg-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
