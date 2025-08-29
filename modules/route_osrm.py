import folium

from folium import Map
from pydantic import BaseModel


class Point(BaseModel):
    lat: float
    lon: float

def get_folium_map(center: Point, points: list[Point], zoom_level: int = 14) -> Map:
    folium_map = folium.Map(location=[center.lat, center.lon], zoom_start=zoom_level)

    for point in points:
        folium.Marker(location=[point.lat, point.lon], popup='Point').add_to(folium_map)
    return folium_map

#examples
point_1 = Point(lat=13.1684, lon=-23.7504)

folium_map = get_folium_map(center=point_1, points=[point_1])
folium_map 