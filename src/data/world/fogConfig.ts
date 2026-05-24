import { TERRAIN_COLORS } from "@/data/world/terrainConfig";

export const FOG_CONFIG = {
  enabled: true,
  color: "#c8dbbe",
  near: 34,
  far: 58,
};

export const CHUNK_CONFIG = {
  enabled: true,
  chunkSize: 35,
  loadRadius: 45,
  unloadRadius: 58,
  updateInterval: 350,
};

export const GROUND_PLANE_COLOR = TERRAIN_COLORS.grass1.hex;
