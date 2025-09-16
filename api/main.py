from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests

app = FastAPI(title="LAKBAI API")

# dummy POI data
POIS = [
    {"id": 1, "name": "Legazpi Cathedral", "lat": 13.142, "lon": 123.735},
    {"id": 2, "name": "Cagsawa Ruins", "lat": 13.136, "lon": 123.746},
    {"id": 3, "name": "Mayon Volcano Viewpoint", "lat": 13.257, "lon": 123.685},
]

# body model request
class UserLocation(BaseModel):
    lat: float
    lon: float

# api endpoints
@app.get("/pois")
def get_pois():
    """Return all POIs"""
    return {"pois": POIS}

@app.post("/recommend")
def recommend_poi(user: UserLocation):
    """
    Minimal recommendation: return nearest POI
    In real project, replace with AI model
    """
    def distance(lat1, lon1, lat2, lon2):
        return ((lat1 - lat2)**2 + (lon1 - lon2)**2)**0.5

    nearest = min(POIS, key=lambda poi: distance(user.lat, user.lon, poi["lat"], poi["lon"]))
    return {"recommended": nearest}

@app.get("/route")
def get_route(start_lat: float, start_lon: float, end_lat: float, end_lon: float):
    """
    Query OSRM server for route.
    OSRM must be running at http://localhost:5000
    """
    osrm_url = f"http://localhost:5000/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson"
    resp = requests.get(osrm_url)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="OSRM routing failed")
    return resp.json()
