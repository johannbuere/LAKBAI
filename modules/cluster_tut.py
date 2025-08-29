import pandas as pd
from geopy.distance import geodesic


df = pd.read_csv("albay_tourist_spots.csv")


user_location = (13.1391, 123.7438)  # Legazpi downtown
preferred_categories = ["heritage", "nature"]

# Filter by category
filtered = df[df['category'].isin(preferred_categories)].copy()

# Compute distance from user
filtered['distance_km'] = filtered.apply(
    lambda row: geodesic(user_location, (row['latitude'], row['longitude'])).km,
    axis=1
)

# Rank by distance first, then popularity
filtered = filtered.sort_values(by=['distance_km', 'popularity_score'], ascending=[True, False])

print(filtered[['name', 'category', 'distance_km', 'popularity_score']])
