import { Position, RouteResponse, RouteStats } from '../types';

export const fetchRoute = async (start: Position, end: Position, profile: string = 'mtb'): Promise<{ route: Position[]; stats: RouteStats | null }> => {
  const url = `http://localhost:17777/brouter?lonlats=${start.lng},${start.lat}|${end.lng},${end.lat}&profile=${profile}&format=geojson`;
  const response = await fetch(url);
  const data: RouteResponse = await response.json();

  if (data.features && data.features.length > 0) {
    const feature = data.features[0];
    const coordinates = feature.geometry.coordinates;
    
    const route: Position[] = coordinates.map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));

    const stats: RouteStats | null = feature.properties ? {
      distance: (feature.properties['track-length'] || 0) / 1000, // Convert to km
      ascent: feature.properties['filtered ascend'] || 0,
      descent: feature.properties['filtered descend'] || 0,
      time: (feature.properties['total-time'] || 0) / 3600 // Convert to hours
    } : null;

    return { route, stats };
  }

  return { route: [], stats: null };
};
