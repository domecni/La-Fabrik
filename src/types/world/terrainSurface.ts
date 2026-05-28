type TerrainSurfaceKind =
  | "grass"
  | "path"
  | "water"
  | "garden"
  | "dirt"
  | "rock";

type TerrainSurfaceRgb = readonly [number, number, number];

export interface TerrainSurfaceBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface TerrainSurfaceColorConfig {
  hex: string;
  rgb: TerrainSurfaceRgb;
  kind: TerrainSurfaceKind;
  grassTipColor?: string;
  modelPath?: string;
  tileSize?: number;
}
