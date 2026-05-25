import {
  TERRAIN_COLORS,
  TERRAIN_SURFACE_COLOR_TOLERANCE,
  type TerrainColorKey,
} from "@/data/world/terrainConfig";
import type { TerrainSurfaceRgb } from "@/types/world/terrainSurface";

export function colorMatchesTerrainSurface(
  r: number,
  g: number,
  b: number,
  targetRgb: TerrainSurfaceRgb,
  tolerance: number = TERRAIN_SURFACE_COLOR_TOLERANCE,
): boolean {
  return (
    Math.abs(r - targetRgb[0]) <= tolerance &&
    Math.abs(g - targetRgb[1]) <= tolerance &&
    Math.abs(b - targetRgb[2]) <= tolerance
  );
}

export function getTerrainColorKeyFromRgb(
  r: number,
  g: number,
  b: number,
): TerrainColorKey | null {
  for (const [key, config] of Object.entries(TERRAIN_COLORS)) {
    if (colorMatchesTerrainSurface(r, g, b, config.rgb)) {
      return key as TerrainColorKey;
    }
  }

  return null;
}

export function isGrassTerrainColor(r: number, g: number, b: number): boolean {
  const key = getTerrainColorKeyFromRgb(r, g, b);
  return key !== null && TERRAIN_COLORS[key].kind === "grass";
}

export function getGrassTipColorFromRgb(
  r: number,
  g: number,
  b: number,
): string | null {
  const key = getTerrainColorKeyFromRgb(r, g, b);
  if (key === null) return null;

  const terrainColor = TERRAIN_COLORS[key];
  return "grassTipColor" in terrainColor ? terrainColor.grassTipColor : null;
}
