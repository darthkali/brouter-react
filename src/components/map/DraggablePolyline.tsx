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
  const hoverPolylineRef = useRef<L.Polyline | null>(null);
  const hoverMarkerRef = useRef<L.Marker | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartPositionRef = useRef<{ lat: number, lng: number, segmentIndex: number } | null>(null);

  useEffect(() => {
    if (positions.length < 2) return;

    // Clean up existing layers
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
    }
    if (hoverPolylineRef.current) {
      map.removeLayer(hoverPolylineRef.current);
    }
    if (hoverMarkerRef.current) {
      map.removeLayer(hoverMarkerRef.current);
    }

    // Create route lines
    const latLngs = positions.map(pos => [pos.lat, pos.lng] as [number, number]);
    
    // Visible route line
    const polyline = L.polyline(latLngs, {
      color,
      weight,
      opacity,
      interactive: false // Non-interactive to avoid blocking waypoint markers
    });
    
    // Invisible wider polyline for hover/click detection
    const hoverPolyline = L.polyline(latLngs, {
      color: 'transparent',
      weight: 25, // Wide enough for easy clicking
      opacity: 0,
      interactive: true
    });

    // Hover marker that shows where waypoint will be added
    const hoverMarker = L.marker([0, 0], {
      icon: L.divIcon({
        className: 'waypoint-hover-marker',
        html: '<div style="width: 16px; height: 16px; background: #ff6b6b; border: 3px solid white; border-radius: 50%; box-shadow: 0 3px 6px rgba(0,0,0,0.4); pointer-events: none;"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      }),
      opacity: 0,
      interactive: false,
      zIndexOffset: -500 // Below waypoint markers
    });

    polyline.addTo(map);
    hoverPolyline.addTo(map);
    hoverMarker.addTo(map);
    
    polylineRef.current = polyline;
    hoverPolylineRef.current = hoverPolyline;
    hoverMarkerRef.current = hoverMarker;

    // Helper functions
    const findClosestPointOnLine = (mouseLatLng: L.LatLng): { point: L.LatLng, segmentIndex: number } => {
      const mousePoint = map.latLngToLayerPoint(mouseLatLng);
      const linePoints = latLngs.map(ll => map.latLngToLayerPoint(ll));
      
      let closestPoint = linePoints[0];
      let minDistance = Infinity;
      let segmentIndex = 0;
      
      for (let i = 0; i < linePoints.length - 1; i++) {
        const start = linePoints[i];
        const end = linePoints[i + 1];
        
        const A = mousePoint.x - start.x;
        const B = mousePoint.y - start.y;
        const C = end.x - start.x;
        const D = end.y - start.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = lenSq !== 0 ? dot / lenSq : -1;
        
        let xx: number, yy: number;
        if (param < 0) {
          xx = start.x;
          yy = start.y;
        } else if (param > 1) {
          xx = end.x;
          yy = end.y;
        } else {
          xx = start.x + param * C;
          yy = start.y + param * D;
        }

        const distance = Math.sqrt(Math.pow(mousePoint.x - xx, 2) + Math.pow(mousePoint.y - yy, 2));
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = L.point(xx, yy);
          segmentIndex = i;
        }
      }
      
      return {
        point: map.layerPointToLatLng(closestPoint),
        segmentIndex
      };
    };

    const isNearExistingPoint = (latlng: L.LatLng): boolean => {
      const threshold = 0.001; 
      const allPoints = [startPoint, ...waypoints, endPoint];
      
      for (const point of allPoints) {
        if (!point) continue;
        const distance = Math.sqrt(
          Math.pow(point.lat - latlng.lat, 2) + Math.pow(point.lng - latlng.lng, 2)
        );
        if (distance < threshold) return true;
      }
      return false;
    };

    const findLogicalSegmentIndex = (segmentIndex: number): number => {
      if (!startPoint || !endPoint) return 0;
      
      const logicalSequence = [startPoint, ...waypoints, endPoint];
      
      for (let i = 0; i < logicalSequence.length - 1; i++) {
        const segStart = logicalSequence[i];
        const segEnd = logicalSequence[i + 1];
        
        if (!segStart || !segEnd) continue;
        
        // Find route indices for this logical segment
        let startIdx = 0, endIdx = positions.length - 1;
        let minStartDist = Infinity, minEndDist = Infinity;
        
        for (let j = 0; j < positions.length; j++) {
          const routePoint = positions[j];
          
          const startDist = Math.sqrt(
            Math.pow(routePoint.lat - segStart.lat, 2) + 
            Math.pow(routePoint.lng - segStart.lng, 2)
          );
          if (startDist < minStartDist) {
            minStartDist = startDist;
            startIdx = j;
          }
          
          const endDist = Math.sqrt(
            Math.pow(routePoint.lat - segEnd.lat, 2) + 
            Math.pow(routePoint.lng - segEnd.lng, 2)
          );
          if (endDist < minEndDist) {
            minEndDist = endDist;
            endIdx = j;
          }
        }
        
        if (segmentIndex >= startIdx && segmentIndex <= endIdx) {
          return i;
        }
      }
      
      return 0;
    };

    // Event handlers for hover polyline
    let hoverTimeout: NodeJS.Timeout;

    // Show hover marker on mousemove
    hoverPolyline.on('mousemove', (e) => {
      if (isDraggingRef.current) return;
      
      clearTimeout(hoverTimeout);
      
      const result = findClosestPointOnLine(e.latlng);
      
      // Don't show near existing waypoints
      if (!isNearExistingPoint(result.point)) {
        hoverMarker.setLatLng(result.point);
        hoverMarker.setOpacity(0.8);
      } else {
        hoverMarker.setOpacity(0);
      }
    });

    // Hide hover marker on mouseout
    hoverPolyline.on('mouseout', () => {
      if (!isDraggingRef.current) {
        hoverTimeout = setTimeout(() => {
          hoverMarker.setOpacity(0);
        }, 100);
      }
    });

    // Start drag on mousedown
    hoverPolyline.on('mousedown', (e) => {
      const result = findClosestPointOnLine(e.latlng);
      
      // Don't start drag near existing waypoints
      if (isNearExistingPoint(result.point)) {
        return;
      }

      // Start dragging
      isDraggingRef.current = true;
      dragStartPositionRef.current = {
        lat: result.point.lat,
        lng: result.point.lng,
        segmentIndex: result.segmentIndex
      };
      
      // Show hover marker and make it draggable-looking
      hoverMarker.setLatLng(result.point);
      hoverMarker.setOpacity(1);
      hoverMarker.setIcon(L.divIcon({
        className: 'waypoint-drag-marker',
        html: '<div style="width: 20px; height: 20px; background: #ffaa00; border: 3px solid white; border-radius: 50%; box-shadow: 0 3px 8px rgba(0,0,0,0.5); pointer-events: none; cursor: grabbing;"></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      }));

      // Disable map dragging during waypoint drag
      map.dragging.disable();
      map.getContainer().style.cursor = 'grabbing';
    });

    // Global mouse move during drag
    const handleGlobalMouseMove = (e: L.LeafletMouseEvent) => {
      if (!isDraggingRef.current) return;
      
      // Update hover marker position to follow mouse
      hoverMarker.setLatLng(e.latlng);
    };

    // Global mouse up - finish drag and add waypoint
    const handleGlobalMouseUp = (e: L.LeafletMouseEvent) => {
      if (!isDraggingRef.current || !dragStartPositionRef.current) return;
      
      isDraggingRef.current = false;
      
      // Reset hover marker style
      hoverMarker.setIcon(L.divIcon({
        className: 'waypoint-hover-marker',
        html: '<div style="width: 16px; height: 16px; background: #ff6b6b; border: 3px solid white; border-radius: 50%; box-shadow: 0 3px 6px rgba(0,0,0,0.4); pointer-events: none;"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      }));
      
      // Re-enable map dragging
      map.dragging.enable();
      map.getContainer().style.cursor = '';
      
      // Find logical segment index for the waypoint
      const logicalIndex = findLogicalSegmentIndex(dragStartPositionRef.current.segmentIndex);
      
      // Add waypoint at final mouse position
      onAddWaypoint(
        { lat: e.latlng.lat, lng: e.latlng.lng },
        logicalIndex
      );
      
      // Hide hover marker
      hoverMarker.setOpacity(0);
      dragStartPositionRef.current = null;
    };

    // Add global event listeners
    map.on('mousemove', handleGlobalMouseMove);
    map.on('mouseup', handleGlobalMouseUp);

    return () => {
      // Remove global event listeners
      map.off('mousemove', handleGlobalMouseMove);
      map.off('mouseup', handleGlobalMouseUp);
      
      // Reset state if dragging
      if (isDraggingRef.current) {
        map.dragging.enable();
        map.getContainer().style.cursor = '';
        isDraggingRef.current = false;
      }
      
      // Remove layers
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
      }
      if (hoverPolylineRef.current) {
        map.removeLayer(hoverPolylineRef.current);
      }
      if (hoverMarkerRef.current) {
        map.removeLayer(hoverMarkerRef.current);
      }
      
      // Clear timeout and reset refs
      clearTimeout(hoverTimeout);
      dragStartPositionRef.current = null;
    };
  }, [map, positions, startPoint, endPoint, waypoints, onAddWaypoint, color, weight, opacity]);

  return null;
};


export default DraggablePolyline;