import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import './App.css';
import 'leaflet/dist/leaflet.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import packageJson from '../package.json';

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
      background-color: ${this.isEditingMode ? 'var(--color-error)' : 'var(--color-primary)'};
      color: var(--color-text-primary);
      border: none;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: var(--shadow-md);
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 5px;
      transition: all 0.2s ease;
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
      background-color: var(--color-warning);
      color: var(--color-text-primary);
      border: none;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: var(--shadow-md);
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
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
    <div className="h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-gradient-navbar text-primary px-8 py-4 shadow-lg border-b border-white/10 z-[1000] relative font-sans">
        <div className="flex items-center gap-5 text-xl font-semibold">
          <i className="fas fa-bicycle text-2xl text-brand mr-1"></i>
          <span className="tracking-tight font-bold">VeloRouter</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="bg-brand/10 border border-brand/20 px-3 py-1 rounded-full text-xs font-medium text-brand tracking-wider">
              Beta
            </span>
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
              <span>v{packageJson.version}</span>
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
            color="var(--color-error)"
            weight={5}
            opacity={0.7}
          />
        )}
      </MapContainer>
      
      {/* Footer mit Streckendaten */}
      <div className={`bg-gradient-footer text-primary px-5 py-2 shadow-[0_-2px_4px_rgba(0,0,0,0.1)] z-[1000] h-[45px] flex items-center text-xs ${routeStats ? 'justify-around' : 'justify-center'}`}>
        {routeStats ? (
          <>
            <div className="flex flex-col items-center gap-px">
              <i className="fas fa-route text-xs text-info"></i>
              <span className="font-semibold text-[11px]">{routeStats.distance.toFixed(1)} km</span>
              <span className="text-[9px] opacity-80">Distanz</span>
            </div>
            
            <div className="flex flex-col items-center gap-px">
              <i className="fas fa-arrow-up text-xs text-success"></i>
              <span className="font-semibold text-[11px]">{Math.round(routeStats.ascent)} m</span>
              <span className="text-[9px] opacity-80">Anstieg</span>
            </div>
            
            <div className="flex flex-col items-center gap-px">
              <i className="fas fa-arrow-down text-xs text-error"></i>
              <span className="font-semibold text-[11px]">{Math.round(routeStats.descent)} m</span>
              <span className="text-[9px] opacity-80">Abstieg</span>
            </div>
            
            <div className="flex flex-col items-center gap-px">
              <i className="fas fa-clock text-xs text-warning"></i>
              <span className="font-semibold text-[11px]">{Math.floor(routeStats.time)}:{String(Math.round((routeStats.time % 1) * 60)).padStart(2, '0')} h</span>
              <span className="text-[9px] opacity-80">Zeit</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 opacity-70">
            <i className="fas fa-info-circle text-base text-info"></i>
            <span>Klicken Sie auf "Bearbeiten" und wählen Sie Start- und Endpunkt für eine Route</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
