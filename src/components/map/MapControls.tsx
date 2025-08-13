import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { MapControlsProps } from '../../types';
import { EditButtonControl } from './controls/EditButtonControl';
import { ClearButtonControl } from './controls/ClearButtonControl';

const MapControls: React.FC<MapControlsProps> = ({ 
  isEditingMode, 
  onToggleEdit, 
  onClearRoute 
}) => {
  const map = useMap();
  const editControlRef = useRef<EditButtonControl | null>(null);
  const clearControlRef = useRef<ClearButtonControl | null>(null);

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

  return null;
};

export default MapControls;