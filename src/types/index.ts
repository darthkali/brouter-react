export interface Position {
  lat: number;
  lng: number;
}

export interface RouteStats {
  distance: number;
  ascent: number;
  descent: number;
  time: number;
}

export interface RouteResponse {
  type: string;
  features: Array<{
    type: string;
    properties?: {
      'track-length'?: number;
      'filtered ascend'?: number;
      'filtered descend'?: number;
      'total-time'?: number;
      'total-energy'?: number;
    };
    geometry: {
      type: string;
      coordinates: number[][];
    };
  }>;
}

export interface MapControlsProps {
  isEditingMode: boolean;
  onToggleEdit: () => void;
  onClearRoute: () => void;
  onSwapPoints: () => void;
  startPoint: Position | null;
  endPoint: Position | null;
}

export interface AnimatedLoadingLineProps {
  startPoint: Position;
  endPoint: Position;
}

export interface MapClickHandlerProps {
  onMapClick: (position: Position) => void;
}

export interface FooterProps {
  routeStats: RouteStats | null;
}