export const TERRAIN_COLORS = {
  grass1: {
    hex: "#84C66B",
    rgb: [132, 198, 107] as const,
    type: "grass" as const,
    grassTipColor: "#84C66B",
  },
  grass2: {
    hex: "#67B058",
    rgb: [103, 176, 88] as const,
    type: "grass" as const,
    grassTipColor: "#67B058",
  },
  grass3: {
    hex: "#A3CA5B",
    rgb: [163, 202, 91] as const,
    type: "grass" as const,
    grassTipColor: "#A3CA5B",
  },
  potager: {
    hex: "#342420",
    rgb: [52, 36, 32] as const,
    type: "tile" as const,
    tileModel: "/models/potager/potager.gltf",
    tileSize: 1,
  },
  terre: {
    hex: "#513E2C",
    rgb: [81, 62, 44] as const,
    type: "none" as const,
  },
  chemin: {
    hex: "#F5D896",
    rgb: [245, 216, 150] as const,
    type: "tile" as const,
    tileModel: "/models/chemins/model.gltf",
    tileSize: 1,
  },
  eau: {
    hex: "#91DAF5",
    rgb: [145, 218, 245] as const,
    type: "water" as const,
  },
  cailloux: {
    hex: "#B6D3DE",
    rgb: [182, 211, 222] as const,
    type: "none" as const,
  },
} as const;

export type TerrainColorKey = keyof typeof TERRAIN_COLORS;
export type TerrainType = "grass" | "tile" | "water" | "none";

export const GRASS_BASE_COLOR = "#1a3a1a";

export const COLOR_TOLERANCE = 15;

export function colorMatchesTerrain(
  r: number,
  g: number,
  b: number,
  targetRgb: readonly [number, number, number],
  tolerance: number = COLOR_TOLERANCE,
): boolean {
  return (
    Math.abs(r - targetRgb[0]) <= tolerance &&
    Math.abs(g - targetRgb[1]) <= tolerance &&
    Math.abs(b - targetRgb[2]) <= tolerance
  );
}

export function getTerrainTypeFromColor(
  r: number,
  g: number,
  b: number,
): TerrainColorKey | null {
  for (const [key, config] of Object.entries(TERRAIN_COLORS)) {
    if (colorMatchesTerrain(r, g, b, config.rgb)) {
      return key as TerrainColorKey;
    }
  }
  return null;
}

export function isGrassZone(r: number, g: number, b: number): boolean {
  return (
    colorMatchesTerrain(r, g, b, TERRAIN_COLORS.grass1.rgb) ||
    colorMatchesTerrain(r, g, b, TERRAIN_COLORS.grass2.rgb) ||
    colorMatchesTerrain(r, g, b, TERRAIN_COLORS.grass3.rgb)
  );
}

export function getGrassTipColor(
  r: number,
  g: number,
  b: number,
): string | null {
  if (colorMatchesTerrain(r, g, b, TERRAIN_COLORS.grass1.rgb)) {
    return TERRAIN_COLORS.grass1.grassTipColor;
  }
  if (colorMatchesTerrain(r, g, b, TERRAIN_COLORS.grass2.rgb)) {
    return TERRAIN_COLORS.grass2.grassTipColor;
  }
  if (colorMatchesTerrain(r, g, b, TERRAIN_COLORS.grass3.rgb)) {
    return TERRAIN_COLORS.grass3.grassTipColor;
  }
  return null;
}
