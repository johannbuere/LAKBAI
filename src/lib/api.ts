import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API client instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface POI {
  id: number;
  name: string;
  lat: number;
  lon: number;
  category?: string;
  description?: string;
  rating?: number;
  image?: string;
}

export interface UserLocation {
  lat: number;
  lon: number;
}

export interface RouteResponse {
  routes: Array<{
    geometry: {
      coordinates: number[][];
    };
    duration: number;
    distance: number;
  }>;
}

export interface RecommendationResponse {
  recommended: POI;
}

// API functions
export const apiService = {
  // Get all Points of Interest
  async getPOIs(): Promise<{ pois: POI[] }> {
    try {
      const response = await api.get('/pois');
      return response.data;
    } catch (error) {
      console.error('Error fetching POIs:', error);
      throw error;
    }
  },

  // Get personalized recommendations
  async getRecommendations(userLocation: UserLocation): Promise<RecommendationResponse> {
    try {
      const response = await api.post('/recommend', userLocation);
      return response.data;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  },

  // Get route between two points
  async getRoute(
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number
  ): Promise<RouteResponse> {
    try {
      const response = await api.get('/route', {
        params: {
          start_lat: startLat,
          start_lon: startLon,
          end_lat: endLat,
          end_lon: endLon,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching route:', error);
      throw error;
    }
  },

  // Store routes for offline use
  async storeOfflineRoute(route: any) {
    try {
      // Use localforage for offline storage
      const { default: localforage } = await import('localforage');
      await localforage.setItem(`route_${Date.now()}`, route);
    } catch (error) {
      console.error('Error storing offline route:', error);
    }
  },

  // Get stored offline routes
  async getOfflineRoutes() {
    try {
      const { default: localforage } = await import('localforage');
      const keys = await localforage.keys();
      const routeKeys = keys.filter(key => key.startsWith('route_'));
      const routes = await Promise.all(
        routeKeys.map(async (key) => ({
          id: key,
          data: await localforage.getItem(key),
        }))
      );
      return routes;
    } catch (error) {
      console.error('Error fetching offline routes:', error);
      return [];
    }
  },
};

export default apiService;
