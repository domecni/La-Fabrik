import type { TerrainSurfaceColorConfig } from "@/types/world/terrainSurface";

export const TERRAIN_SURFACE_COLOR_TOLERANCE = 15;
export const TERRAIN_WATER_HEIGHT = 0;
export const TERRAIN_TILE_SIZE = 1;
export const GRASS_BASE_COLOR = "#1a3a1a";

export const TERRAIN_COLORS = {
  grass1: {
    hex: "#84C66B",
    rgb: [132, 198, 107] as const,
    kind: "grass",
    grassTipColor: "#84C66B",
  },
  grass2: {
    hex: "#67B058",
    rgb: [103, 176, 88] as const,
    kind: "grass",
    grassTipColor: "#67B058",
  },
  grass3: {
    hex: "#A3CA5B",
    rgb: [163, 202, 91] as const,
    kind: "grass",
    grassTipColor: "#A3CA5B",
  },
  potager: {
    hex: "#342420",
    rgb: [52, 36, 32] as const,
    kind: "garden",
    modelPath: "/models/potager/potager.gltf",
    tileSize: TERRAIN_TILE_SIZE,
  },
  terre: {
    hex: "#513E2C",
    rgb: [81, 62, 44] as const,
    kind: "dirt",
  },
  chemin: {
    hex: "#F5D896",
    rgb: [245, 216, 150] as const,
    kind: "path",
    modelPath: "/models/chemins/model.gltf",
    tileSize: TERRAIN_TILE_SIZE,
  },
  eau: {
    hex: "#91DAF5",
    rgb: [145, 218, 245] as const,
    kind: "water",
  },
  cailloux: {
    hex: "#B6D3DE",
    rgb: [182, 211, 222] as const,
    kind: "rock",
  },
} satisfies Record<string, TerrainSurfaceColorConfig>;

export type TerrainColorKey = keyof typeof TERRAIN_COLORS;
