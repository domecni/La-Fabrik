import type { Vector3Tuple } from "@/types/three/three";
import { LA_FABRIK_PLAYER_SPAWN } from "@/data/world/laFabrikConfig";

export const PLAYER_EYE_HEIGHT = 1.75;
export const PLAYER_CAPSULE_RADIUS = 0.35;

export const PLAYER_WALK_SPEED = 5;
export const PLAYER_EBIKE_SPEED = 20;
export const PLAYER_AIR_CONTROL_FACTOR = 0.35;
export const PLAYER_JUMP_SPEED = 9;
export const PLAYER_GRAVITY = 30;
export const PLAYER_MAX_DELTA = 0.05;
export const PLAYER_ACCELERATION_MULTIPLIER = 9;
export const PLAYER_XZ_DAMPING_FACTOR = 8;
export const PLAYER_FALL_RESPAWN_Y = -20;
export const PLAYER_FALL_RESPAWN_DELAY = 3;

export const PLAYER_SPAWN_POSITION_GAME: Vector3Tuple = [
  LA_FABRIK_PLAYER_SPAWN[0] + 1,
  LA_FABRIK_PLAYER_SPAWN[1],
  LA_FABRIK_PLAYER_SPAWN[2] - 1,
];
export const PLAYER_SPAWN_POSITION_PHYSICS: Vector3Tuple = [
  0,
  PLAYER_EYE_HEIGHT,
  0,
];
