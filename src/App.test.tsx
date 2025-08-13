import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders brouter map application', () => {
  render(<App />);
  const startButton = screen.getByText(/startpunkt wählen/i);
  expect(startButton).toBeInTheDocument();
});

test('renders route calculation button', () => {
  render(<App />);
  const routeButton = screen.getByText(/route berechnen/i);
  expect(routeButton).toBeInTheDocument();
  expect(routeButton).toBeDisabled();
});

test('renders map container', () => {
  render(<App />);
  const mapContainer = screen.getByTestId('map-container');
  expect(mapContainer).toBeInTheDocument();
});
