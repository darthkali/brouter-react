import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { AnimatedLoadingLineProps } from '../../types';

const AnimatedLoadingLine: React.FC<AnimatedLoadingLineProps> = ({ startPoint, endPoint }) => {
  const map = useMap();
  const pathRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!startPoint || !endPoint) return;

    // Erstelle Polyline
    pathRef.current = L.polyline(
      [[startPoint.lat, startPoint.lng], [endPoint.lat, endPoint.lng]],
      {
        color: 'var(--color-primary)',
        weight: 3,
        opacity: 0.8,
      }
    ).addTo(map);

    // Füge Animation zur SVG-Linie hinzu
    setTimeout(() => {
      const pathElement = pathRef.current?.getElement();
      if (pathElement) {
        pathElement.classList.add('animated-dash');
      }
    }, 50);

    return () => {
      if (pathRef.current) {
        map.removeLayer(pathRef.current);
      }
    };
  }, [map, startPoint, endPoint]);

  return null;
};

export default AnimatedLoadingLine;