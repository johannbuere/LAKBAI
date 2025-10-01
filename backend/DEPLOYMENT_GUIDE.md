# 🚀 Production Deployment Guide for Lakbai Tourism Recommender

## Performance Results
- **Original BERT method**: 5-15 seconds per request ❌ Too slow for web
- **Optimized method**: ~40ms per request ✅ Perfect for real-time web apps
- **Speed improvement**: 249x faster!

## 🌐 Web Implementation Options

### 1. Simple Flask Deployment (Good for MVP)
```bash
# Your current setup - already working!
python fast_route_recommender.py api
# Serves on http://localhost:5000
```

### 2. Production-Ready Deployment

#### Option A: Using Gunicorn (Linux/Mac)
```bash
# Install production server
pip install gunicorn

# Create wsgi.py
echo "from fast_route_recommender import create_web_api; app = create_web_api()" > wsgi.py

# Run with multiple workers
gunicorn --workers 4 --bind 0.0.0.0:5000 wsgi:app
```

#### Option B: Using Waitress (Windows/Cross-platform)
```bash
# Install waitress
pip install waitress

# Run production server
waitress-serve --host=0.0.0.0 --port=5000 --call fast_route_recommender:create_web_api
```

### 3. Cloud Deployment

#### Option A: Heroku (Easiest)
```bash
# Create Procfile
echo "web: waitress-serve --port=$PORT --call fast_route_recommender:create_web_api" > Procfile

# Deploy to Heroku
git init
git add .
git commit -m "Initial commit"
heroku create your-app-name
git push heroku main
```

#### Option B: AWS/Azure/GCP
- Use Docker container
- Deploy to App Service/Lambda/Cloud Run
- Auto-scaling capabilities

#### Option C: DigitalOcean App Platform
- Simple drag-and-drop deployment
- Automatic HTTPS
- Built-in monitoring

## 📱 Frontend Integration Examples

### 1. React.js Integration
```javascript
// TourismRecommender.jsx
import React, { useState, useEffect } from 'react';

const API_BASE = 'https://your-api-domain.com/api';

function TourismRecommender() {
    const [currentRoute, setCurrentRoute] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);

    const getRecommendations = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ route: currentRoute, count: 3 })
            });
            const data = await response.json();
            setRecommendations(data);
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    const addToRoute = (poiId) => {
        setCurrentRoute([...currentRoute, poiId]);
    };

    return (
        <div className="tourism-recommender">
            <h1>🌟 Tourism Route Planner</h1>
            
            <div className="current-route">
                <h2>Your Route</h2>
                {currentRoute.map((poi, index) => (
                    <div key={index}>POI {poi}</div>
                ))}
                <button onClick={getRecommendations}>
                    Get Recommendations
                </button>
            </div>
            
            <div className="recommendations">
                <h2>AI Recommendations</h2>
                {loading && <div>Loading...</div>}
                {recommendations.map((rec, index) => (
                    <div key={index} onClick={() => addToRoute(rec.poi_id)}>
                        <h3>{rec.name}</h3>
                        <p>{rec.theme} - Score: {rec.score}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TourismRecommender;
```

### 2. WordPress Plugin Integration
```php
<?php
// lakbai-tourism-plugin.php

function lakbai_get_recommendations($route) {
    $api_url = 'https://your-api-domain.com/api/recommend';
    
    $response = wp_remote_post($api_url, array(
        'headers' => array('Content-Type' => 'application/json'),
        'body' => json_encode(array(
            'route' => $route,
            'count' => 3
        ))
    ));
    
    if (is_wp_error($response)) {
        return false;
    }
    
    return json_decode(wp_remote_retrieve_body($response), true);
}

function lakbai_shortcode($atts) {
    // Shortcode: [lakbai_recommender]
    ob_start();
    ?>
    <div id="lakbai-recommender">
        <h3>🌟 Tourism Route Planner</h3>
        <div id="route-builder"></div>
        <div id="recommendations"></div>
    </div>
    
    <script>
        // JavaScript to interact with your API
        const apiBase = 'https://your-api-domain.com/api';
        // ... rest of the JavaScript code
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('lakbai_recommender', 'lakbai_shortcode');
?>
```

