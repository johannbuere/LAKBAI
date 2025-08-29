from geopy.distance import geodesic
import pandas as pd

def add_distance(df: pd.DataFrame, user_location: tuple) -> pd.DataFrame:
    """
    Add distance (km) of each POI from user start location.
    """
    df['distance_km'] = df.apply(
        lambda row: geodesic(user_location, (row['latitude'], row['longitude'])).km,
        axis=1
    )
    return df

def add_score(df: pd.DataFrame, alpha=0.7, beta=0.3) -> pd.DataFrame:
    """
    Weighted scoring function combining distance and popularity.
    
    Score = alpha * distance + beta * (100 - popularity)/10
    Lower score = better recommendation.
    """
    df['score'] = (
        alpha * df['distance_km'] +
        beta * (100 - df['popularity_score']) / 10
    )
    return df
