import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { Position } from '../../types';
import { createMarkerIcon } from '../../utils/leafletSetup';
import MapClickHandler from './MapClickHandler';
import AnimatedLoadingLine from './AnimatedLoadingLine';
import MapControls from './MapControls';

interface VeloRouterMapProps {
  startPoint: Position | null;
  endPoint: Position | null;
  route: Position[];
  loading: boolean;
  isEditingMode: boolean;
  onMapClick: (position: Position) => void;
  onToggleEdit: () => void;
  onClearRoute: () => void;
}

const VeloRouterMap: React.FC<VeloRouterMapProps> = ({
  startPoint,
  endPoint,
  route,
  loading,
  isEditingMode,
  onMapClick,
  onToggleEdit,
  onClearRoute
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
      />
      
      <MapClickHandler onMapClick={onMapClick} />
      
      {startPoint && (
        <Marker 
          position={[startPoint.lat, startPoint.lng]}
          icon={createMarkerIcon()}
        />
      )}
      
      {endPoint && (
        <Marker 
          position={[endPoint.lat, endPoint.lng]}
          icon={createMarkerIcon()}
        />
      )}
      
      {loading && startPoint && endPoint && (
        <AnimatedLoadingLine startPoint={startPoint} endPoint={endPoint} />
      )}
      
      {route.length > 0 && !loading && (
        <Polyline 
          positions={route.map(point => [point.lat, point.lng])}
          color="var(--color-error)"
          weight={5}
          opacity={0.7}
        />
      )}
    </MapContainer>
  );
};

export default VeloRouterMap;