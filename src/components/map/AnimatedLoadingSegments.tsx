import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { AnimatedLoadingSegmentsProps } from '../../types';

const AnimatedLoadingSegments: React.FC<AnimatedLoadingSegmentsProps> = ({ segments }) => {
  const map = useMap();
  const pathsRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    // Remove existing paths
    pathsRef.current.forEach(path => {
      if (map.hasLayer(path)) {
        map.removeLayer(path);
      }
    });
    pathsRef.current = [];

    // Create new paths for each segment
    segments.forEach((segment, index) => {
      const path = L.polyline(
        [[segment.start.lat, segment.start.lng], [segment.end.lat, segment.end.lng]],
        {
          color: 'var(--color-primary)',
          weight: 3,
          opacity: 0.8,
        }
      ).addTo(map);

      pathsRef.current.push(path);

      // Add animation to SVG line
      setTimeout(() => {
        const pathElement = path.getElement();
        if (pathElement) {
          pathElement.classList.add('animated-dash');
        }
      }, 50 + index * 100); // Stagger animations slightly
    });

    return () => {
      pathsRef.current.forEach(path => {
        if (map.hasLayer(path)) {
          map.removeLayer(path);
        }
      });
      pathsRef.current = [];
    };
  }, [map, segments]);

  return null;
};

export default AnimatedLoadingSegments;