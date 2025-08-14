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

  const addNewSegment = useCallback(async (fromPoint: Position, toPoint: Position) => {
    setLoading(true);
    
    // Add loading segment for just the new segment
    const loadingSeg: LoadingSegment = { start: fromPoint, end: toPoint };
    setLoadingSegments([loadingSeg]);
    
    try {
      const { route: segmentRoute, stats } = await fetchRoute(fromPoint, toPoint);
      
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
  }, [generateSegmentId]);

  const handleMapClick = useCallback((position: Position) => {
    if (!isEditingMode) return;
    
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
  }, [isEditingMode, startPoint, endPoint, waypoints, createSegmentsFromPoints, addNewSegment]);

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

  const updateWaypoint = useCallback(async (index: number, position: Position) => {
    if (!startPoint || !endPoint) return;
    
    const updated = [...waypoints];
    updated[index] = position;
    setWaypoints(updated);
    
    // Find the two segments that need to be updated
    const allPoints = [startPoint, ...waypoints, endPoint];
    const newAllPoints = [startPoint, ...updated, endPoint];
    
    // The waypoint at index affects two segments:
    // 1. From allPoints[index] to allPoints[index + 1] 
    // 2. From allPoints[index + 1] to allPoints[index + 2]
    const segmentBefore = {
      start: allPoints[index],
      end: allPoints[index + 1], // old waypoint position
    };
    const segmentAfter = {
      start: allPoints[index + 1], // old waypoint position
      end: allPoints[index + 2],
    };
    
    // New segments with updated waypoint position
    const newSegmentBefore = {
      start: newAllPoints[index],
      end: newAllPoints[index + 1], // new waypoint position
    };
    const newSegmentAfter = {
      start: newAllPoints[index + 1], // new waypoint position
      end: newAllPoints[index + 2],
    };
    
    setLoading(true);
    
    // Remove old segments and add loading segments
    setRouteSegments(prev => prev.filter(seg => {
      const beforeId = generateSegmentId(segmentBefore.start, segmentBefore.end);
      const afterId = generateSegmentId(segmentAfter.start, segmentAfter.end);
      return seg.id !== beforeId && seg.id !== afterId;
    }));
    
    setLoadingSegments([
      { start: newSegmentBefore.start, end: newSegmentBefore.end },
      { start: newSegmentAfter.start, end: newSegmentAfter.end }
    ]);
    
    try {
      // Fetch new segments
      const newSegments: RouteSegment[] = [];
      
      // First segment
      const { route: route1 } = await fetchRoute(newSegmentBefore.start, newSegmentBefore.end);
      newSegments.push({
        id: generateSegmentId(newSegmentBefore.start, newSegmentBefore.end),
        start: newSegmentBefore.start,
        end: newSegmentBefore.end,
        coordinates: route1,
        isLoading: false
      });
      
      // Second segment
      const { route: route2 } = await fetchRoute(newSegmentAfter.start, newSegmentAfter.end);
      newSegments.push({
        id: generateSegmentId(newSegmentAfter.start, newSegmentAfter.end),
        start: newSegmentAfter.start,
        end: newSegmentAfter.end,
        coordinates: route2,
        isLoading: false
      });
      
      // Add new segments
      setRouteSegments(prev => [...prev, ...newSegments]);
      
    } catch (error) {
      console.error('Error updating waypoint segments:', error);
    }
    
    setLoading(false);
    setLoadingSegments([]);
  }, [startPoint, endPoint, waypoints, generateSegmentId]);

  const removeWaypoint = useCallback((index: number) => {
    if (!startPoint || !endPoint) return;
    
    const updated = waypoints.filter((_, i) => i !== index);
    setWaypoints(updated);
    
    createSegmentsFromPoints(startPoint, endPoint, updated);
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
    removeEndPoint
  };
};