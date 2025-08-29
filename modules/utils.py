import pandas as pd

def load_dataset(path="albay_tourist_spots.csv") -> pd.DataFrame:
    """
    Load the tourist spots dataset.
    """
    return pd.read_csv(path)
