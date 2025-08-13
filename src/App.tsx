import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import './App.css';
import 'leaflet/dist/leaflet.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// CSS für bewegte gestrichelte Linie und Pulse-Animation
const animatedDashStyle = `
  @keyframes dash {
    0% { stroke-dashoffset: 0; }
    100% { stroke-dashoffset: -20; }
  }
  .animated-dash {
    stroke-dasharray: 10 5;
    animation: dash 1s linear infinite;
  }
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
    100% { opacity: 1; transform: scale(1); }
  }
`;

// Füge CSS zum Document hinzu
if (!document.querySelector('#animated-dash-style')) {
  const style = document.createElement('style');
  style.id = 'animated-dash-style';
  style.textContent = animatedDashStyle;
  document.head.appendChild(style);
}

// Edit Button Control
class EditButtonControl extends L.Control {
  private container: HTMLButtonElement | null = null;
  private onToggleEdit: () => void;
  private isEditingMode: boolean;

  constructor(onToggleEdit: () => void, isEditingMode: boolean, options?: L.ControlOptions) {
    super(options);
    this.onToggleEdit = onToggleEdit;
    this.isEditingMode = isEditingMode;
  }

  onAdd() {
    this.container = L.DomUtil.create('button', 'leaflet-edit-control') as HTMLButtonElement;
    this.updateButton();
    
    // Prevent map events when interacting with control
    L.DomEvent.disableClickPropagation(this.container);
    this.container.addEventListener('click', this.onToggleEdit);
    
    return this.container;
  }

  updateButton() {
    if (!this.container) return;
    
    this.container.style.cssText = `
      background-color: ${this.isEditingMode ? '#e74c3c' : '#3498db'};
      color: white;
      border: none;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 5px;
    `;
    
    this.container.innerHTML = `<i class="fas ${this.isEditingMode ? 'fa-stop' : 'fa-edit'}"></i>`;
  }

  updateState(isEditingMode: boolean) {
    this.isEditingMode = isEditingMode;
    this.updateButton();
  }

  onRemove() {
    // Cleanup if needed
  }
}

// Clear Button Control  
class ClearButtonControl extends L.Control {
  private container: HTMLButtonElement | null = null;
  private onClearRoute: () => void;

  constructor(onClearRoute: () => void, options?: L.ControlOptions) {
    super(options);
    this.onClearRoute = onClearRoute;
  }

