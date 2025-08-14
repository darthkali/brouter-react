import { useState, useCallback } from 'react';
import { Position, RouteStats, LoadingSegment, RouteSegment } from '../types';
import { fetchRoute } from '../services/routeService';

export const useRouting = () => {
  const [startPoint, setStartPoint] = useState<Position | null>(null);
  const [endPoint, setEndPoint] = useState<Position | null>(null);
  const [waypoints, setWaypoints] = useState<Position[]>([]);
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSegments, setLoadingSegments] = useState<LoadingSegment[]>([]);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);

  const generateSegmentId = useCallback((start: Position, end: Position): string => {
    return `${start.lat.toFixed(6)}-${start.lng.toFixed(6)}_${end.lat.toFixed(6)}-${end.lng.toFixed(6)}`;
  }, []);

  const createSegmentsFromPoints = useCallback(async (start: Position, end: Position, currentWaypoints: Position[]) => {
    const allPoints = [start, ...currentWaypoints, end];
    const newSegments: RouteSegment[] = [];
    setLoading(true);
    
    // Create loading segments first
    const loadingSegs: LoadingSegment[] = [];
    for (let i = 0; i < allPoints.length - 1; i++) {
      const segStart = allPoints[i];
      const segEnd = allPoints[i + 1];
      loadingSegs.push({ start: segStart, end: segEnd });
    }
    setLoadingSegments(loadingSegs);
    
    // Fetch each segment
    let totalDistance = 0;
    let totalTime = 0;
    let totalAscent = 0;
    let totalDescent = 0;
    
    for (let i = 0; i < allPoints.length - 1; i++) {
      const segStart = allPoints[i];
      const segEnd = allPoints[i + 1];
      const segmentId = generateSegmentId(segStart, segEnd);
      
      try {
        const { route: segmentRoute, stats } = await fetchRoute(segStart, segEnd);
        
        newSegments.push({
          id: segmentId,
          start: segStart,
          end: segEnd,
          coordinates: segmentRoute,
          isLoading: false
        });
        
        if (stats) {
          totalDistance += stats.distance;
          totalTime += stats.time;
          totalAscent += stats.ascent;
          totalDescent += stats.descent;
        }
      } catch (error) {
        console.error(`Error fetching segment ${i}:`, error);
        // Add empty segment on error
        newSegments.push({
          id: segmentId,
          start: segStart,
          end: segEnd,
          coordinates: [segStart, segEnd],
          isLoading: false
        });
      }
    }
    
    setRouteSegments(newSegments);
    setRouteStats({
      distance: totalDistance,
      time: totalTime,
      ascent: totalAscent,
      descent: totalDescent
    });
    
    setLoading(false);
    setLoadingSegments([]);
  }, [generateSegmentId]);

  const replaceSegmentWithTwo = useCallback(async (
    segmentToReplace: RouteSegment, 
    newWaypoint: Position
  ) => {
    setLoading(true);
    
    // Remove the old segment and add loading segments
    setRouteSegments(prev => prev.filter(seg => seg.id !== segmentToReplace.id));
    
    const loadingSegs: LoadingSegment[] = [
      { start: segmentToReplace.start, end: newWaypoint },
      { start: newWaypoint, end: segmentToReplace.end }
    ];
    setLoadingSegments(loadingSegs);
    
    // Fetch the two new segments
    const newSegments: RouteSegment[] = [];
    
    try {
      // First segment: original start -> new waypoint
      const { route: route1 } = await fetchRoute(segmentToReplace.start, newWaypoint);
      newSegments.push({
        id: generateSegmentId(segmentToReplace.start, newWaypoint),
        start: segmentToReplace.start,
        end: newWaypoint,
        coordinates: route1,
        isLoading: false
      });
      
      // Second segment: new waypoint -> original end
      const { route: route2 } = await fetchRoute(newWaypoint, segmentToReplace.end);
      newSegments.push({
        id: generateSegmentId(newWaypoint, segmentToReplace.end),
        start: newWaypoint,
        end: segmentToReplace.end,
        coordinates: route2,
        isLoading: false
      });
      
      // Add the new segments
      setRouteSegments(prev => [...prev, ...newSegments]);
      
    } catch (error) {
      console.error('Error creating new segments:', error);
    }
    
    setLoading(false);
    setLoadingSegments([]);
  }, [generateSegmentId]);

  const handleMapClick = useCallback((position: Position) => {
    if (!isEditingMode) return;
    
    if (!startPoint) {
      setStartPoint(position);
    } else if (!endPoint) {
      setEndPoint(position);
      setIsEditingMode(false);
      // Create initial route segment
      setTimeout(() => {
        createSegmentsFromPoints(startPoint, position, []);
      }, 100);
    } else {
      setStartPoint(position);
      setEndPoint(null);
      setWaypoints([]);
      setRouteSegments([]);
      setRouteStats(null);
    }
  }, [isEditingMode, startPoint, endPoint, createSegmentsFromPoints]);

  const toggleEditMode = useCallback(() => {
    setIsEditingMode(!isEditingMode);
    if (!isEditingMode) {
      setStartPoint(null);
      setEndPoint(null);
      setWaypoints([]);
      setRouteSegments([]);
      setRouteStats(null);
    }
  }, [isEditingMode]);

  const clearRoute = useCallback(() => {
    setStartPoint(null);
    setEndPoint(null);
    setWaypoints([]);
    setRouteSegments([]);
    setRouteStats(null);
  }, []);

  const swapPoints = useCallback(() => {
    if (startPoint && endPoint) {
      const newStart = endPoint;
      const newEnd = startPoint;
      const newWaypoints = [...waypoints].reverse();
      
      setStartPoint(newStart);
      setEndPoint(newEnd);
      setWaypoints(newWaypoints);
      
      createSegmentsFromPoints(newStart, newEnd, newWaypoints);
    }
  }, [startPoint, endPoint, waypoints, createSegmentsFromPoints]);

  const addWaypoint = useCallback((position: Position, index?: number) => {
    if (!startPoint || !endPoint) return;
    
    const newWaypoints = [...waypoints];
    if (index !== undefined) {
      newWaypoints.splice(index, 0, position);
      
      // Find the segment that needs to be replaced
      const allPoints = [startPoint, ...waypoints, endPoint];
      const segmentStart = allPoints[index];
      const segmentEnd = allPoints[index + 1];
      const segmentToReplace = routeSegments.find(seg => 
        seg.start.lat === segmentStart.lat && seg.start.lng === segmentStart.lng &&
        seg.end.lat === segmentEnd.lat && seg.end.lng === segmentEnd.lng
      );
      
      setWaypoints(newWaypoints);
      
      if (segmentToReplace) {
        replaceSegmentWithTwo(segmentToReplace, position);
      }
    } else {
      newWaypoints.push(position);
      setWaypoints(newWaypoints);
      createSegmentsFromPoints(startPoint, endPoint, newWaypoints);
    }
  }, [startPoint, endPoint, waypoints, routeSegments, replaceSegmentWithTwo, createSegmentsFromPoints]);

  const updateStartPoint = useCallback((position: Position) => {
    setStartPoint(position);
    if (endPoint) {
      createSegmentsFromPoints(position, endPoint, waypoints);
    }
  }, [endPoint, waypoints, createSegmentsFromPoints]);

  const updateEndPoint = useCallback((position: Position) => {
    setEndPoint(position);
    if (startPoint) {
      createSegmentsFromPoints(startPoint, position, waypoints);
    }
  }, [startPoint, waypoints, createSegmentsFromPoints]);

  const updateWaypoint = useCallback((index: number, position: Position) => {
    if (!startPoint || !endPoint) return;
    
    const updated = [...waypoints];
    updated[index] = position;
    setWaypoints(updated);
    
    createSegmentsFromPoints(startPoint, endPoint, updated);
  }, [startPoint, endPoint, waypoints, createSegmentsFromPoints]);

  const removeWaypoint = useCallback((index: number) => {
    if (!startPoint || !endPoint) return;
    
    const updated = waypoints.filter((_, i) => i !== index);
    setWaypoints(updated);
    
    createSegmentsFromPoints(startPoint, endPoint, updated);
  }, [startPoint, endPoint, waypoints, createSegmentsFromPoints]);

  // Compute combined route for legacy compatibility
  const route = routeSegments.reduce<Position[]>((acc, segment, index) => {
    if (index === 0) {
      return [...segment.coordinates];
    } else {
      // Skip first point to avoid duplication
      return [...acc, ...segment.coordinates.slice(1)];
    }
  }, []);

  return {
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
    removeWaypoint
  };
};