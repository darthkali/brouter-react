import { useMapEvents } from 'react-leaflet';
import { MapClickHandlerProps } from '../../types';

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};

export default MapClickHandler;