export interface Position {
  x: number;
  y: number;
}

export interface GridNode {
  x: number;
  y: number;
  walkable: boolean;
  g: number;
  h: number;
  f: number;
  parent: GridNode | null;
}

export interface GridSize {
  width: number;
  height: number;
}

export interface Waypoint {
  id: number;
  x: number;
  y: number;
  z: number;
  connections: number[];
}

export interface WaypointNode {
  id: number;
  x: number;
  y: number;
  z: number;
  connections: number[];
  g: number;
  h: number;
  f: number;
  parent: WaypointNode | null;
}
