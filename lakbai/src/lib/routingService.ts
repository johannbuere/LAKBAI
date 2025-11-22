/**
 * Routing Service - Handles all OSRM route calculations via backend API
 * This reduces frontend bundle size and centralizes routing logic
 */

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5001';

export interface RouteData {
  duration: number; // in minutes
  distance: number; // in meters
  geometry: any; // GeoJSON geometry
}

export interface RouteResponse {
  car?: RouteData;
  bicycle?: RouteData;
  foot?: RouteData;
  distance_formatted: string;
}

export interface RouteSegment {
  id: string;
  from: [number, number];
  to: [number, number];
}

/**
 * Get route information for a single segment
 */
export async function getRoute(
  from: [number, number],
  to: [number, number],
  profiles: string[] = ['car', 'bicycle', 'foot']
): Promise<RouteResponse | null> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        profiles,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
}

/**
 * Get routes for multiple location pairs (batch request)
 */
export async function getRoutesBatch(
  segments: RouteSegment[],
  profiles: string[] = ['car', 'bicycle', 'foot']
): Promise<Record<string, RouteResponse> | null> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/routes/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        segments,
        profiles,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching batch routes:', error);
    return null;
  }
}

/**
 * Check if backend API is healthy
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/health`);
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

/**
 * Get cache statistics from backend
 */
export async function getCacheInfo(): Promise<any> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/cache/info`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching cache info:', error);
    return null;
  }
}

/**
 * Clear the backend route cache
 */
export async function clearCache(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/cache/clear`, {
      method: 'POST',
    });
    return response.ok;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
}
