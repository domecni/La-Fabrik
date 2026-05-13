export const WIND_DEFAULTS = {
  speed: 0.3,
  direction: Math.PI * 0.25,
  strength: 1.0,
  noiseScale: 0.9,
};

export const WIND_BOUNDS = {
  speed: { min: 0, max: 2, step: 0.1 },
  direction: { min: -Math.PI, max: Math.PI, step: 0.1 },
  strength: { min: 0, max: 3, step: 0.1 },
  noiseScale: { min: 0.1, max: 5, step: 0.1 },
};

export type WindState = typeof WIND_DEFAULTS;
