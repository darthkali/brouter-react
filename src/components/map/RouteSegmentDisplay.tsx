import React, { memo } from 'react';
import { Polyline } from 'react-leaflet';
import { RouteSegment } from '../../types';

interface RouteSegmentDisplayProps {
  segments: RouteSegment[];
  color?: string;
  weight?: number;
  opacity?: number;
}

const RouteSegmentDisplay: React.FC<RouteSegmentDisplayProps> = ({
  segments,
  color = "var(--color-error)",
  weight = 5,
  opacity = 0.7
}) => {
  return (
    <>
      {segments.map((segment) => {
        // Only render segments that are not loading and have coordinates
        if (segment.isLoading || segment.coordinates.length < 2) {
          return null;
        }

        return (
          <Polyline
            key={segment.id}
            positions={segment.coordinates.map(point => [point.lat, point.lng])}
            color={color}
            weight={weight}
            opacity={opacity}
          />
        );
      })}
    </>
  );
};

// Memoize component to prevent unnecessary re-renders
export default memo(RouteSegmentDisplay, (prevProps, nextProps) => {
  // Custom comparison to avoid re-rendering if segments haven't changed
  if (prevProps.segments.length !== nextProps.segments.length) {
    return false;
  }
  
  for (let i = 0; i < prevProps.segments.length; i++) {
    const prev = prevProps.segments[i];
    const next = nextProps.segments[i];
    
    if (prev.id !== next.id || 
        prev.isLoading !== next.isLoading || 
        prev.coordinates.length !== next.coordinates.length) {
      return false;
    }
  }
  
  return (
    prevProps.color === nextProps.color &&
    prevProps.weight === nextProps.weight &&
    prevProps.opacity === nextProps.opacity
  );
});