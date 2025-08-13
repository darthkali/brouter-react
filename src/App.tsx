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
    route,
    isEditingMode,
    loading,
    routeStats,
    handleMapClick,
    toggleEditMode,
    clearRoute,
    swapPoints
  } = useRouting();

  useEffect(() => {
    setupLeafletIcons();
    injectAnimationStyles();
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex-1 min-h-0">
        <VeloRouterMap
          startPoint={startPoint}
          endPoint={endPoint}
          route={route}
          loading={loading}
          isEditingMode={isEditingMode}
          onMapClick={handleMapClick}
          onToggleEdit={toggleEditMode}
          onClearRoute={clearRoute}
          onSwapPoints={swapPoints}
        />
      </div>
      
      <Footer routeStats={routeStats} />
    </div>
  );
}

export default App;
