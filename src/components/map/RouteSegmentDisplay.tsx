import React from 'react';
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

export default RouteSegmentDisplay;