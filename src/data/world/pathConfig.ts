import { TERRAIN_COLORS, TERRAIN_TILE_SIZE } from "@/data/world/terrainConfig";

export const PATH_SURFACE_KEY = "chemin";
export const PATH_DEBUG_PREVIEW_ENABLED = false;
export const PATH_TILE_RENDER_ENABLED = false;
export const PATH_TILE_MODEL_PATH = TERRAIN_COLORS.chemin.modelPath;
export const PATH_TILE_SIZE =
  TERRAIN_COLORS.chemin.tileSize ?? TERRAIN_TILE_SIZE;
export const PATH_TILE_SAMPLE_STEP = 2;
export const PATH_TILE_MAX_COUNT = 1500;
export const PATH_TILE_ROTATION = [0, 0, 0] as const;
export const PATH_TILE_SCALE = [1, 1, 1] as const;
