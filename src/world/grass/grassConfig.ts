import { TERRAIN_COLORS } from "@/data/world/terrainConfig";

export const GRASS_CONFIG = {
  enabled: true,
  chunkSize: 20,
  loadRadius: 30,
  unloadRadius: 34,
  updateInterval: 250,
  sampleStep: 1.15,
  jitter: 0.42,
  bladesPerCell: 2,
  maxBladesPerChunk: 720,
  bladeWidth: 0.12,
  minBladeHeight: 0.42,
  maxBladeHeight: 0.82,
  surfaceOffset: 0.06,
  baseColor: "#1f3512",
  windBendStrength: 0.42,
  windNoiseScale: 0.09,
} as const;

export const GRASS_SURFACE_KEYS = new Set([
  "grass1",
  "grass2",
  "grass3",
] as const);

export function getGrassTipColor(surfaceKey: string | null): string {
  if (surfaceKey === "grass1") return TERRAIN_COLORS.grass1.grassTipColor;
  if (surfaceKey === "grass2") return TERRAIN_COLORS.grass2.grassTipColor;
  if (surfaceKey === "grass3") return TERRAIN_COLORS.grass3.grassTipColor;
  return TERRAIN_COLORS.grass1.grassTipColor;
}
