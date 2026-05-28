export type FogMode = "linear" | "exp2";

export const FOG_CONFIG = {
  enabled: false,
  mode: "exp2" as FogMode,
  color: "#dfe7d8",
  near: 32,
  far: 48,
  density: 0.032,
};

export const FOG_LIGHTING_COLOR_MIX = {
  ambient: 0.3,
  sun: 0.7,
};

export const FOG_BOUNDS = {
  near: { min: 0, max: 100, step: 1 },
  far: { min: 1, max: 160, step: 1 },
  density: { min: 0.001, max: 0.05, step: 0.001 },
};

export interface FogState {
  density: number;
  far: number;
  mode: FogMode;
  near: number;
}
