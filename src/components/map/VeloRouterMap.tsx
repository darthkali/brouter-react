import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { Position, LoadingSegment, RouteSegment } from '../../types';
import { createStartPointIcon, createEndPointIcon, createNumberedWaypointIcon } from '../../utils/leafletSetup';
import MapClickHandler from './MapClickHandler';
import AnimatedLoadingSegments from './AnimatedLoadingSegments';
import RouteSegmentDisplay from './RouteSegmentDisplay';
import MapControls from './MapControls';
import DraggablePolyline from './DraggablePolyline';

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
}

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
  onRemoveWaypoint
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
      
      {startPoint && (
        <Marker 
          position={[startPoint.lat, startPoint.lng]}
          icon={createStartPointIcon()}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              onUpdateStartPoint({ lat: position.lat, lng: position.lng });
            }
          }}
        />
      )}
      
      {waypoints.map((waypoint, index) => (
        <Marker 
          key={`waypoint-${index}`}
          position={[waypoint.lat, waypoint.lng]}
          icon={createNumberedWaypointIcon(index + 1)}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              onUpdateWaypoint(index, { lat: position.lat, lng: position.lng });
            },
            dblclick: () => {
              onRemoveWaypoint(index);
            }
          }}
        />
      ))}
      
      {endPoint && (
        <Marker 
          position={[endPoint.lat, endPoint.lng]}
          icon={createEndPointIcon()}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              onUpdateEndPoint({ lat: position.lat, lng: position.lng });
            }
          }}
        />
      )}
      
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