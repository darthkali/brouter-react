import React from 'react';
import packageJson from '../../package.json';
import ProfileSelector from './ProfileSelector';

interface NavbarProps {
  selectedProfile: string;
  onProfileChange: (profile: string) => void;
  loading: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ selectedProfile, onProfileChange, loading }) => {
  return (
    <nav className="bg-gradient-navbar text-primary px-8 py-4 shadow-lg border-b border-white/10 z-[1000] relative font-sans">
      <div className="flex items-center gap-5 text-xl font-semibold">
        <i className="fas fa-bicycle text-2xl text-brand mr-1"></i>
        <span className="tracking-tight font-bold">VeloRouter</span>
        
        {/* Profile Selector in center */}
        <div className="ml-8 flex-shrink-0">
          <ProfileSelector
            selectedProfile={selectedProfile}
            onProfileChange={onProfileChange}
            disabled={loading}
          />
        </div>
        
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
  );
};

export default Navbar;