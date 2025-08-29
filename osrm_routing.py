from fastapi import FastAPI, Query
import requests

app = FastAPI()

OSRM_ENDPOINTS = {
    "car": "http://localhost:5000/route/v1/driving/",
    "foot": "http://localhost:5001/route/v1/foot/",
    "bicycle": "http://localhost:5002/route/v1/bicycle/"
}

@app.get("/route")
def get_route(
    start_lat: float = Query(...),
    start_lon: float = Query(...),
    end_lat: float = Query(...),
    end_lon: float = Query(...),
    mode: str = Query("car")
):
    if mode not in OSRM_ENDPOINTS:
        return {"error": "Invalid mode"}

    url = f"{OSRM_ENDPOINTS[mode]}{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson"

    r = requests.get(url)
    return r.json()
