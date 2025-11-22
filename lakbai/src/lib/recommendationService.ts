/**
 * Recommendation Service
 * Handles AI-powered POI recommendations from the backend
 */

const RECOMMENDATION_API_URL = 'http://localhost:5002';

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
    const response = await fetch(`${RECOMMENDATION_API_URL}/api/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_route: currentRoute,
        num_recommendations: numRecommendations,
      }),
    });

    if (!response.ok) {
      throw new Error(`Recommendation API returned ${response.status}`);
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
