import json, pandas as pd
from sklearn.cluster import KMeans
from shapely.geometry import shape

#config here
SRC = "albay_pois.geojson"
OUT = "albay_pois_clustered.csv"
K = 8  # number of geographic clusters; tune natin later

# map osm tags-> our high-level categories
# we will add more as needed
CATEGORY_MAP = {
    # tourism
    ("tourism", "attraction"): "heritage",
    ("tourism", "viewpoint"): "nature",
    ("tourism", "museum"): "heritage",
    ("tourism", "theme_park"): "adventure",
    # historic family
    ("historic", "*"): "heritage",
    # natural
    ("natural", "beach"): "nature",
    ("natural", "peak"): "nature",
    ("natural", "volcano"): "nature",
    ("natural", "waterfall"): "nature",
    # leisure
    ("leisure", "park"): "nature",
    # food
    ("amenity", "restaurant"): "gastronomy",
    ("amenity", "cafe"): "gastronomy",
    ("amenity", "fast_food"): "gastronomy",
    ("amenity", "bar"): "gastronomy",
}

def assign_category(tags: dict) -> str:
    # check specific matches first
    for (k, v), cat in CATEGORY_MAP.items():
        if k in tags and (v == "*" or tags[k] == v):
            return cat
    return "other"

# load na dito si geojson
with open(SRC, "r", encoding="utf-8") as f:
    gj = json.load(f)

records = []
for feat in gj["features"]:
    props = feat.get("properties", {}) or {}
    geom = feat.get("geometry")
    if not geom:
        continue
    try:
        g = shape(geom)
        x, y = (g.centroid.x, g.centroid.y)  # lon, lat
    except Exception:
        continue

    tags = props.get("tags") or props  # osmium may flatten tags 
    name = tags.get("name") or props.get("name") or ""
    cat = assign_category(tags)

    records.append({
        "osm_id": props.get("id") or props.get("@id") or "",
        "name": name,
        "lon": x, "lat": y,
        "raw_tags": json.dumps(tags, ensure_ascii=False),
        "category": cat
    })

df = pd.DataFrame(records).dropna(subset=["lat","lon"])

# run KMeans on (lat, lon)
# Maliit si Albay kaya Euclidean on degrees is okay to start.
km = KMeans(n_clusters=K, n_init="auto", random_state=42)
df["cluster"] = km.fit_predict(df[["lat","lon"]])

# simple popularity prior: prefer named places
df["pop_score"] = (df["name"].str.len() > 0).astype(int)

df.to_csv(OUT, index=False, encoding="utf-8")
print(f"Wrote {OUT} with {len(df)} rows")
