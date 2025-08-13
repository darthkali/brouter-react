import React from 'react';
import { FooterProps } from '../types';

const Footer: React.FC<FooterProps> = ({ routeStats }) => {
  const formatTime = (timeInHours: number) => {
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours % 1) * 60);
    return `${hours}:${String(minutes).padStart(2, '0')} h`;
  };

  return (
    <footer className={`bg-gradient-navbar text-primary px-8 py-4 shadow-lg border-t border-white/10 z-[1000] relative font-sans flex items-center text-xs ${routeStats ? 'justify-around' : 'justify-center'}`}>
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
            <span className="font-semibold text-[11px]">{formatTime(routeStats.time)}</span>
            <span className="text-[9px] opacity-80">Zeit</span>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 opacity-70">
          <i className="fas fa-info-circle text-base text-info"></i>
          <span>Klicken Sie auf "Bearbeiten" und wählen Sie Start- und Endpunkt für eine Route</span>
        </div>
      )}
    </footer>
  );
};

export default Footer;