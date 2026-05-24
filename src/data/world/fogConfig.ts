import { TERRAIN_COLORS } from "@/data/world/terrainConfig";

export const FOG_CONFIG = {
  enabled: true,
  color: "#eef3f5",
  near: 38,
  far: 45,
};

export const CHUNK_CONFIG = {
  enabled: true,
  chunkSize: 35,
  loadRadius: 45,
  unloadRadius: 45,
  updateInterval: 350,
};

export const GROUND_PLANE_COLOR = TERRAIN_COLORS.grass1.hex;
