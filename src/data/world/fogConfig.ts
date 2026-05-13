import { TERRAIN_COLORS } from "@/data/world/terrainConfig";

export const FOG_CONFIG = {
  enabled: true,
  color: "#c8dbbe",
  near: 50,
  far: 70,
};

export const CHUNK_CONFIG = {
  enabled: true,
  chunkSize: 40,
  loadRadius: 70,
  unloadRadius: 80,
  updateInterval: 500,
};

export const GROUND_PLANE_COLOR = TERRAIN_COLORS.grass1.hex;