### 3. Mobile App Integration (React Native)
```javascript
// TourismScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';

const API_BASE = 'https://your-api-domain.com/api';

const TourismScreen = () => {
    const [currentRoute, setCurrentRoute] = useState([]);
    const [recommendations, setRecommendations] = useState([]);

    const getRecommendations = async () => {
        try {
            const response = await fetch(`${API_BASE}/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ route: currentRoute, count: 3 })
            });
            const data = await response.json();
            setRecommendations(data);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const renderRecommendation = ({ item }) => (
        <TouchableOpacity
            style={styles.recommendationCard}
            onPress={() => setCurrentRoute([...currentRoute, item.poi_id])}
        >
            <Text style={styles.poiName}>{item.name}</Text>
            <Text style={styles.poiTheme}>{item.theme}</Text>
            <Text style={styles.poiScore}>Score: {item.score.toFixed(2)}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🌟 Tourism Route Planner</Text>
            
            <TouchableOpacity style={styles.button} onPress={getRecommendations}>
                <Text style={styles.buttonText}>Get Recommendations</Text>
            </TouchableOpacity>
            
            <FlatList
                data={recommendations}
                renderItem={renderRecommendation}
                keyExtractor={(item) => item.poi_id.toString()}
            />
        </View>
    );
};
```

## 🔧 Performance Optimizations for Production

### 1. Database Integration
```python
# Replace pickle cache with Redis/PostgreSQL
import redis
import psycopg2

class ProductionRouteRecommender(FastRouteRecommender):
    def __init__(self):
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        self.db_connection = psycopg2.connect(
            host="your-db-host",
            database="tourism_db",
            user="username", 
            password="password"
        )
        super().__init__()
    
    def load_cache(self):
        # Load from Redis for faster access
        cached_data = self.redis_client.get('poi_cache')
        if cached_data:
            return pickle.loads(cached_data)
        return False
    
    def save_cache(self, data):
        # Save to both Redis and database
        self.redis_client.set('poi_cache', pickle.dumps(data))
        # Also save to PostgreSQL for persistence
```

### 2. CDN Integration
```python
# Serve static assets from CDN
CDN_BASE = 'https://cdn.your-domain.com'

@app.route('/api/pois')
def get_pois_with_images():
    pois = get_all_pois()
    for poi in pois:
        poi['image_url'] = f"{CDN_BASE}/images/pois/{poi['id']}.jpg"
        poi['thumbnail'] = f"{CDN_BASE}/images/thumbnails/{poi['id']}.jpg"
    return jsonify(pois)
```

### 3. Caching Strategy
```python
from flask_caching import Cache

app = Flask(__name__)
cache = Cache(app, config={'CACHE_TYPE': 'redis'})

@app.route('/api/recommend', methods=['POST'])
@cache.memoize(timeout=300)  # Cache for 5 minutes
def recommend_with_cache():
    data = request.json
    route_key = '-'.join(map(str, data.get('route', [])))
    return get_cached_recommendations(route_key)
```

## 📊 Monitoring and Analytics

### 1. API Monitoring
```python
import time
from functools import wraps

def monitor_performance(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        result = f(*args, **kwargs)
        duration = time.time() - start_time
        
        # Log performance metrics
        print(f"API {f.__name__} took {duration*1000:.1f}ms")
        
        # Send to monitoring service (e.g., DataDog, New Relic)
        # monitoring_service.track_metric('api.response_time', duration)
        
        return result
    return decorated_function

@app.route('/api/recommend', methods=['POST'])
@monitor_performance
def recommend_monitored():
    # Your recommendation logic
    pass
```

### 2. User Analytics
```python
@app.route('/api/recommend', methods=['POST'])
def recommend_with_analytics():
    data = request.json
    
    # Track user behavior
    analytics.track({
        'event': 'recommendation_requested',
        'route_length': len(data.get('route', [])),
        'timestamp': datetime.utcnow(),
        'user_agent': request.headers.get('User-Agent')
    })
    
    recommendations = get_recommendations(data)
    
    analytics.track({
        'event': 'recommendations_served',
        'count': len(recommendations),
        'response_time': response_time
    })
    
    return jsonify(recommendations)
```

## 🔒 Security Considerations

### 1. Rate Limiting
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["1000 per hour"]
)

@app.route('/api/recommend', methods=['POST'])
@limiter.limit("10 per minute")  # Limit to 10 requests per minute
def recommend_rate_limited():
    # Your logic here
    pass
```

### 2. Input Validation
```python
from marshmallow import Schema, fields, ValidationError

class RecommendationSchema(Schema):
    route = fields.List(fields.Integer(), missing=[])
    count = fields.Integer(validate=lambda x: 1 <= x <= 10, missing=3)

@app.route('/api/recommend', methods=['POST'])
def recommend_validated():
    schema = RecommendationSchema()
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': err.messages}), 400
    
    # Process validated data
    return get_recommendations(data)
```

## 🚀 Quick Start for Your Website

1. **Copy these files to your web server:**
   - `fast_route_recommender.py`
   - `route_cache.pkl` (generated automatically)
   - `web_interface.html`

2. **Install requirements:**
   ```bash
   pip install flask flask-cors pandas numpy waitress
   ```

3. **Start the API:**
   ```bash
   python fast_route_recommender.py api
   ```

4. **Integrate with your website:**
   - Add the HTML/JavaScript from `web_interface.html`
   - Update API_BASE to your domain
   - Customize styling to match your brand

5. **Go live!** 🎉

Your tourism recommendation system is now **249x faster** and ready for real-world deployment!