  onAdd() {
    this.container = L.DomUtil.create('button', 'leaflet-clear-control') as HTMLButtonElement;
    this.container.style.cssText = `
      background-color: #e67e22;
      color: white;
      border: none;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    this.container.innerHTML = '<i class="fas fa-trash"></i>';
    
    // Prevent map events when interacting with control
    L.DomEvent.disableClickPropagation(this.container);
    this.container.addEventListener('click', this.onClearRoute);
    
    return this.container;
  }

  onRemove() {
    // Cleanup if needed
  }
}

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

interface Position {
  lat: number;
  lng: number;
}

interface RouteResponse {
  type: string;
  features: Array<{
    type: string;
    properties?: {
      'track-length'?: number;
      'filtered ascend'?: number;
      'filtered descend'?: number;
      'total-time'?: number;
      'total-energy'?: number;
    };
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

// Component für animierte Loading-Linie
function AnimatedLoadingLine({ startPoint, endPoint }: { startPoint: Position; endPoint: Position }) {
  const map = useMap();
  const pathRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!startPoint || !endPoint) return;

    // Erstelle Polyline
    pathRef.current = L.polyline(
      [[startPoint.lat, startPoint.lng], [endPoint.lat, endPoint.lng]],
      {
        color: '#3498db',
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
}

function ButtonControlsComponent({ 
  isEditingMode, 
  onToggleEdit, 
  onClearRoute 
}: {
  isEditingMode: boolean;
  onToggleEdit: () => void;
  onClearRoute: () => void;
}) {
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
}

function App() {
  const [startPoint, setStartPoint] = useState<Position | null>(null);
  const [endPoint, setEndPoint] = useState<Position | null>(null);
  const [route, setRoute] = useState<Position[]>([]);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routeStats, setRouteStats] = useState<{
    distance: number;
    ascent: number;
    descent: number;
    time: number;
  } | null>(null);

  const handleMapClick = (position: Position) => {
    if (!isEditingMode) return;
    
    if (!startPoint) {
      setStartPoint(position);
    } else if (!endPoint) {
      setEndPoint(position);
      setIsEditingMode(false);
      // Automatisch Route berechnen wenn Endpunkt gesetzt wird
      setTimeout(() => {
        fetchRouteForPoints(startPoint, position);
      }, 100);
    } else {
      setStartPoint(position);
      setEndPoint(null);
      setRoute([]);
      setRouteStats(null);
    }
  };

  const fetchRouteForPoints = async (start: Position, end: Position) => {
    setLoading(true);
    try {
      const url = `http://localhost:17777/brouter?lonlats=${start.lng},${start.lat}|${end.lng},${end.lat}&profile=trekking&format=geojson`;
      const response = await fetch(url);
      const data: RouteResponse = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const coordinates = feature.geometry.coordinates;
        const routePoints: Position[] = coordinates.map(coord => ({
          lat: coord[1],
          lng: coord[0]
        }));
        setRoute(routePoints);

        // Extract route statistics
        if (feature.properties) {
          setRouteStats({
            distance: (feature.properties['track-length'] || 0) / 1000, // Convert to km
            ascent: feature.properties['filtered ascend'] || 0,
            descent: feature.properties['filtered descend'] || 0,
            time: (feature.properties['total-time'] || 0) / 3600 // Convert to hours
          });
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Route:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEditMode = () => {
    setIsEditingMode(!isEditingMode);
    if (!isEditingMode) {
      setStartPoint(null);
      setEndPoint(null);
      setRoute([]);
      setRouteStats(null);
    }
  };


  const clearRoute = () => {
    setStartPoint(null);
    setEndPoint(null);
    setRoute([]);
    setRouteStats(null);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: '#f8fafc',
        padding: '16px 32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        zIndex: 1000,
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          <i className="fas fa-bicycle" style={{ 
            fontSize: '24px', 
            color: '#3b82f6',
            marginRight: '4px'
          }}></i>
          <span style={{ 
            letterSpacing: '-0.025em',
            fontWeight: '700'
          }}>VeloRouter</span>
          <div style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ 
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              color: '#3b82f6',
              letterSpacing: '0.025em'
            }}>
              Beta
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                animation: 'pulse 2s infinite'
              }}></div>
              <span>v0.1.0</span>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Map Container */}
      <MapContainer 
        center={[48.7758, 9.1829]} 
        zoom={10} 
        style={{ height: 'calc(100vh - 105px)', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ButtonControlsComponent
          isEditingMode={isEditingMode}
          onToggleEdit={toggleEditMode}
          onClearRoute={clearRoute}
        />
        <MapClickHandler onMapClick={handleMapClick} />
        {startPoint && (
          <Marker 
            position={[startPoint.lat, startPoint.lng]}
            icon={new L.Icon({
              iconUrl: '/images/marker-icon.png',
              shadowUrl: '/images/marker-shadow.png',
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
              iconUrl: '/images/marker-icon.png',
              shadowUrl: '/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          />
        )}
        {loading && startPoint && endPoint && (
          <AnimatedLoadingLine startPoint={startPoint} endPoint={endPoint} />
        )}
        {route.length > 0 && !loading && (
          <Polyline 
            positions={route.map(point => [point.lat, point.lng])}
            color="red"
            weight={5}
            opacity={0.7}
          />
        )}
      </MapContainer>
      
      {/* Footer mit Streckendaten */}
      <div style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: 'white',
        padding: '8px 20px',
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000,
        height: '45px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: routeStats ? 'space-around' : 'center',
        fontSize: '12px'
      }}>
        {routeStats ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
              <i className="fas fa-route" style={{ fontSize: '12px', color: '#3498db' }}></i>
              <span style={{ fontWeight: '600', fontSize: '11px' }}>{routeStats.distance.toFixed(1)} km</span>
              <span style={{ fontSize: '9px', opacity: 0.8 }}>Distanz</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
              <i className="fas fa-arrow-up" style={{ fontSize: '12px', color: '#2ecc71' }}></i>
              <span style={{ fontWeight: '600', fontSize: '11px' }}>{Math.round(routeStats.ascent)} m</span>
              <span style={{ fontSize: '9px', opacity: 0.8 }}>Anstieg</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
              <i className="fas fa-arrow-down" style={{ fontSize: '12px', color: '#e74c3c' }}></i>
              <span style={{ fontWeight: '600', fontSize: '11px' }}>{Math.round(routeStats.descent)} m</span>
              <span style={{ fontSize: '9px', opacity: 0.8 }}>Abstieg</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
              <i className="fas fa-clock" style={{ fontSize: '12px', color: '#f39c12' }}></i>
              <span style={{ fontWeight: '600', fontSize: '11px' }}>{Math.floor(routeStats.time)}:{String(Math.round((routeStats.time % 1) * 60)).padStart(2, '0')} h</span>
              <span style={{ fontSize: '9px', opacity: 0.8 }}>Zeit</span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
            <i className="fas fa-info-circle" style={{ fontSize: '16px', color: '#3498db' }}></i>
            <span>Klicken Sie auf "Bearbeiten" und wählen Sie Start- und Endpunkt für eine Route</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
