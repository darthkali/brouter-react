import React, { memo } from 'react';
import { Polyline } from 'react-leaflet';
import { RouteSegment, Position } from '../../types';

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
  // Check if any segment is loading
  const hasLoadingSegments = segments.some(segment => segment.isLoading);
  
  // If any segment is loading, don't render the route
  if (hasLoadingSegments || segments.length === 0) {
    return null;
  }

  // Combine all segments into one continuous route
  const fullRoute: Position[] = segments.reduce<Position[]>((acc, segment, index) => {
    if (segment.coordinates.length < 2) return acc;
    
    if (index === 0) {
      // First segment: include all coordinates
      return [...segment.coordinates];
    } else {
      // Subsequent segments: skip first coordinate to avoid duplication
      return [...acc, ...segment.coordinates.slice(1)];
    }
  }, []);

  // Only render if we have a complete route
  if (fullRoute.length < 2) {
    return null;
  }

  return (
    <Polyline
      positions={fullRoute.map(point => [point.lat, point.lng])}
      color={color}
      weight={weight}
      opacity={opacity}
      interactive={false} // Disable interaction to avoid conflicts with DraggablePolyline
    />
  );
};

// Simplified memoization - only check if segments array changed
export default memo(RouteSegmentDisplay, (prevProps, nextProps) => {
  return (
    prevProps.segments === nextProps.segments &&
    prevProps.color === nextProps.color &&
    prevProps.weight === nextProps.weight &&
    prevProps.opacity === nextProps.opacity
  );
});