"""
Flask API Server for LAKBAI Tourism Recommendation System
Provides REST endpoints for the frontend application
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Global recommender instance
recommender = None

def initialize_recommender():
    """Initialize the hybrid recommender system"""
    global recommender
    try:
        from hybrid_smart_recommender import HybridSmartRecommender
        recommender = HybridSmartRecommender(city="Legazpi")
        print("✅ Recommender system initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize recommender: {e}")
        import traceback
        traceback.print_exc()
        return False

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'recommender_loaded': recommender is not None
    })

@app.route('/api/pois', methods=['GET'])
def get_all_pois():
    """Get all Points of Interest"""
    if not recommender:
        return jsonify({'error': 'Recommender not initialized'}), 500

    try:
        pois_list = []
        for _, poi in recommender.pois.iterrows():
            pois_list.append({
                'id': int(poi['poiID']),
                'name': poi['poiName'],
                'fullName': poi.get('poiLongName', poi['poiName']),
                'theme': poi['theme'],
                'latitude': float(poi['lat']),
                'longitude': float(poi['long'])
            })

        return jsonify({
            'pois': pois_list,
            'total': len(pois_list)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pois/<int:poi_id>', methods=['GET'])
def get_poi_by_id(poi_id):
    """Get specific POI by ID"""
    if not recommender:
        return jsonify({'error': 'Recommender not initialized'}), 500

    try:
        poi_info = recommender.get_poi_info(poi_id)
        if poi_info:
            return jsonify({
                'id': poi_info['id'],
                'name': poi_info['name'],
                'theme': poi_info['theme'],
                'latitude': poi_info['lat'],
                'longitude': poi_info['long']
            })
        else:
            return jsonify({'error': 'POI not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/themes', methods=['GET'])
def get_themes():
    """Get all available themes"""
    if not recommender:
        return jsonify({'error': 'Recommender not initialized'}), 500

    try:
        themes = recommender.pois['theme'].unique().tolist()
        theme_counts = {}
        for theme in themes:
            count = len(recommender.pois[recommender.pois['theme'] == theme])
            theme_counts[theme] = count

        return jsonify({
            'themes': themes,
            'counts': theme_counts
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recommend', methods=['POST'])
def get_recommendations():
    """
    Get POI recommendations based on current route

    Request body:
    {
        "route": [1, 5, 10],  // Array of POI IDs already visited
        "count": 3             // Number of recommendations (optional, default 3)
    }
    """
    if not recommender:
        return jsonify({'error': 'Recommender not initialized'}), 500

    try:
        data = request.get_json()
        current_route = data.get('route', [])
        num_recommendations = data.get('count', 3)

        # Validate input
        if not isinstance(current_route, list):
            return jsonify({'error': 'Route must be an array'}), 400

        if not isinstance(num_recommendations, int) or num_recommendations < 1 or num_recommendations > 10:
            return jsonify({'error': 'Count must be between 1 and 10'}), 400

        # Get recommendations
        recommendations = recommender.recommend_next_pois(
            current_route,
            num_recommendations=num_recommendations
        )

        # Format response
        result = []
        for rec in recommendations:
            result.append({
                'poi_id': rec['poi_id'],
                'name': rec['name'],
                'theme': rec['theme'],
                'score': float(rec['score']),
                'reason': rec['reason']
            })

        return jsonify({
            'recommendations': result,
            'route': current_route,
            'count': len(result)
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get system statistics"""
    if not recommender:
        return jsonify({'error': 'Recommender not initialized'}), 500

    try:
        stats = recommender.get_recommendation_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/popular-routes', methods=['GET'])
def get_popular_routes():
    """Get popular routes from user data"""
    if not recommender:
        return jsonify({'error': 'Recommender not initialized'}), 500

    try:
        popular_sequences = recommender.popular_routes_from_data.get('popular_sequences', [])

        # Format top 10 popular sequences
        routes = []
        for seq_data in popular_sequences[:10]:
            route_pois = []
            for poi_id in seq_data['sequence']:
                poi_info = recommender.get_poi_info(poi_id)
                if poi_info:
                    route_pois.append({
                        'id': poi_info['id'],
                        'name': poi_info['name'],
                        'theme': poi_info['theme']
                    })

            routes.append({
                'pois': route_pois,
                'score': float(seq_data['score']),
                'count': seq_data['count']
            })

        return jsonify({
            'routes': routes,
            'total': len(routes)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 Starting LAKBAI Tourism API Server...")
    print("=" * 60)

    # Initialize recommender
    if not initialize_recommender():
        print("⚠️  Warning: Running without recommender system")

    print("\n📡 API Endpoints:")
    print("  GET  /api/health          - Health check")
    print("  GET  /api/pois            - Get all POIs")
    print("  GET  /api/pois/<id>       - Get specific POI")
    print("  GET  /api/themes          - Get all themes")
    print("  POST /api/recommend       - Get recommendations")
    print("  GET  /api/stats           - Get system stats")
    print("  GET  /api/popular-routes  - Get popular routes")
    print("\n" + "=" * 60)
    print("🌐 Server starting on http://localhost:5000")
    print("=" * 60 + "\n")

    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
