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
  const [isDragging, setIsDragging] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string>('mtb');

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
        const { route: segmentRoute, stats } = await fetchRoute(segStart, segEnd, selectedProfile);
        
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
  }, [generateSegmentId, selectedProfile]);


  const addNewSegment = useCallback(async (fromPoint: Position, toPoint: Position) => {
    setLoading(true);
    
    // Add loading segment for just the new segment
    const loadingSeg: LoadingSegment = { start: fromPoint, end: toPoint };
    setLoadingSegments([loadingSeg]);
    
    try {
      const { route: segmentRoute, stats } = await fetchRoute(fromPoint, toPoint, selectedProfile);
      
      const newSegment: RouteSegment = {
        id: generateSegmentId(fromPoint, toPoint),
        start: fromPoint,
        end: toPoint,
        coordinates: segmentRoute,
        isLoading: false
      };
      
      // Add the new segment to existing segments
      setRouteSegments(prev => [...prev, newSegment]);
      
      // Update route stats by adding to existing stats
      if (stats) {
        setRouteStats(prevStats => {
          if (!prevStats) {
            return {
              distance: stats.distance,
              time: stats.time,
              ascent: stats.ascent,
              descent: stats.descent
            };
          }
          return {
            distance: prevStats.distance + stats.distance,
            time: prevStats.time + stats.time,
            ascent: prevStats.ascent + stats.ascent,
            descent: prevStats.descent + stats.descent
          };
        });
      }
      
    } catch (error) {
      console.error('Error fetching new segment:', error);
      // Add empty segment on error
      const errorSegment: RouteSegment = {
        id: generateSegmentId(fromPoint, toPoint),
        start: fromPoint,
        end: toPoint,
        coordinates: [fromPoint, toPoint],
        isLoading: false
      };
      setRouteSegments(prev => [...prev, errorSegment]);
    }
    
    setLoading(false);
    setLoadingSegments([]);
  }, [generateSegmentId, selectedProfile]);

  const updateFirstSegment = useCallback(async (newStartPoint: Position, currentEndPoint: Position, currentWaypoints: Position[]) => {
    // Get the target point - either first waypoint or end point
    const targetPoint = currentWaypoints.length > 0 ? currentWaypoints[0] : currentEndPoint;
    
    // Don't modify any existing segments until we have the new one ready
    if (routeSegments.length === 0) return;
    
    // Set loading state and add loading segment
    setLoading(true);
    setLoadingSegments([{ start: newStartPoint, end: targetPoint }]);
    
    // Mark the first segment as loading to hide it visually
    setRouteSegments(prev => prev.map((segment, index) => 
      index === 0 ? { ...segment, isLoading: true } : segment
    ));
    
    try {
      const { route: newRoute } = await fetchRoute(newStartPoint, targetPoint, selectedProfile);
      
      const newSegment: RouteSegment = {
        id: generateSegmentId(newStartPoint, targetPoint),
        start: newStartPoint,
        end: targetPoint,
        coordinates: newRoute,
        isLoading: false
      };
      
      // Replace the first segment with the new one
      setRouteSegments(prev => [newSegment, ...prev.slice(1)]);
      
    } catch (error) {
      console.error('Error updating first segment:', error);
      // Add error segment
      const errorSegment: RouteSegment = {
        id: generateSegmentId(newStartPoint, targetPoint),
        start: newStartPoint,
        end: targetPoint,
        coordinates: [newStartPoint, targetPoint],
        isLoading: false
      };
      setRouteSegments(prev => [errorSegment, ...prev.slice(1)]);
    }
    
    setLoading(false);
    setLoadingSegments([]);
  }, [routeSegments, generateSegmentId, selectedProfile]);

  const updateLastSegment = useCallback(async (newEndPoint: Position, currentStartPoint: Position, currentWaypoints: Position[]) => {
    // Get the source point - either last waypoint or start point
    const sourcePoint = currentWaypoints.length > 0 ? currentWaypoints[currentWaypoints.length - 1] : currentStartPoint;
    
    // Don't modify any existing segments until we have the new one ready
    if (routeSegments.length === 0) return;
    
    // Set loading state and add loading segment
    setLoading(true);
    setLoadingSegments([{ start: sourcePoint, end: newEndPoint }]);
    
    // Mark the last segment as loading to hide it visually
    setRouteSegments(prev => prev.map((segment, index) => 
      index === prev.length - 1 ? { ...segment, isLoading: true } : segment
    ));
    
    try {
      const { route: newRoute } = await fetchRoute(sourcePoint, newEndPoint, selectedProfile);
      
      const newSegment: RouteSegment = {
        id: generateSegmentId(sourcePoint, newEndPoint),
        start: sourcePoint,
        end: newEndPoint,
        coordinates: newRoute,
        isLoading: false
      };
      
      // Replace the last segment with the new one
      setRouteSegments(prev => [...prev.slice(0, -1), newSegment]);
      
    } catch (error) {
      console.error('Error updating last segment:', error);
      // Add error segment
      const errorSegment: RouteSegment = {
        id: generateSegmentId(sourcePoint, newEndPoint),
        start: sourcePoint,
        end: newEndPoint,
        coordinates: [sourcePoint, newEndPoint],
        isLoading: false
      };
      setRouteSegments(prev => [...prev.slice(0, -1), errorSegment]);
    }
    
    setLoading(false);
    setLoadingSegments([]);
  }, [routeSegments, generateSegmentId, selectedProfile]);

  const handleMapClick = useCallback((position: Position) => {
    if (!isEditingMode || isDragging) return;
    
    if (!startPoint) {
      setStartPoint(position);
    } else if (!endPoint) {
      setEndPoint(position);
      // Don't exit edit mode - keep it active for adding more points
      // Create initial route segment
      setTimeout(() => {
        createSegmentsFromPoints(startPoint, position, []);
      }, 100);
    } else {
      // We have both start and end point, so add current end point as waypoint and set new end point
      const currentEndPoint = endPoint;
      const newWaypoints = [...waypoints, currentEndPoint];
      
      setWaypoints(newWaypoints);
      setEndPoint(position);
      
      // Only calculate the new segment from current end point to new position
      setTimeout(() => {
        addNewSegment(currentEndPoint, position);
      }, 100);
    }
  }, [isEditingMode, isDragging, startPoint, endPoint, waypoints, createSegmentsFromPoints, addNewSegment]);

  const toggleEditMode = useCallback(() => {
    setIsEditingMode(!isEditingMode);
    // Don't clear the route when starting edit mode - only when stopping
    // This allows continuing to add points to existing routes
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
    } else {
      newWaypoints.push(position);
    }
    
    setWaypoints(newWaypoints);
    
    // Always recalculate entire route to avoid inconsistencies
    createSegmentsFromPoints(startPoint, endPoint, newWaypoints);
  }, [startPoint, endPoint, waypoints, createSegmentsFromPoints]);

  const updateStartPoint = useCallback((position: Position) => {
    // IMMEDIATELY update the marker position - no dependencies on segment calculations
    setStartPoint(position);
    
    // Background segment update - don't let this affect the marker position
    if (endPoint && routeSegments.length > 0) {
      // Use setTimeout to ensure the position update happens first
      setTimeout(() => {
        updateFirstSegment(position, endPoint, waypoints);
      }, 10);
    } else if (endPoint) {
      setTimeout(() => {
        createSegmentsFromPoints(position, endPoint, waypoints);
      }, 10);
    }
  }, [endPoint, waypoints, routeSegments.length, updateFirstSegment, createSegmentsFromPoints]);

  const onMarkerDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const onMarkerDragEnd = useCallback(() => {
    // Reset drag status after a short delay to prevent immediate click handling
    setTimeout(() => {
      setIsDragging(false);
    }, 50);
  }, []);

  const updateEndPoint = useCallback((position: Position) => {
    // IMMEDIATELY update the marker position - no dependencies on segment calculations
    setEndPoint(position);
    
    // Background segment update - don't let this affect the marker position
    if (startPoint && routeSegments.length > 0) {
      // Use setTimeout to ensure the position update happens first
      setTimeout(() => {
        updateLastSegment(position, startPoint, waypoints);
      }, 10);
    } else if (startPoint) {
      setTimeout(() => {
        createSegmentsFromPoints(startPoint, position, waypoints);
      }, 10);
    }
  }, [startPoint, waypoints, routeSegments.length, updateLastSegment, createSegmentsFromPoints]);

  const updateWaypoint = useCallback((index: number, position: Position) => {
    if (!startPoint || !endPoint) return;
    
    const updated = [...waypoints];
    updated[index] = position;
    setWaypoints(updated);
    
    // Always recalculate entire route to avoid inconsistencies
    createSegmentsFromPoints(startPoint, endPoint, updated);
  }, [startPoint, endPoint, waypoints, createSegmentsFromPoints]);

  const removeWaypoint = useCallback((index: number) => {
    if (!startPoint || !endPoint) return;
    
    const updated = waypoints.filter((_, i) => i !== index);
    setWaypoints(updated);
    
    createSegmentsFromPoints(startPoint, endPoint, updated);
  }, [startPoint, endPoint, waypoints, createSegmentsFromPoints]);

  const changeProfile = useCallback((newProfile: string) => {
    setSelectedProfile(newProfile);
    
    // Recalculate existing route with new profile
    if (startPoint && endPoint) {
      createSegmentsFromPoints(startPoint, endPoint, waypoints);
    }
  }, [startPoint, endPoint, waypoints, createSegmentsFromPoints]);

  const removeStartPoint = useCallback(() => {
    if (!startPoint) return;
    
    if (waypoints.length > 0) {
      // First waypoint becomes new start point
      const newStartPoint = waypoints[0];
      const newWaypoints = waypoints.slice(1);
      
      setStartPoint(newStartPoint);
      setWaypoints(newWaypoints);
      
      if (endPoint) {
        createSegmentsFromPoints(newStartPoint, endPoint, newWaypoints);
      }
    } else if (endPoint) {
      // Only end point remains, clear everything
      setStartPoint(null);
      setEndPoint(null);
      setWaypoints([]);
      setRouteSegments([]);
      setRouteStats(null);
    }
  }, [startPoint, waypoints, endPoint, createSegmentsFromPoints]);

  const removeEndPoint = useCallback(() => {
    if (!endPoint) return;
    
    if (waypoints.length > 0) {
      // Last waypoint becomes new end point
      const newEndPoint = waypoints[waypoints.length - 1];
      const newWaypoints = waypoints.slice(0, -1);
      
      setEndPoint(newEndPoint);
      setWaypoints(newWaypoints);
      
      if (startPoint) {
        createSegmentsFromPoints(startPoint, newEndPoint, newWaypoints);
      }
    } else if (startPoint) {
      // Only start point remains, clear everything
      setStartPoint(null);
      setEndPoint(null);
      setWaypoints([]);
      setRouteSegments([]);
      setRouteStats(null);
    }
  }, [endPoint, waypoints, startPoint, createSegmentsFromPoints]);

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
    selectedProfile,
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
    changeProfile,
    onMarkerDragStart,
    onMarkerDragEnd
  };
};