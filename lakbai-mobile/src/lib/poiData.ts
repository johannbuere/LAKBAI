export interface POI {
  poiID: number;
  poiName: string;
  lat: number;
  long: number;
  theme: string;
}

// POI data - full dataset from CSV
export const POI_DATA: POI[] = [
  { poiID: 1, poiName: "Lignon Hill Nature Park", lat: 13.1557, long: 123.7421, theme: "Nature" },
  { poiID: 2, poiName: "Cagsawa Ruins", lat: 13.2508, long: 123.7088, theme: "Heritage" },
  { poiID: 3, poiName: "Daraga Church", lat: 13.1635, long: 123.6969, theme: "Religious" },
  { poiID: 4, poiName: "Mayon Planetarium and Science Park", lat: 13.1455, long: 123.7376, theme: "Education" },
  { poiID: 5, poiName: "Peñaranda Park", lat: 13.1400, long: 123.7442, theme: "Nature" },
  { poiID: 6, poiName: "Legazpi City Boulevard", lat: 13.1329, long: 123.7481, theme: "Recreation" },
  { poiID: 7, poiName: "Embarcadero de Legazpi", lat: 13.1357, long: 123.7499, theme: "Commercial" },
  { poiID: 8, poiName: "Pacific Mall Legazpi", lat: 13.1429, long: 123.7398, theme: "Commercial" },
  { poiID: 9, poiName: "Ayala Malls Legazpi", lat: 13.1395, long: 123.7362, theme: "Commercial" },
  { poiID: 10, poiName: "LCC Mall", lat: 13.1434, long: 123.7456, theme: "Commercial" },
  { poiID: 11, poiName: "Albay Park and Wildlife", lat: 13.1823, long: 123.7203, theme: "Nature" },
  { poiID: 12, poiName: "Hoyop-Hoyopan Cave", lat: 13.2278, long: 123.6901, theme: "Nature" },
  { poiID: 13, poiName: "Quitinday Hills", lat: 13.1062, long: 123.7298, theme: "Nature" },
  { poiID: 14, poiName: "Ligñon Hill Spring Resort", lat: 13.1552, long: 123.7409, theme: "Recreation" },
  { poiID: 15, poiName: "Kapuntukan Hill", lat: 13.0845, long: 123.7256, theme: "Nature" },
  { poiID: 16, poiName: "Mayon Skyline", lat: 13.2567, long: 123.6856, theme: "Recreation" },
  { poiID: 17, poiName: "Busay Falls", lat: 13.1234, long: 123.6789, theme: "Nature" },
  { poiID: 18, poiName: "Sumlang Lake", lat: 13.2101, long: 123.6445, theme: "Nature" },
  { poiID: 19, poiName: "Kawa-Kawa Hill", lat: 13.1178, long: 123.7323, theme: "Religious" },
  { poiID: 20, poiName: "Liberty Commercial Center", lat: 13.1442, long: 123.7423, theme: "Commercial" },
];

export async function loadPOIData(): Promise<POI[]> {
  // In a real app, you could load from CSV or API
  // For now, return the hardcoded data
  return Promise.resolve(POI_DATA);
}
