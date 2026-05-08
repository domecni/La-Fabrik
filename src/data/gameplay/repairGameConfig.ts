import type { Vector3Tuple } from "@/types/three/three";

export const REPAIR_GAME_ZONE_ORIGIN: Vector3Tuple = [10, 0.4, -8];
export const REPAIR_GAME_ZONE_RADIUS = 4.2;
export const REPAIR_GAME_ZONE_LABEL = "Pack de Relance Feature";
export const REPAIR_FRAGMENTATION_FIST_HOLD_SECONDS = 1;
export const REPAIR_FRAGMENTATION_SEQUENCE_SECONDS = 4;
export const REPAIR_SCAN_SEQUENCE_SECONDS = 4;

export const REPAIR_GAME_MODULE_SLOTS = [
  { label: "Module A", offset: [-2.2, 0, 2.2] },
  { label: "Module B", offset: [0, 0, 2.6] },
  { label: "Module C", offset: [2.2, 0, 2.2] },
] satisfies Array<{ label: string; offset: Vector3Tuple }>;
