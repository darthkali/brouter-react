# VeloRouter React

A modern React-based frontend for BRouter, providing an intuitive interface for bicycle route planning and navigation.

## 🚴‍♂️ What is VeloRouter React?

VeloRouter React is a web application that allows cyclists to plan optimal routes using various cycling profiles. It provides an interactive map interface where users can:

- **Plan Routes**: Click to set start and end points, add waypoints along the way
- **Interactive Editing**: Drag and drop points to modify routes in real-time
- **Multiple Profiles**: Choose from various routing profiles (MTB, road cycling, gravel, trekking, etc.)
- **Route Statistics**: View distance, elevation gain/loss, and estimated time
- **Waypoint Management**: Add intermediate points by dragging on the route line
- **Real-time Recalculation**: Routes update automatically when points are moved

## 🎯 Inspiration

This project was inspired by:
- [BRouter Web](https://github.com/nrenner/brouter-web) - The original web interface for BRouter
- [BikeRouter.de](https://bikerouter.de/) - A popular BRouter-based routing service

VeloRouter React aims to provide a more modern, React-based alternative with improved UX and performance.

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Leaflet** with React-Leaflet for interactive maps
- **Tailwind CSS** for responsive styling
- **Vite** for fast development and building

### Key Components

#### Map Layer (`src/components/map/`)
- **VeloRouterMap**: Main map container component
- **RouteSegmentDisplay**: Renders route segments with loading states
- **DraggablePolyline**: Handles interactive route editing
- **NativeMarkers**: Custom Leaflet markers with drag & drop
- **MapClickHandler**: Manages click events and drag detection
- **AnimatedLoadingSegments**: Visual feedback during route calculation

#### Route Management (`src/hooks/useRouting.ts`)
- Centralized state management for routes, waypoints, and profiles
- Optimized segment-based route calculation
- Real-time route updates with loading states
- Profile switching with automatic recalculation

#### Profile System (`src/components/ProfileSelector.tsx`)
- Support for all BRouter profiles (MTB, Trekking, Car, etc.)
- Dynamic profile switching
- Integrated into navigation bar

### Backend Integration

VeloRouter React uses [BRouter](https://github.com/abrensch/brouter) as its routing engine:

- **BRouter Server**: Java-based routing server with offline map data
- **HTTP API**: RESTful interface for route requests
- **GeoJSON Format**: Standardized geographic data exchange
- **Multiple Profiles**: Support for different vehicle/activity types

### Route Calculation Architecture

1. **Segment-Based Approach**: Routes are divided into segments between waypoints
2. **Parallel Loading**: Multiple segments can be calculated simultaneously  
3. **Optimized Updates**: Only affected segments recalculate when points move
4. **Loading States**: Visual feedback with animated loading segments
5. **Error Handling**: Graceful fallback for failed route calculations

## 🚀 Getting Started

### Prerequisites

1. **BRouter Server**: Set up a BRouter server instance
   ```bash
   # Download and run BRouter server
   # See: https://github.com/abrensch/brouter
   ```

2. **Node.js**: Version 16+ required

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd brouter-react

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration

The application expects BRouter server running on `http://localhost:17777`. Update the API endpoint in `src/services/routeService.ts` if needed.

## 🔧 Available Routing Profiles

VeloRouter React supports all standard BRouter profiles:

- **MTB**: Mountain bike routing with trail preferences
- **Trekking**: Touring bicycle with mixed terrain
- **Fast Bike**: Road cycling optimized for speed
- **Fast Bike (Low Traffic)**: Road cycling avoiding busy roads
- **Gravel**: Gravel bike routing for unpaved roads
- **Car**: Automotive routing
- **Moped**: Motorized two-wheeler routing
- **Hiking (Mountain)**: Pedestrian mountain routes
- **Recumbent Bike**: Optimized for recumbent bicycles
- **Velomobile**: Aerodynamic vehicle routing
- **Shortest**: Minimal distance routing

## 🎮 Usage

### Basic Route Planning
1. Click the "Edit" button to enter planning mode
2. Click on the map to set start and end points
3. Continue clicking to add more waypoints
4. Routes calculate automatically between points

### Interactive Editing
- **Drag Points**: Click and drag any marker to relocate
- **Add Waypoints**: Drag on the route line to insert new points
- **Remove Points**: Double-click any marker to delete
- **Profile Switching**: Use dropdown in navigation to change routing profile

### Advanced Features
- **Segment Optimization**: Only affected route parts recalculate when editing
- **Loading Animation**: Visual feedback shows calculation progress
- **Route Statistics**: Distance, elevation, and time estimates
- **Keyboard Shortcuts**: ESC to exit edit mode

## 🏃‍♂️ Development

### Available Scripts

In the project directory, you can run:

#### `npm run dev`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

#### `npm run build`

Builds the app for production to the `build` folder.

#### `npm run preview`

Preview the production build locally.

### Project Structure
```
src/
├── components/         # React components
│   ├── map/           # Map-related components
│   ├── ProfileSelector.tsx
│   ├── Navbar.tsx
│   └── Footer.tsx
├── hooks/             # Custom React hooks
├── services/          # API integration
├── types/             # TypeScript definitions
└── utils/             # Helper functions
```

### Key Design Decisions

1. **Native Leaflet Integration**: Direct Leaflet API usage for complex interactions
2. **Segment-Based Routes**: Efficient partial updates instead of full recalculation
3. **TypeScript Throughout**: Full type safety across the application
4. **Component Composition**: Modular, reusable components
5. **Performance Optimization**: Memoization and selective re-rendering

## 🤝 Contributing

Contributions are welcome! This project aims to provide a modern, user-friendly interface for BRouter's powerful routing capabilities.

## 📝 License

This project builds upon the excellent work of:
- [BRouter](https://github.com/abrensch/brouter) - The core routing engine
- [BRouter Web](https://github.com/nrenner/brouter-web) - Original web interface
- [BikeRouter.de](https://bikerouter.de/) - Inspiration for UX improvements

## 🙏 Acknowledgments

Special thanks to the BRouter community and the original developers who created the foundation for bicycle routing technology.
