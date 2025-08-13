const React = require('react');

const MapContainer = ({ children, ...props }) => React.createElement('div', { 'data-testid': 'map-container', ...props }, children);
const TileLayer = (props) => React.createElement('div', { 'data-testid': 'tile-layer', ...props });
const Marker = (props) => React.createElement('div', { 'data-testid': 'marker', ...props });
const Polyline = (props) => React.createElement('div', { 'data-testid': 'polyline', ...props });

const useMapEvents = jest.fn(() => null);

module.exports = {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
};