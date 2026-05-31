import type { Vector3Tuple } from "@/types/three/three";

export interface CameraTransform {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
}

export const EBIKE_CAMERA_TRANSFORM: CameraTransform = {
  position: [-3.5, 6, 0],
  rotation: [-10, -90, 0],
};

export const EBIKE_DROP_PLAYER_TRANSFORM: CameraTransform = {
  position: [0, 1.5, -3],
  rotation: [0, 0, 0],
};

export const EBIKE_WORLD_POSITION: Vector3Tuple = [61.5, 10, 62.4];
export const EBIKE_WORLD_ROTATION_Y = 2.4107;

export const EBIKE_INTRO_RIDE_DURATION_MS = 5000;
export const EBIKE_BREAKDOWN_DIALOGUE_DELAY_MS = 250;

export const EBIKE_MAX_SPEED = 3;
export const EBIKE_ACCELERATION_DURATION_MS = 2000;
export const EBIKE_DECELERATION_DURATION_MS = 2000;

export const EBIKE_SOUNDS = {
  depart: "/sounds/effect/ebike-depart.mp3",
  roule: "/sounds/effect/ebike-roule.mp3",
  ralenti: "/sounds/effect/ebike-ralenti.mp3",
  panne: "/sounds/effect/ebike-panne.mp3",
} as const;

export const EBIKE_BREAKDOWN_DIALOGUE_ID = "narrateur_ebikecasse";
