export const GRAPHICS_DEFAULTS = {
  dynamicGrass: true,
  dynamicTrees: true,
  dynamicClouds: true,
  shadowsEnabled: true,
  grassDensity: 1.0,
};

export const GRAPHICS_BOUNDS = {
  grassDensity: { min: 0.1, max: 2.0, step: 0.1 },
};

export type GraphicsState = typeof GRAPHICS_DEFAULTS;
