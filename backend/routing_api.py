"""
Routing API for LAKBAI
Handles OSRM route calculations and provides endpoints for the frontend
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from functools import lru_cache
from typing import Dict, List, Tuple

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# OSRM service URLs from environment or default to Cloud Run
OSRM_CAR_URL = os.environ.get('OSRM_CAR_URL', 'https://osrm-car-q2drvffsoa-as.a.run.app')
OSRM_BICYCLE_URL = os.environ.get('OSRM_BICYCLE_URL', 'https://osrm-bicycle-q2drvffsoa-as.a.run.app')
OSRM_FOOT_URL = os.environ.get('OSRM_FOOT_URL', 'https://osrm-foot-q2drvffsoa-as.a.run.app')

def get_osrm_url(profile: str) -> str:
    """Get OSRM base URL for the given profile"""
    urls = {
        'driving': OSRM_CAR_URL,
        'car': OSRM_CAR_URL,
        'cycling': OSRM_BICYCLE_URL,
        'bicycle': OSRM_BICYCLE_URL,
        'foot': OSRM_FOOT_URL,
        'walking': OSRM_FOOT_URL,
    }
    return urls.get(profile.lower(), OSRM_CAR_URL)

@lru_cache(maxsize=1000)
def fetch_route_cached(from_coords: Tuple[float, float], to_coords: Tuple[float, float], profile: str) -> Dict:
    """
    Fetch route from OSRM with caching
    Cache key based on coordinates and profile
    """
    base_url = get_osrm_url(profile)
    url = f"{base_url}/route/v1/{profile}/{from_coords[0]},{from_coords[1]};{to_coords[0]},{to_coords[1]}?overview=full&geometries=geojson"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get('code') == 'Ok' and data.get('routes'):
            route = data['routes'][0]
            return {
                'duration': round(route['duration'] / 60),  # Convert to minutes
                'distance': route['distance'],  # Keep in meters
                'geometry': route['geometry']
            }
    except Exception as e:
        print(f"Error fetching {profile} route: {e}")
        return None
    
    return None

@app.route('/api/route', methods=['POST'])
def get_route():
    """
    Get route information for a single segment
    
    Request body:
    {
        "from": [lng, lat],
        "to": [lng, lat],
        "profiles": ["car", "bicycle", "foot"]  // optional, defaults to all
    }
    
    Response:
    {
        "car": {"duration": 15, "distance": 5000, "geometry": {...}},
        "bicycle": {"duration": 20, "distance": 5000, "geometry": {...}},
        "foot": {"duration": 60, "distance": 5000, "geometry": {...}},
        "distance_formatted": "5.0 km"
    }
    """
    data = request.json
    from_coords = tuple(data['from'])
    to_coords = tuple(data['to'])
    profiles = data.get('profiles', ['car', 'bicycle', 'foot'])
    
    results = {}
    distance = 0
    
    # Fetch routes for each profile
    for profile in profiles:
        osrm_profile = {
            'car': 'driving',
            'bicycle': 'cycling',
            'foot': 'foot'
        }.get(profile, 'driving')
        
        route_data = fetch_route_cached(from_coords, to_coords, osrm_profile)
        if route_data:
            results[profile] = route_data
            distance = route_data['distance']
    
    # Format distance
    distance_formatted = f"{distance / 1000:.1f} km" if distance >= 1000 else f"{round(distance)} m"
    
    return jsonify({
        **results,
        'distance_formatted': distance_formatted
    })

@app.route('/api/routes/batch', methods=['POST'])
def get_routes_batch():
    """
    Get routes for multiple location pairs
    
    Request body:
    {
        "segments": [
            {
                "id": "loc1-loc2",
                "from": [lng, lat],
                "to": [lng, lat]
            },
            ...
        ],
        "profiles": ["car", "bicycle", "foot"]  // optional
    }
    
    Response:
    {
        "loc1-loc2": {
            "car": {"duration": 15, "distance": 5000, "geometry": {...}},
            ...
        },
        ...
    }
    """
    data = request.json
    segments = data['segments']
    profiles = data.get('profiles', ['car', 'bicycle', 'foot'])
    
    results = {}
    
    for segment in segments:
        segment_id = segment['id']
        from_coords = tuple(segment['from'])
        to_coords = tuple(segment['to'])
        
        segment_results = {}
        distance = 0
        
        for profile in profiles:
            osrm_profile = {
                'car': 'driving',
                'bicycle': 'cycling',
                'foot': 'foot'
            }.get(profile, 'driving')
            
            route_data = fetch_route_cached(from_coords, to_coords, osrm_profile)
            if route_data:
                segment_results[profile] = route_data
                distance = route_data['distance']
        
        # Format distance
        distance_formatted = f"{distance / 1000:.1f} km" if distance >= 1000 else f"{round(distance)} m"
        segment_results['distance_formatted'] = distance_formatted
        
        results[segment_id] = segment_results
    
    return jsonify(results)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'osrm_services': {
            'car': OSRM_CAR_URL,
            'bicycle': OSRM_BICYCLE_URL,
            'foot': OSRM_FOOT_URL
        }
    })

@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    """Clear the route cache"""
    fetch_route_cached.cache_clear()
    return jsonify({'message': 'Cache cleared successfully'})

@app.route('/api/cache/info', methods=['GET'])
def cache_info():
    """Get cache statistics"""
    info = fetch_route_cached.cache_info()
    return jsonify({
        'hits': info.hits,
        'misses': info.misses,
        'size': info.currsize,
        'maxsize': info.maxsize,
        'hit_rate': f"{(info.hits / (info.hits + info.misses) * 100):.2f}%" if (info.hits + info.misses) > 0 else "0%"
    })

if __name__ == '__main__':
    # Development server
    app.run(host='0.0.0.0', port=5001, debug=True)
