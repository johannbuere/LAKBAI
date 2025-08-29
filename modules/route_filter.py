import requests
from geopy.distance import geodesic
import pandas as pd

def is_on_route(start, end, poi, buffer_km=5) -> bool:
    """
    Check if a POI is within `buffer_km` of the Valhalla route (start → end).
    """
    url = "http://localhost:8002/route"
    headers = {"Content-Type": "application/json"}
    body = {
        "locations": [{"lat": start[0], "lon": start[1]}, {"lat": end[0], "lon": end[1]}],
        "costing": "auto",
        "directions_options": {"units": "kilometers"}
    }

    try:
        response = requests.post(url, headers=headers, json=body)
        route = response.json()

        # Extract lat/lon pairs from route shape (simplified here)
        shape = [(loc["lat"], loc["lon"]) for loc in route["trip"]["locations"]]

        poi_loc = (poi['latitude'], poi['longitude'])
        min_dist = min(geodesic(poi_loc, s).km for s in shape)

        return min_dist <= buffer_km
    except Exception as e:
        print("Valhalla error:", e)
        return False

def filter_on_route(df: pd.DataFrame, start: tuple, end: tuple) -> pd.DataFrame:
    """
    Filter dataset to only include POIs within buffer of the route.
    """
    df['on_route'] = df.apply(lambda row: is_on_route(start, end, row), axis=1)
    return df[df['on_route']]
