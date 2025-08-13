import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { MapControlsProps } from '../../types';
import { EditButtonControl } from './controls/EditButtonControl';
import { ClearButtonControl } from './controls/ClearButtonControl';
import { SwapButtonControl } from './controls/SwapButtonControl';

const MapControls: React.FC<MapControlsProps> = ({ 
  isEditingMode, 
  onToggleEdit, 
  onClearRoute,
  onSwapPoints,
  startPoint,
  endPoint
}) => {
  const map = useMap();
  const editControlRef = useRef<EditButtonControl | null>(null);
  const clearControlRef = useRef<ClearButtonControl | null>(null);
  const swapControlRef = useRef<SwapButtonControl | null>(null);

  useEffect(() => {
    if (!editControlRef.current) {
      editControlRef.current = new EditButtonControl(onToggleEdit, isEditingMode, { position: 'topleft' });
      editControlRef.current.addTo(map);
    } else {
      editControlRef.current.updateState(isEditingMode);
    }

    return () => {
      if (editControlRef.current) {
        editControlRef.current.remove();
        editControlRef.current = null;
      }
    };
  }, [map, isEditingMode, onToggleEdit]);

  useEffect(() => {
    if (!clearControlRef.current) {
      clearControlRef.current = new ClearButtonControl(onClearRoute, { position: 'topleft' });
      clearControlRef.current.addTo(map);
    }

    return () => {
      if (clearControlRef.current) {
        clearControlRef.current.remove();
        clearControlRef.current = null;
      }
    };
  }, [map, onClearRoute]);

  useEffect(() => {
    const canSwap = startPoint && endPoint;
    
    if (canSwap && !swapControlRef.current) {
      swapControlRef.current = new SwapButtonControl(onSwapPoints, { position: 'topleft' });
      swapControlRef.current.addTo(map);
    } else if (!canSwap && swapControlRef.current) {
      swapControlRef.current.remove();
      swapControlRef.current = null;
    }

    return () => {
      if (swapControlRef.current) {
        swapControlRef.current.remove();
        swapControlRef.current = null;
      }
    };
  }, [map, startPoint, endPoint, onSwapPoints]);

  return null;
};

export default MapControls;