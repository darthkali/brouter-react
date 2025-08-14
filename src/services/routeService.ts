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

    const stats: RouteStats | null = feature.properties ? (() => {
      const props = feature.properties as any;
      const plainAscend = parseFloat(props['plain-ascend'] || '0');
      const filteredAscend = parseFloat(props['filtered ascend'] || '0');
      
      return {
        distance: parseFloat(props['track-length'] || '0') / 1000, // Convert to km
        ascent: Math.max(0, filteredAscend > 0 ? filteredAscend : plainAscend),
        descent: Math.max(0, Math.abs(Math.min(0, plainAscend))), // Only negative plain-ascend values become descent
        time: parseFloat(props['total-time'] || '0') / 3600 // Convert to hours
      };
    })() : null;

    return { route, stats };
  }

  return { route: [], stats: null };
};
