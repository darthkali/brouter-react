import React from 'react';

export interface RouteProfile {
    id: string;
    name: string;
    description: string;
}

// Available BRouter profiles
export const ROUTE_PROFILES: RouteProfile[] = [
    {
        id: 'gravel',
        name: 'Gravel',
        description: 'Gravel bike routing'
    },
    {
        id: 'mtb',
        name: 'MTB',
        description: 'Mountain Bike - Off-road cycling'
    },
    {
        id: 'trekking',
        name: 'Trekking',
        description: 'Trekking bicycle routing'
    },
    {
        id: 'fastbike',
        name: 'Fast Bike',
        description: 'Fast bicycle routing'
    },
    {
        id: 'fastbike-verylowtraffic',
        name: 'Fast Bike (Low Traffic)',
        description: 'Fast bicycle with very low traffic preference'
    },

    {
        id: 'car-vario',
        name: 'Car',
        description: 'Variable car routing'
    },
    {
        id: 'moped',
        name: 'Moped',
        description: 'Moped/scooter routing'
    },
    {
        id: 'hiking-mountain',
        name: 'Hiking (Mountain)',
        description: 'Mountain hiking routes'
    },
    {
        id: 'vm-forum-liegerad-schnell',
        name: 'Recumbent Bike',
        description: 'Fast recumbent bicycle routing'
    },
    {
        id: 'vm-forum-velomobil-schnell',
        name: 'Velomobile',
        description: 'Fast velomobile routing'
    },
    {
        id: 'shortest',
        name: 'Shortest',
        description: 'Shortest distance routing'
    }
];

interface ProfileSelectorProps {
    selectedProfile: string;
    onProfileChange: (profile: string) => void;
    disabled?: boolean;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({
                                                             selectedProfile,
                                                             onProfileChange,
                                                             disabled = false
                                                         }) => {
    return (
        <div className="flex items-center space-x-2">
            <label htmlFor="profile-select" className="text-sm font-medium  whitespace-nowrap">
                Profile:
            </label>
            <select
                id="profile-select"
                value={selectedProfile}
                onChange={(e) => onProfileChange(e.target.value)}
                disabled={disabled}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed min-w-0"
                title={ROUTE_PROFILES.find(p => p.id === selectedProfile)?.description || ''}
            >
                {ROUTE_PROFILES.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                        {profile.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ProfileSelector;