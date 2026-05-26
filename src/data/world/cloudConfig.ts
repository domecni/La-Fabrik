import type { Vector3Tuple } from "@/types/three/three";

export const CLOUD_CONFIG = {
  enabled: true,
  modelPath: "/models/cloud/model.glb",
  center: [0, 40, 0] as Vector3Tuple,
  areaSize: [240, 180] as const,
  minDriftSpeed: 0.05,
  wrapPadding: 30,
};

export const CLOUD_DEFAULTS = {
  count: 10,
  minHeight: 25,
  maxHeight: 55,
  minScale: 5,
  maxScale: 13,
  minRotation: 0,
  maxRotation: Math.PI * 2,
  minSpeedMultiplier: 0.4,
  maxSpeedMultiplier: 1,
  castShadow: false,
  receiveShadow: false,
};

export const CLOUD_BOUNDS = {
  count: { min: 0, max: 30, step: 1 },
  height: { min: 10, max: 100, step: 1 },
  scale: { min: 1, max: 30, step: 0.5 },
  rotation: { min: -Math.PI * 2, max: Math.PI * 2, step: 0.1 },
  speedMultiplier: { min: 0, max: 3, step: 0.1 },
};

export type CloudState = typeof CLOUD_DEFAULTS;
