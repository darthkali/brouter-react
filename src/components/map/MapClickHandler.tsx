import { useMapEvents } from 'react-leaflet';
import { useRef } from 'react';
import { MapClickHandlerProps } from '../../types';

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  const dragEndTimeRef = useRef<number>(0);
  const mouseDownTimeRef = useRef<number>(0);
  const mouseDownPositionRef = useRef<{ x: number, y: number } | null>(null);

  useMapEvents({
    mousedown(e) {
      mouseDownTimeRef.current = Date.now();
      mouseDownPositionRef.current = { x: e.originalEvent.clientX, y: e.originalEvent.clientY };
    },
    click(e) {
      const now = Date.now();
      const timeSinceDragEnd = now - dragEndTimeRef.current;
      const timeSinceMouseDown = now - mouseDownTimeRef.current;
      
      // Check if this click is right after a drag operation
      if (timeSinceDragEnd < 100) {
        // This click is likely from a drag end, ignore it
        return;
      }
      
      // Check if mouse moved significantly during the click (indicates drag)
      if (mouseDownPositionRef.current) {
        const deltaX = Math.abs(e.originalEvent.clientX - mouseDownPositionRef.current.x);
        const deltaY = Math.abs(e.originalEvent.clientY - mouseDownPositionRef.current.y);
        const mouseMoved = deltaX > 5 || deltaY > 5; // 5px tolerance
        
        if (mouseMoved || timeSinceMouseDown > 200) {
          // Mouse moved significantly or took too long - likely a drag
          return;
        }
      }
      
      // This is a genuine click, process it
      onMapClick(e.latlng, e);
    },
    dragend() {
      dragEndTimeRef.current = Date.now();
    },
  });
  return null;
};

export default MapClickHandler;