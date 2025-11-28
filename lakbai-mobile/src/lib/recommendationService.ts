/**
 * Recommendation Service
 * Handles AI-powered POI recommendations from the backend
 * 
 * Note: React Native cannot access localhost directly from devices/simulators
 * - Android Emulator: Use 10.0.2.2
 * - iOS Simulator: Use localhost
 * - Physical Device: Use your computer's IP address
 */

import { Platform } from 'react-native';

// Automatically detect the correct URL based on platform
const getRecommendationAPIUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine's localhost
      return 'http://10.0.2.2:5002';
    } else {
      // iOS simulator can use localhost
      return 'http://localhost:5002';
    }
  }
  // Production URL (if you deploy the recommendation API)
  return 'http://localhost:5002';
};

const RECOMMENDATION_API_URL = getRecommendationAPIUrl();

export interface Recommendation {
  poi_id: number;
  name: string;
  theme: string;
  score: number;
  reason: string;
  coordinates: [number, number]; // [longitude, latitude]
}

interface RecommendationResponse {
  status: string;
  recommendations: Recommendation[];
  count: number;
}

/**
 * Get POI recommendations based on current itinerary
 * @param currentRoute Array of POI IDs in the current itinerary
 * @param numRecommendations Number of recommendations to return (default: 10)
 */
export async function getRecommendations(
  currentRoute: number[],
  numRecommendations: number = 10
): Promise<Recommendation[]> {
  try {
    console.log('🔍 Calling recommendation API with route:', currentRoute);
    console.log('📍 API URL:', RECOMMENDATION_API_URL);
    
    const requestBody = {
      current_route: currentRoute,
      num_recommendations: numRecommendations,
    };
    console.log('📦 Request body:', JSON.stringify(requestBody));
    
    const response = await fetch(`${RECOMMENDATION_API_URL}/api/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`Recommendation API returned ${response.status}: ${errorText}`);
    }

    const data: RecommendationResponse = await response.json();
    console.log('📦 Recommendation API response:', data);
    
    if (data.status === 'success') {
      return data.recommendations;
    } else {
      console.error('Recommendation API error:', data);
      return [];
    }
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return [];
  }
}

/**
 * Check if recommendation service is available
 */
export async function checkRecommendationHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${RECOMMENDATION_API_URL}/api/recommendations/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    return false;
  }
}
