import type { Vector3Tuple } from "@/types/three/three";

export const LA_FABRIK_CENTER: Vector3Tuple = [59.4973, 6.2746, 64.6354];
export const LA_FABRIK_ROTATION_Y = 2.4107;
export const LA_FABRIK_HALF_EXTENTS = {
  x: 8.5,
  z: 7.5,
} as const;
export const LA_FABRIK_PLAYER_SPAWN: Vector3Tuple = [59.5, 6.3, 64.64];
export const LA_FABRIK_INITIAL_LOOK_AT: Vector3Tuple = [58, 7.3, 62.5];
export const LA_FABRIK_INTERIOR_LIGHT_POSITION: Vector3Tuple = [59.5, 9, 64.64];

export function isInsideLaFabrikFootprint(
  x: number,
  z: number,
  padding = 0,
): boolean {
  const dx = x - LA_FABRIK_CENTER[0];
  const dz = z - LA_FABRIK_CENTER[2];
  const cos = Math.cos(-LA_FABRIK_ROTATION_Y);
  const sin = Math.sin(-LA_FABRIK_ROTATION_Y);
  const localX = dx * cos - dz * sin;
  const localZ = dx * sin + dz * cos;

  return (
    Math.abs(localX) <= LA_FABRIK_HALF_EXTENTS.x + padding &&
    Math.abs(localZ) <= LA_FABRIK_HALF_EXTENTS.z + padding
  );
}
