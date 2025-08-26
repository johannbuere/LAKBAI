import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

df = pd.read_csv("albay_tourist_spots.csv")

lat_longg_pop = df[['latitude', 'longitude', 'popularity_score']]
lat, longg, pop = df.latitude, df.longitude, df.popularity_score

plt.scatter(longg, lat, pop)