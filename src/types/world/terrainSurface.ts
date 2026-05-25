import type * as THREE from "three";

export type TerrainSurfaceKind =
  | "grass"
  | "path"
  | "water"
  | "garden"
  | "dirt"
  | "rock";

export type TerrainSurfaceRgb = readonly [number, number, number];

export interface TerrainSurfaceUv {
  u: number;
  v: number;
}

export interface TerrainSurfaceBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
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

export interface TerrainSurfaceSample {
  rgb: TerrainSurfaceRgb;
  key: string | null;
  config: TerrainSurfaceColorConfig | null;
}

export interface TerrainSurfaceData {
  bounds: TerrainSurfaceBounds;
  imageData: ImageData;
  raycastTarget: THREE.Object3D;
}
