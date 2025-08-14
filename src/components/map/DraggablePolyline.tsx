import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Position } from '../../types';

interface DraggablePolylineProps {
  positions: Position[];
  startPoint: Position | null;
  endPoint: Position | null;
  waypoints: Position[];
  onAddWaypoint: (position: Position, index: number) => void;
  color?: string;
  weight?: number;
  opacity?: number;
}

const DraggablePolyline: React.FC<DraggablePolylineProps> = ({
  positions,
  startPoint,
  endPoint,
  waypoints,
  onAddWaypoint,
  color = "var(--color-error)",
  weight = 5,
  opacity = 0.7
}) => {
  const map = useMap();
  const polylineRef = useRef<L.Polyline | null>(null);
  const ghostMarkersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (positions.length < 2 || !startPoint || !endPoint) return;

    // Remove existing polyline and ghost markers
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
    }
    ghostMarkersRef.current.forEach(marker => map.removeLayer(marker));
    ghostMarkersRef.current = [];

    // Create polyline
    const latLngs = positions.map(pos => [pos.lat, pos.lng] as [number, number]);
    const polyline = L.polyline(latLngs, {
      color,
      weight,
      opacity
    });

    polyline.addTo(map);
    polylineRef.current = polyline;

    // Create the logical sequence: start -> waypoints -> end
    const logicalSequence = [startPoint, ...waypoints, endPoint];

    // Helper function to find the closest point in the route to a logical point
    const findRoutePointIndex = (targetPoint: Position): number => {
      let minDistance = Infinity;
      let closestIndex = 0;
      
      for (let i = 0; i < positions.length; i++) {
        const routePoint = positions[i];
        const distance = Math.sqrt(
          Math.pow(routePoint.lat - targetPoint.lat, 2) + 
          Math.pow(routePoint.lng - targetPoint.lng, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = i;
        }
      }
      return closestIndex;
    };

    // Map each logical segment to route indices
    const segmentMappings: Array<{ logicalIndex: number, startRouteIndex: number, endRouteIndex: number }> = [];
    
    for (let logicalIdx = 0; logicalIdx < logicalSequence.length - 1; logicalIdx++) {
      const startRouteIdx = findRoutePointIndex(logicalSequence[logicalIdx]);
      const endRouteIdx = findRoutePointIndex(logicalSequence[logicalIdx + 1]);
      
      segmentMappings.push({
        logicalIndex: logicalIdx,
        startRouteIndex: startRouteIdx,
        endRouteIndex: endRouteIdx
      });
    }

    // Helper function to check if a point is near a waypoint
    const isNearWaypoint = (lat: number, lng: number, threshold: number = 0.0001): boolean => {
      for (const waypoint of waypoints) {
        const distance = Math.sqrt(
          Math.pow(waypoint.lat - lat, 2) + Math.pow(waypoint.lng - lng, 2)
        );
        if (distance < threshold) return true;
      }
      // Also check start and end points
      if (startPoint) {
        const distance = Math.sqrt(
          Math.pow(startPoint.lat - lat, 2) + Math.pow(startPoint.lng - lng, 2)
        );
        if (distance < threshold) return true;
      }
      if (endPoint) {
        const distance = Math.sqrt(
          Math.pow(endPoint.lat - lat, 2) + Math.pow(endPoint.lng - lng, 2)
        );
        if (distance < threshold) return true;
      }
      return false;
    };

    // Create ghost markers for each route segment
    for (let routeIdx = 0; routeIdx < positions.length - 1; routeIdx++) {
      const start = positions[routeIdx];
      const end = positions[routeIdx + 1];
      
      // Find which logical segment this route segment belongs to
      let logicalSegmentIndex = 0;
      for (let segIdx = 0; segIdx < segmentMappings.length; segIdx++) {
        const mapping = segmentMappings[segIdx];
        if (routeIdx >= mapping.startRouteIndex && routeIdx < mapping.endRouteIndex) {
          logicalSegmentIndex = mapping.logicalIndex;
          break;
        }
      }
      
      // Calculate midpoint
      const midLat = (start.lat + end.lat) / 2;
      const midLng = (start.lng + end.lng) / 2;
      
      // Skip this ghost marker if it's too close to an existing waypoint
      if (isNearWaypoint(midLat, midLng)) {
        continue;
      }

      // Create invisible draggable marker
      const ghostMarker = L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: 'ghost-marker',
          html: '<div style="width: 12px; height: 12px; background: white; border: 2px solid #666; border-radius: 50%; cursor: move; opacity: 0.8;"></div>',
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        }),
        draggable: true,
        opacity: 0
      });

      // Show ghost marker on polyline hover
      let hoverTimeout: NodeJS.Timeout;
      
      polyline.on('mouseover', (e) => {
        const point = map.latLngToLayerPoint(e.latlng);
        const linePoints = latLngs.map(ll => map.latLngToLayerPoint(ll));
        
        // Find closest segment
        let closestSegment = 0;
        let minDistance = Infinity;
        
        for (let j = 0; j < linePoints.length - 1; j++) {
          const segmentStart = linePoints[j];
          const segmentEnd = linePoints[j + 1];
          const distance = distanceToLineSegment(point, segmentStart, segmentEnd);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestSegment = j;
          }
        }
        
        // Show the ghost marker for the closest segment, but not if we're too close to a waypoint
        if (closestSegment === routeIdx && minDistance < 20) { // 20px tolerance
          // Additional check: don't show if mouse is near a waypoint
          const mouseLatLng = e.latlng;
          if (!isNearWaypoint(mouseLatLng.lat, mouseLatLng.lng, 0.0005)) { // Larger threshold for mouse position
            clearTimeout(hoverTimeout);
            ghostMarker.setOpacity(0.8);
          }
        }
      });

      polyline.on('mouseout', () => {
        hoverTimeout = setTimeout(() => {
          ghostMarker.setOpacity(0);
        }, 100);
      });

      ghostMarker.on('mouseover', () => {
        clearTimeout(hoverTimeout);
        ghostMarker.setOpacity(0.8);
      });

      ghostMarker.on('mouseout', () => {
        hoverTimeout = setTimeout(() => {
          ghostMarker.setOpacity(0);
        }, 100);
      });

      ghostMarker.on('dragend', (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        onAddWaypoint({ lat: position.lat, lng: position.lng }, logicalSegmentIndex);
        ghostMarker.setOpacity(0);
      });

      ghostMarker.addTo(map);
      ghostMarkersRef.current.push(ghostMarker);
    }

    return () => {
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
      }
      ghostMarkersRef.current.forEach(marker => map.removeLayer(marker));
    };
  }, [map, positions, startPoint, endPoint, waypoints, onAddWaypoint, color, weight, opacity]);

  return null;
};

// Helper function to calculate distance from point to line segment
function distanceToLineSegment(
  point: L.Point, 
  lineStart: L.Point, 
  lineEnd: L.Point
): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number, yy: number;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

export default DraggablePolyline;