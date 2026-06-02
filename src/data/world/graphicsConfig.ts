export const GRAPHICS_PRESET_KEYS = [
  "low",
  "medium",
  "high",
  "ultra",
  "max",
] as const;

export type GraphicsPreset = (typeof GRAPHICS_PRESET_KEYS)[number];

export interface GraphicsPresetConfig {
  chunkLoadRadius: number;
  chunkStreamingEnabled: boolean;
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
    chunkStreamingEnabled: true,
    fogEnabled: true,
    forceLodModels: true,
    lodHighDetailDistance: 0,
  },
  medium: {
    label: "Moyenne",
    chunkLoadRadius: 20,
    chunkUnloadRadius: 30,
    chunkStreamingEnabled: true,
    fogEnabled: true,
    forceLodModels: true,
    lodHighDetailDistance: 0,
  },
  high: {
    label: "High",
    chunkLoadRadius: 35,
    chunkUnloadRadius: 45,
    chunkStreamingEnabled: true,
    fogEnabled: false,
    forceLodModels: false,
    lodHighDetailDistance: 10,
  },
  ultra: {
    label: "Ultra",
    chunkLoadRadius: 50,
    chunkUnloadRadius: 65,
    chunkStreamingEnabled: true,
    fogEnabled: false,
    forceLodModels: false,
    lodHighDetailDistance: 20,
  },
  max: {
    label: "Max",
    chunkLoadRadius: 50,
    chunkUnloadRadius: 65,
    chunkStreamingEnabled: false,
    fogEnabled: false,
    forceLodModels: false,
    lodHighDetailDistance: 50,
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
