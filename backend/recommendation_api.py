"""
Recommendation API for LAKBAI
Provides AI-powered POI recommendations based on current itinerary
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import lru_cache
import sys
import os
import json

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Initialize recommender (will be loaded on first request to avoid startup delay)
recommender = None
recommendation_cache = {}

@lru_cache(maxsize=100)
def get_cached_recommendations(route_tuple, num_recs):
    """Cache recommendations for faster repeated queries"""
    recommender_instance = get_recommender()
    if recommender_instance is None:
        return None
    
    route_list = list(route_tuple) if route_tuple else []
    return recommender_instance.recommend_next_pois(route_list, num_recs)

def get_recommender():
    """Lazy load recommender to avoid startup delay"""
    global recommender
    if recommender is None:
        try:
            from lakbai_hybrid_smart_recommender import HybridSmartRecommender
            recommender = HybridSmartRecommender(city="Legazpi")
            print("✅ Recommender initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize recommender: {e}")
            import traceback
            traceback.print_exc()
            recommender = False  # Set to False to prevent repeated attempts
    return recommender if recommender is not False else None

@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    """
    Get POI recommendations based on current itinerary
    
    Request body:
    {
        "current_route": [1, 5, 12],  // Array of POI IDs in the current itinerary
        "num_recommendations": 10     // Optional, defaults to 10
    }
    
    Response:
    {
        "recommendations": [
            {
                "poi_id": 23,
                "name": "Cagsawa Ruins",
                "theme": "Historical",
                "score": 0.95,
                "reason": "Popular next stop - 45 travelers chose this",
                "coordinates": [123.7447, 13.1414]
            },
            ...
        ],
        "status": "success"
    }
    """
    try:
        recommender_instance = get_recommender()
        if recommender_instance is None:
            return jsonify({
                "status": "error",
                "message": "Recommender not available. Running in limited mode."
            }), 503
        
        data = request.json
        current_route = data.get('current_route', [])
        num_recommendations = data.get('num_recommendations', 10)
        
        # Validate input
        if not isinstance(current_route, list):
            return jsonify({
                "status": "error",
                "message": "current_route must be an array of POI IDs"
            }), 400
        
        # Use cached function for faster results
        route_tuple = tuple(current_route)
        recommendations = get_cached_recommendations(route_tuple, num_recommendations)
        
        if recommendations is None:
            return jsonify({
                "status": "error",
                "message": "Recommender not available"
            }), 503
        
        # Enhance recommendations with coordinates
        enhanced_recs = []
        for rec_item in recommendations:
            poi_info = recommender_instance.get_poi_info(rec_item['poi_id'])
            if poi_info:
                enhanced_recs.append({
                    'poi_id': rec_item['poi_id'],
                    'name': rec_item['name'],
                    'theme': rec_item['theme'],
                    'score': round(rec_item['score'], 3),
                    'reason': rec_item['reason'],
                    'coordinates': [poi_info['long'], poi_info['lat']]
                })
        
        return jsonify({
            "status": "success",
            "recommendations": enhanced_recs,
            "count": len(enhanced_recs)
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/recommendations/health', methods=['GET'])
def health_check():
    """Check if recommendation service is available"""
    recommender_instance = get_recommender()
    if recommender_instance is None:
        return jsonify({
            "status": "unavailable",
            "message": "Recommender not initialized"
        }), 503
    
    return jsonify({
        "status": "healthy",
        "message": "Recommendation service is running",
        "city": recommender_instance.city if recommender_instance else "Unknown"
    })

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Starting LAKBAI Recommendation API")
    print("=" * 60)
    print("📍 Endpoint: http://localhost:5002/api/recommendations")
    print("🏥 Health check: http://localhost:5002/api/recommendations/health")
    print("=" * 60)
    
    # Disable debug mode to prevent auto-reloader issues with venv_bert
    # The auto-reloader was detecting PyTorch module loads as file changes
    app.run(host='0.0.0.0', port=5002, debug=False)
