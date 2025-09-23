from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from typing import List, Optional

app = FastAPI(
    title="LAKBAI API",
    description="AI-Powered Tourist Navigation and Recommendation System for Legazpi City",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enhanced POI data for Legazpi City
POIS = [
    {
        "id": 1,
        "name": "Legazpi Cathedral",
        "lat": 13.142,
        "lon": 123.735,
        "category": "Religious Site",
        "description": "Beautiful historic cathedral in the heart of Legazpi City",
        "rating": 4.5
    },
    {
        "id": 2,
        "name": "Cagsawa Ruins",
        "lat": 13.136,
        "lon": 123.746,
        "category": "Historical Site",
        "description": "Iconic ruins with stunning Mayon Volcano backdrop",
        "rating": 4.8
    },
    {
        "id": 3,
        "name": "Mayon Volcano Viewpoint",
        "lat": 13.257,
        "lon": 123.685,
        "category": "Scenic View",
        "description": "Best viewpoint to see the perfect cone of Mayon Volcano",
        "rating": 4.7
    },
    {
        "id": 4,
        "name": "Embarcadero de Legazpi",
        "lat": 13.143,
        "lon": 123.742,
        "category": "Waterfront",
        "description": "Scenic waterfront promenade with dining and shopping",
        "rating": 4.3
    },
    {
        "id": 5,
        "name": "Albay Park and Wildlife",
        "lat": 13.148,
        "lon": 123.731,
        "category": "Nature Park",
        "description": "Mini zoo and park perfect for families",
        "rating": 4.2
    }
]

# Pydantic models
class UserLocation(BaseModel):
    lat: float
    lon: float

class POI(BaseModel):
    id: int
    name: str
    lat: float
    lon: float
    category: Optional[str] = None
    description: Optional[str] = None
    rating: Optional[float] = None

class POIResponse(BaseModel):
    pois: List[POI]

class RecommendationResponse(BaseModel):
    recommended: POI

# API endpoints
@app.get("/", summary="Health Check")
def read_root():
    """Health check endpoint"""
    return {"message": "LAKBAI API is running", "status": "healthy"}

@app.get("/pois", response_model=POIResponse, summary="Get all POIs")
def get_pois():
    """Return all Points of Interest in Legazpi City"""
    return {"pois": POIS}

@app.post("/recommend", response_model=RecommendationResponse, summary="Get AI Recommendations")
def recommend_poi(user: UserLocation):
    """
    AI-powered POI recommendation based on user location.
    Currently uses simple distance calculation - will be enhanced with ML model.
    """
    def calculate_distance(lat1, lon1, lat2, lon2):
        """Calculate Euclidean distance between two points"""
        return ((lat1 - lat2)**2 + (lon1 - lon2)**2)**0.5

    # Simple recommendation algorithm (to be replaced with AI model)
    recommendations = []
    for poi in POIS:
        distance = calculate_distance(user.lat, user.lon, poi["lat"], poi["lon"])
        score = (poi.get("rating", 4.0) * 0.7) + (1/max(distance, 0.001) * 0.3)
        recommendations.append((poi, score))
    
    # Sort by score and return the best recommendation
    recommendations.sort(key=lambda x: x[1], reverse=True)
    best_poi = recommendations[0][0]
    
    return {"recommended": best_poi}

@app.get("/route", summary="Get Route")
def get_route(
    start_lat: float, 
    start_lon: float, 
    end_lat: float, 
    end_lon: float,
    transport_mode: str = "driving"
):
    """
    Get route between two points using OSRM.
    Supports multiple transport modes: driving, cycling, walking.
    OSRM server must be running at http://localhost:5000
    """
    # Map transport modes to OSRM profiles
    profile_map = {
        "driving": "driving",
        "cycling": "cycling", 
        "walking": "foot"
    }
    
    profile = profile_map.get(transport_mode, "driving")
    osrm_host = os.getenv("OSRM_HOST", "localhost")
    osrm_port = os.getenv("OSRM_PORT", "5000")
    
    osrm_url = f"http://{osrm_host}:{osrm_port}/route/v1/{profile}/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson"
    
    try:
        resp = requests.get(osrm_url, timeout=10)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=500, 
                detail=f"OSRM routing failed: {resp.text}"
            )
        return resp.json()
    except requests.exceptions.RequestException as e:
        # Fallback: return a simple straight line route if OSRM is not available
        return {
            "routes": [{
                "geometry": {
                    "coordinates": [[start_lon, start_lat], [end_lon, end_lat]]
                },
                "duration": 0,
                "distance": 0
            }],
            "code": "Ok",
            "fallback": True,
            "message": "OSRM server not available, showing direct route"
        }

@app.get("/health", summary="Health Check")
def health_check():
    """Detailed health check for the API and its dependencies"""
    health_status = {
        "api": "healthy",
        "osrm": "unknown",
        "timestamp": "2024-01-01T00:00:00Z"
    }
    
    # Check OSRM connectivity
    try:
        osrm_host = os.getenv("OSRM_HOST", "localhost")
        osrm_port = os.getenv("OSRM_PORT", "5000")
        resp = requests.get(f"http://{osrm_host}:{osrm_port}/nearest/v1/driving/123.735,13.142", timeout=5)
        health_status["osrm"] = "healthy" if resp.status_code == 200 else "unhealthy"
    except:
        health_status["osrm"] = "unhealthy"
    
    return health_status

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
