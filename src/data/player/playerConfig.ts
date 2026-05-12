import type { Vector3Tuple } from "@/types/three/three";

export const PLAYER_EYE_HEIGHT = 1.75;
export const PLAYER_CAPSULE_RADIUS = 0.35;

export const PLAYER_WALK_SPEED = 11;
export const PLAYER_AIR_CONTROL_FACTOR = 0.35;
export const PLAYER_JUMP_SPEED = 9;
export const PLAYER_GRAVITY = 30;
export const PLAYER_MAX_DELTA = 0.05;
export const PLAYER_ACCELERATION_MULTIPLIER = 9;
export const PLAYER_XZ_DAMPING_FACTOR = 8;

export const PLAYER_SPAWN_POSITION_GAME: Vector3Tuple = [0, 50, 0];
export const PLAYER_SPAWN_POSITION_PHYSICS: Vector3Tuple = [0, 3, 0];
