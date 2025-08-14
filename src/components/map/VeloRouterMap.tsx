import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Position, LoadingSegment, RouteSegment } from '../../types';
import { createStartPointIcon, createEndPointIcon, createNumberedWaypointIcon } from '../../utils/leafletSetup';
import MapClickHandler from './MapClickHandler';
import AnimatedLoadingSegments from './AnimatedLoadingSegments';
import RouteSegmentDisplay from './RouteSegmentDisplay';
import MapControls from './MapControls';
import DraggablePolyline from './DraggablePolyline';
import L from 'leaflet';

interface VeloRouterMapProps {
  startPoint: Position | null;
  endPoint: Position | null;
  waypoints: Position[];
  route: Position[];
  routeSegments: RouteSegment[];
  loading: boolean;
  loadingSegments: LoadingSegment[];
  isEditingMode: boolean;
  onMapClick: (position: Position, event?: any) => void;
  onToggleEdit: () => void;
  onClearRoute: () => void;
  onSwapPoints: () => void;
  onUpdateStartPoint: (position: Position) => void;
  onUpdateEndPoint: (position: Position) => void;
  onAddWaypoint: (position: Position, index: number) => void;
  onUpdateWaypoint: (index: number, position: Position) => void;
  onRemoveWaypoint: (index: number) => void;
  onRemoveStartPoint: () => void;
  onRemoveEndPoint: () => void;
  onMarkerDragStart?: () => void;
  onMarkerDragEnd?: () => void;
}

// Native Leaflet markers component
const NativeMarkers: React.FC<{
  startPoint: Position | null;
  endPoint: Position | null;
  waypoints: Position[];
  onUpdateStartPoint: (position: Position) => void;
  onUpdateEndPoint: (position: Position) => void;
  onUpdateWaypoint: (index: number, position: Position) => void;
  onRemoveStartPoint: () => void;
  onRemoveEndPoint: () => void;
  onRemoveWaypoint: (index: number) => void;
  onMarkerDragStart?: () => void;
  onMarkerDragEnd?: () => void;
}> = ({
  startPoint,
  endPoint,
  waypoints,
  onUpdateStartPoint,
  onUpdateEndPoint,
  onUpdateWaypoint,
  onRemoveStartPoint,
  onRemoveEndPoint,
  onRemoveWaypoint,
  onMarkerDragStart,
  onMarkerDragEnd
}) => {
  const map = useMap();
  const markersRef = useRef<{
    start?: L.Marker;
    end?: L.Marker;
    waypoints: L.Marker[];
  }>({ waypoints: [] });

  useEffect(() => {
    // Clear all existing markers
    const markers = markersRef.current;
    if (markers.start) {
      map.removeLayer(markers.start);
      markers.start = undefined;
    }
    if (markers.end) {
      map.removeLayer(markers.end);
      markers.end = undefined;
    }
    markers.waypoints.forEach(marker => map.removeLayer(marker));
    markers.waypoints = [];

    // Create start marker
    if (startPoint) {
      const startMarker = L.marker([startPoint.lat, startPoint.lng], {
        icon: createStartPointIcon(),
        draggable: true,
        zIndexOffset: 3000
      });

      startMarker.on('click', (e) => {
        // Stop click propagation to prevent map clicks
        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
        }
        L.DomEvent.stopPropagation(e);
      });

      startMarker.on('dragstart', () => {
        onMarkerDragStart?.();
      });

      startMarker.on('dragend', () => {
        const position = startMarker.getLatLng();
        onUpdateStartPoint({ lat: position.lat, lng: position.lng });
        onMarkerDragEnd?.();
      });

      startMarker.on('dblclick', (e) => {
        // Stop all event propagation
        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
          e.originalEvent.preventDefault();
        }
        L.DomEvent.stopPropagation(e);
        onRemoveStartPoint();
      });

      startMarker.addTo(map);
      markers.start = startMarker;
    }

    // Create end marker
    if (endPoint) {
      const endMarker = L.marker([endPoint.lat, endPoint.lng], {
        icon: createEndPointIcon(),
        draggable: true,
        zIndexOffset: 3000
      });

      endMarker.on('click', (e) => {
        // Stop click propagation to prevent map clicks
        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
        }
        L.DomEvent.stopPropagation(e);
      });

      endMarker.on('dragstart', () => {
        onMarkerDragStart?.();
      });

      endMarker.on('dragend', () => {
        const position = endMarker.getLatLng();
        onUpdateEndPoint({ lat: position.lat, lng: position.lng });
        onMarkerDragEnd?.();
      });

      endMarker.on('dblclick', (e) => {
        // Stop all event propagation
        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
          e.originalEvent.preventDefault();
        }
        L.DomEvent.stopPropagation(e);
        onRemoveEndPoint();
      });

      endMarker.addTo(map);
      markers.end = endMarker;
    }

    // Create waypoint markers
    waypoints.forEach((waypoint, index) => {
      const waypointMarker = L.marker([waypoint.lat, waypoint.lng], {
        icon: createNumberedWaypointIcon(index + 1),
        draggable: true,
        zIndexOffset: 3000
      });

      waypointMarker.on('click', (e) => {
        // Stop click propagation to prevent map clicks
        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
        }
        L.DomEvent.stopPropagation(e);
      });

      waypointMarker.on('dragstart', () => {
        onMarkerDragStart?.();
      });

      waypointMarker.on('dragend', () => {
        const position = waypointMarker.getLatLng();
        onUpdateWaypoint(index, { lat: position.lat, lng: position.lng });
        onMarkerDragEnd?.();
      });

      waypointMarker.on('dblclick', (e) => {
        // Stop all event propagation
        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
          e.originalEvent.preventDefault();
        }
        L.DomEvent.stopPropagation(e);
        onRemoveWaypoint(index);
      });

      waypointMarker.addTo(map);
      markers.waypoints.push(waypointMarker);
    });

    // Cleanup function
    return () => {
      if (markers.start) {
        map.removeLayer(markers.start);
        markers.start = undefined;
      }
      if (markers.end) {
        map.removeLayer(markers.end);
        markers.end = undefined;
      }
      markers.waypoints.forEach(marker => map.removeLayer(marker));
      markers.waypoints = [];
    };
  }, [map, startPoint, endPoint, waypoints, onUpdateStartPoint, onUpdateEndPoint, onUpdateWaypoint, onRemoveStartPoint, onRemoveEndPoint, onRemoveWaypoint, onMarkerDragStart, onMarkerDragEnd]);

  return null;
};

