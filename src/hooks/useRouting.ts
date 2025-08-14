import { useState, useCallback } from 'react';
import { Position, RouteStats } from '../types';
import { fetchRoute } from '../services/routeService';

export const useRouting = () => {
  const [startPoint, setStartPoint] = useState<Position | null>(null);
  const [endPoint, setEndPoint] = useState<Position | null>(null);
  const [route, setRoute] = useState<Position[]>([]);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);

  const fetchRouteForPoints = useCallback(async (start: Position, end: Position) => {
    setLoading(true);
    try {
      const { route: newRoute, stats } = await fetchRoute(start, end);
      setRoute(newRoute);
      setRouteStats(stats);
    } catch (error) {
      console.error('Fehler beim Laden der Route:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMapClick = useCallback((position: Position) => {
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
  }, [isEditingMode, startPoint, endPoint, fetchRouteForPoints]);

  const toggleEditMode = useCallback(() => {
    setIsEditingMode(!isEditingMode);
    if (!isEditingMode) {
      setStartPoint(null);
      setEndPoint(null);
      setRoute([]);
      setRouteStats(null);
    }
  }, [isEditingMode]);

  const clearRoute = useCallback(() => {
    setStartPoint(null);
    setEndPoint(null);
    setRoute([]);
    setRouteStats(null);
  }, []);

  const swapPoints = useCallback(() => {
    if (startPoint && endPoint) {
      setStartPoint(endPoint);
      setEndPoint(startPoint);
      // Route neu berechnen nach dem Tauschen
      fetchRouteForPoints(endPoint, startPoint);
    }
  }, [startPoint, endPoint, fetchRouteForPoints]);

  const updateStartPoint = useCallback((position: Position) => {
    setStartPoint(position);
    // Route neu berechnen wenn beide Punkte gesetzt sind
    if (endPoint) {
      fetchRouteForPoints(position, endPoint);
    }
  }, [endPoint, fetchRouteForPoints]);

  const updateEndPoint = useCallback((position: Position) => {
    setEndPoint(position);
    // Route neu berechnen wenn beide Punkte gesetzt sind
    if (startPoint) {
      fetchRouteForPoints(startPoint, position);
    }
  }, [startPoint, fetchRouteForPoints]);

  return {
    startPoint,
    endPoint,
    route,
    isEditingMode,
    loading,
    routeStats,
    handleMapClick,
    toggleEditMode,
    clearRoute,
    swapPoints,
    updateStartPoint,
    updateEndPoint
  };
};