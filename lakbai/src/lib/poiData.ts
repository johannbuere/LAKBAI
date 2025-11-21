export interface POI {
  poiID: number;
  poiName: string;
  lat: number;
  long: number;
  theme: string;
}

// Import the CSV file as text
export async function loadPOIData(): Promise<POI[]> {
  try {
    const response = await fetch('/POI-Legazpi.csv');
    const text = await response.text();
    
    const lines = text.trim().split('\n');
    const pois: POI[] = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(';');
      if (parts.length >= 5) {
        pois.push({
          poiID: parseInt(parts[0]),
          poiName: parts[1],
          lat: parseFloat(parts[2]),
          long: parseFloat(parts[3]),
          theme: parts[4],
        });
      }
    }
    
    return pois;
  } catch (error) {
    console.error('Error loading POI data:', error);
    return [];
  }
}
