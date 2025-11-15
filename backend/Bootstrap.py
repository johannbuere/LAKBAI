"""
Bootstrap module for POI time estimation and distance calculations
"""
import pandas as pd
import numpy as np
from math import radians, cos, sin, asin, sqrt

def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great circle distance in kilometers between two points
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r

def get_distance_matrix(pois):
    """
    Create a distance matrix between all POIs
    Returns a dictionary with (poi_i, poi_j) -> distance in km
    """
    dist_matrix = {}

    for idx1, poi1 in pois.iterrows():
        for idx2, poi2 in pois.iterrows():
            if poi1['poiID'] != poi2['poiID']:
                distance = haversine(
                    poi1['long'], poi1['lat'],
                    poi2['long'], poi2['lat']
                )
                dist_matrix[(poi1['poiID'], poi2['poiID'])] = distance
            else:
                dist_matrix[(poi1['poiID'], poi2['poiID'])] = 0.0

    return dist_matrix

def inferPOITimes(pois, userVisits):
    """
    Infer average time spent at each POI based on user visit data
    Returns a dictionary: poi_id -> estimated_time_in_hours
    """
    poi_times = {}

    # Default times by theme (in hours)
    default_times = {
        'Restaurant': 1.5,
        'Cafe': 1.0,
        'Hotel': 12.0,  # Assuming overnight stay
        'Park': 2.0,
        'Religious': 1.0,
        'Bar': 2.0,
        'Mall': 2.5,
        'Tourist_Attraction': 2.0,
        'Historical_Landmark': 1.5,
        'Hill': 2.5,
        'Adventure': 3.0,
        'ATV': 2.0,
        'Church': 1.0,
        'Resort': 4.0,
        'Sports': 2.0,
        'Bakery': 0.5,
        'Spa': 2.0,
        'Zoo': 3.0,
        'Mountain_Biking': 3.0,
        'Food': 1.5
    }

    # Calculate actual time spent based on visit sequences
    for _, poi in pois.iterrows():
        poi_id = poi['poiID']
        theme = poi['theme']

        # Get visits for this POI
        poi_visits = userVisits[userVisits['poiID'] == poi_id]

        if len(poi_visits) > 0:
            # Group by sequence to find time between visits
            times = []
            for seq_id in poi_visits['seqID'].unique():
                seq_visits = userVisits[userVisits['seqID'] == seq_id].sort_values('dateTaken')

                # Find this POI in the sequence
                poi_idx = seq_visits[seq_visits['poiID'] == poi_id].index
                if len(poi_idx) > 0:
                    poi_position = seq_visits.index.get_loc(poi_idx[0])

                    # If there's a next POI, calculate time difference
                    if poi_position < len(seq_visits) - 1:
                        current_time = seq_visits.iloc[poi_position]['dateTaken']
                        next_time = seq_visits.iloc[poi_position + 1]['dateTaken']
                        time_diff = (next_time - current_time) / 3600  # Convert to hours

                        # Filter outliers (between 0.1 and 12 hours)
                        if 0.1 < time_diff < 12:
                            times.append(time_diff)

            # Use median of actual times if available, otherwise use default
            if times:
                poi_times[poi_id] = np.median(times)
            else:
                poi_times[poi_id] = default_times.get(theme, 1.5)
        else:
            # No visit data, use default
            poi_times[poi_id] = default_times.get(theme, 1.5)

    return poi_times

def inferPOITimes2(pois, userVisits):
    """
    Alternative POI time inference with more sophisticated logic
    """
    # For now, use the same logic as inferPOITimes
    # Can be enhanced with more complex algorithms
    return inferPOITimes(pois, userVisits)

def infer2POIsTimes(pois, userVisits):
    """
    Infer transition times between pairs of POIs
    Returns dictionary: (poi_i, poi_j) -> time in hours
    """
    transition_times = {}
    dist_matrix = get_distance_matrix(pois)

    # Average travel speed in km/h (mix of walking and driving)
    avg_speed = 15.0

    # Calculate transition times from distance
    for poi_pair, distance in dist_matrix.items():
        # Travel time = distance / speed + buffer time
        travel_time = distance / avg_speed + 0.25  # Add 15 min buffer
        transition_times[poi_pair] = travel_time

    # Refine with actual user data
    for seq_id in userVisits['seqID'].unique():
        seq_visits = userVisits[userVisits['seqID'] == seq_id].sort_values('dateTaken')

        for i in range(len(seq_visits) - 1):
            from_poi = seq_visits.iloc[i]['poiID']
            to_poi = seq_visits.iloc[i + 1]['poiID']

            time_diff = (seq_visits.iloc[i + 1]['dateTaken'] -
                        seq_visits.iloc[i]['dateTaken']) / 3600

            # Update if reasonable (filter outliers)
            if 0.1 < time_diff < 10:
                key = (from_poi, to_poi)
                if key in transition_times:
                    # Average with existing estimate
                    transition_times[key] = (transition_times[key] + time_diff) / 2

    return transition_times

if __name__ == "__main__":
    # Quick test
    print("Bootstrap module loaded successfully")
    print("Available functions:")
    print("  - get_distance_matrix(pois)")
    print("  - inferPOITimes(pois, userVisits)")
    print("  - inferPOITimes2(pois, userVisits)")
    print("  - infer2POIsTimes(pois, userVisits)")
