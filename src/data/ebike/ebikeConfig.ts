import type { Vector3Tuple } from "@/types/three/three";

export interface CameraTransform {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
}

export const EBIKE_CAMERA_TRANSFORM: CameraTransform = {
  position: [-2.6, 4.5, 0],
  rotation: [-10, -90, 0],
};

export const EBIKE_DROP_PLAYER_TRANSFORM: CameraTransform = {
  position: [0, 1.3, -2.25],
  rotation: [0, 0, 0],
};

export const EBIKE_WORLD_POSITION: Vector3Tuple = [65, 0.8, 72];
export const EBIKE_WORLD_ROTATION_Y = -2.5;
export const EBIKE_WORLD_SCALE = 0.35;

export const EBIKE_INTRO_BREAKDOWN_DISTANCE = 15;
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
