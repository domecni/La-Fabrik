export const GRAPHICS_PRESET_KEYS = ["low", "medium", "high", "ultra"] as const;

export type GraphicsPreset = (typeof GRAPHICS_PRESET_KEYS)[number];

export interface GraphicsPresetConfig {
  chunkLoadRadius: number;
  chunkUnloadRadius: number;
  fogEnabled: boolean;
  forceLodModels: boolean;
  label: string;
  lodHighDetailDistance: number;
}

export const GRAPHICS_PRESETS = {
  low: {
    label: "Basse",
    chunkLoadRadius: 10,
    chunkUnloadRadius: 18,
    fogEnabled: true,
    forceLodModels: true,
    lodHighDetailDistance: 0,
  },
  medium: {
    label: "Moyenne",
    chunkLoadRadius: 20,
    chunkUnloadRadius: 30,
    fogEnabled: true,
    forceLodModels: true,
    lodHighDetailDistance: 0,
  },
  high: {
    label: "High",
    chunkLoadRadius: 35,
    chunkUnloadRadius: 45,
    fogEnabled: false,
    forceLodModels: false,
    lodHighDetailDistance: 10,
  },
  ultra: {
    label: "Ultra",
    chunkLoadRadius: 50,
    chunkUnloadRadius: 65,
    fogEnabled: false,
    forceLodModels: false,
    lodHighDetailDistance: 20,
  },
} as const satisfies Record<GraphicsPreset, GraphicsPresetConfig>;

export const GRAPHICS_DEFAULTS = {
  preset: "high" as GraphicsPreset,
  dynamicGrass: true,
  dynamicTrees: true,
  dynamicClouds: true,
  shadowsEnabled: true,
  grassDensity: 1.0,
};

export type GraphicsState = typeof GRAPHICS_DEFAULTS;