const VeloRouterMap: React.FC<VeloRouterMapProps> = ({
  startPoint,
  endPoint,
  waypoints,
  route,
  routeSegments,
  loading,
  loadingSegments,
  isEditingMode,
  onMapClick,
  onToggleEdit,
  onClearRoute,
  onSwapPoints,
  onUpdateStartPoint,
  onUpdateEndPoint,
  onAddWaypoint,
  onUpdateWaypoint,
  onRemoveWaypoint,
  onRemoveStartPoint,
  onRemoveEndPoint,
  onMarkerDragStart,
  onMarkerDragEnd
}) => {
  return (
    <MapContainer 
      center={[48.7758, 9.1829]} 
      zoom={10} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapControls
        isEditingMode={isEditingMode}
        onToggleEdit={onToggleEdit}
        onClearRoute={onClearRoute}
        onSwapPoints={onSwapPoints}
        startPoint={startPoint}
        endPoint={endPoint}
      />
      
      <MapClickHandler onMapClick={onMapClick} />
      
      <NativeMarkers 
        startPoint={startPoint}
        endPoint={endPoint}
        waypoints={waypoints}
        onUpdateStartPoint={onUpdateStartPoint}
        onUpdateEndPoint={onUpdateEndPoint}
        onUpdateWaypoint={onUpdateWaypoint}
        onRemoveStartPoint={onRemoveStartPoint}
        onRemoveEndPoint={onRemoveEndPoint}
        onRemoveWaypoint={onRemoveWaypoint}
        onMarkerDragStart={onMarkerDragStart}
        onMarkerDragEnd={onMarkerDragEnd}
      />
      
      {/* Show all route segments (loaded ones will be visible, loading ones won't) */}
      <RouteSegmentDisplay 
        segments={routeSegments}
        color="var(--color-error)"
        weight={5}
        opacity={0.7}
      />
      
      {/* Show loading animations */}
      {loading && loadingSegments.length > 0 && (
        <AnimatedLoadingSegments segments={loadingSegments} />
      )}
      
      {/* Show draggable polyline for interaction when not loading */}
      {route.length > 0 && !loading && (
        <DraggablePolyline 
          positions={route}
          startPoint={startPoint}
          endPoint={endPoint}
          waypoints={waypoints}
          onAddWaypoint={onAddWaypoint}
          color="transparent"
          weight={15}
          opacity={0.1}
        />
      )}
    </MapContainer>
  );
};

export default VeloRouterMap;