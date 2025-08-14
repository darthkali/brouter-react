import React, { useEffect } from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import VeloRouterMap from './components/map/VeloRouterMap';

// Hooks
import { useRouting } from './hooks/useRouting';

// Utils
import { setupLeafletIcons } from './utils/leafletSetup';
import { injectAnimationStyles } from './utils/cssInjection';

function App() {
  const {
    startPoint,
    endPoint,
    waypoints,
    route,
    routeSegments,
    isEditingMode,
    loading,
    loadingSegments,
    routeStats,
    handleMapClick,
    toggleEditMode,
    clearRoute,
    swapPoints,
    updateStartPoint,
    updateEndPoint,
    addWaypoint,
    updateWaypoint,
    removeWaypoint,
    removeStartPoint,
    removeEndPoint,
    onMarkerDragStart,
    onMarkerDragEnd
  } = useRouting();

  useEffect(() => {
    setupLeafletIcons();
    injectAnimationStyles();
  }, []);

  // Add ESC key handler to exit edit mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEditingMode) {
        toggleEditMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditingMode, toggleEditMode]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex-1 min-h-0">
        <VeloRouterMap
          startPoint={startPoint}
          endPoint={endPoint}
          waypoints={waypoints}
          route={route}
          routeSegments={routeSegments}
          loading={loading}
          loadingSegments={loadingSegments}
          isEditingMode={isEditingMode}
          onMapClick={handleMapClick}
          onToggleEdit={toggleEditMode}
          onClearRoute={clearRoute}
          onSwapPoints={swapPoints}
          onUpdateStartPoint={updateStartPoint}
          onUpdateEndPoint={updateEndPoint}
          onAddWaypoint={addWaypoint}
          onUpdateWaypoint={updateWaypoint}
          onRemoveWaypoint={removeWaypoint}
          onRemoveStartPoint={removeStartPoint}
          onRemoveEndPoint={removeEndPoint}
          onMarkerDragStart={onMarkerDragStart}
          onMarkerDragEnd={onMarkerDragEnd}
        />
      </div>
      
      <Footer routeStats={routeStats} />
    </div>
  );
}

export default App;
