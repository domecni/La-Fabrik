export type TerrainSurfaceKind =
  | "grass"
  | "path"
  | "water"
  | "garden"
  | "dirt"
  | "rock";

export type TerrainSurfaceRgb = readonly [number, number, number];

export interface TerrainSurfaceColorConfig {
  hex: string;
  rgb: TerrainSurfaceRgb;
  kind: TerrainSurfaceKind;
  grassTipColor?: string;
  modelPath?: string;
  tileSize?: number;
}
