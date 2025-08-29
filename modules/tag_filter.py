import pandas as pd

def filter_by_tags(df: pd.DataFrame, preferred_categories: list) -> pd.DataFrame:
    """
    Filter POIs by user-preferred categories (tags).
    
    Args:
        df (pd.DataFrame): Dataset of POIs.
        preferred_categories (list): e.g. ["heritage", "nature"]

    Returns:
        pd.DataFrame: Filtered dataset.
    """
    return df[df['category'].isin(preferred_categories)].copy()
