import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import './App.css';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface Position {
  lat: number;
  lng: number;
}

interface RouteResponse {
  type: string;
  features: Array<{
    type: string;
    geometry: {
      type: string;
      coordinates: number[][];
    };
  }>;
}

function MapClickHandler({ onMapClick }: { onMapClick: (position: Position) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function App() {
  const [startPoint, setStartPoint] = useState<Position | null>(null);
  const [endPoint, setEndPoint] = useState<Position | null>(null);
  const [route, setRoute] = useState<Position[]>([]);
  const [isSelectingStart, setIsSelectingStart] = useState(false);
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMapClick = (position: Position) => {
    if (isSelectingStart) {
      setStartPoint(position);
      setIsSelectingStart(false);
    } else if (isSelectingEnd) {
      setEndPoint(position);
      setIsSelectingEnd(false);
    }
  };

  const fetchRoute = async () => {
    if (!startPoint || !endPoint) return;

    setLoading(true);
    try {
      const url = `http://localhost:17777/brouter?lonlats=${startPoint.lng},${startPoint.lat}|${endPoint.lng},${endPoint.lat}&profile=trekking&format=geojson`;
      const response = await fetch(url);
      const data: RouteResponse = await response.json();

      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry.coordinates;
        const routePoints: Position[] = coordinates.map(coord => ({
          lat: coord[1],
          lng: coord[0]
        }));
        setRoute(routePoints);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Route:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearRoute = () => {
    setStartPoint(null);
    setEndPoint(null);
    setRoute([]);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', backgroundColor: '#f0f0f0' }}>
        <button 
          onClick={() => setIsSelectingStart(true)}
          style={{ 
            marginRight: '10px', 
            backgroundColor: isSelectingStart ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isSelectingStart ? 'Klicken Sie auf die Karte für Startpunkt' : 'Startpunkt wählen'}
        </button>
        <button 
          onClick={() => setIsSelectingEnd(true)}
          style={{ 
            marginRight: '10px',
            backgroundColor: isSelectingEnd ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isSelectingEnd ? 'Klicken Sie auf die Karte für Endpunkt' : 'Endpunkt wählen'}
        </button>
        <button 
          onClick={fetchRoute}
          disabled={!startPoint || !endPoint || loading}
          style={{ 
            marginRight: '10px',
            backgroundColor: (!startPoint || !endPoint || loading) ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: (!startPoint || !endPoint || loading) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Lade Route...' : 'Route berechnen'}
        </button>
        <button 
          onClick={clearRoute}
          style={{ 
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Zurücksetzen
        </button>
      </div>
      <MapContainer 
        center={[48.7758, 9.1829]} 
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={handleMapClick} />
        {startPoint && (
          <Marker 
            position={[startPoint.lat, startPoint.lng]}
            icon={new L.Icon({
              iconUrl: require('leaflet/dist/images/marker-icon.png'),
              shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          />
        )}
        {endPoint && (
          <Marker 
            position={[endPoint.lat, endPoint.lng]}
            icon={new L.Icon({
              iconUrl: require('leaflet/dist/images/marker-icon.png'),
              shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          />
        )}
        {route.length > 0 && (
          <Polyline 
            positions={route.map(point => [point.lat, point.lng])}
            color="red"
            weight={5}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default App;
