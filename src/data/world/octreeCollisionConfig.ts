import type { Vector3Tuple } from "@/types/three/three";

export interface OctreeCollisionBox {
  center: Vector3Tuple;
  size: Vector3Tuple;
}

export interface MapOctreeCollisionBox extends OctreeCollisionBox {
  bottomY: number;
}

export const MAP_OCTREE_COLLISION_BOXES = {
  immeuble1: {
    center: [-0.0308, 5.8389, 0],
    size: [17.2522, 11.6098, 9.2668],
    bottomY: 0.034,
  },
  maison1: {
    center: [0, 1.3638, 0.0536],
    size: [2.7813, 3.022, 2.8609],
    bottomY: -0.1472,
  },
} as const satisfies Record<string, MapOctreeCollisionBox>;

export const LA_FABRIK_INTERIOR_COLLISION_BOXES = [
  // NOTE: removed — this thin wall (size [0.2, 1.94, 3.71]) sat at x≈-6.93 and
  // sealed the doorway despite the geometry having a hole there. The fabrik
  // mesh octree already provides the surrounding wall collision, so this
  // proxy was both redundant and bug-causing.
  // {
  //   center: [-6.9351, 2.278, -0.0001],
  //   size: [0.2, 1.94, 3.711],
  // },
  {
    center: [0.8026, 0.719, -3.639],
    size: [4.346, 1.108, 1.181],
  },
  {
    center: [-5.8519, 0.9362, 2.5742],
    size: [1.67, 1.551, 2.566],
  },
  {
    center: [-2.0627, 1.4875, -1.2243],
    size: [0.691, 0.723, 0.687],
  },
  {
    center: [-3.5502, 1.4378, -1.2485],
    size: [1.055, 0.657, 0.563],
  },
] as const satisfies readonly OctreeCollisionBox[];

export const CHARACTER_OCTREE_COLLISION_BOX = {
  center: [0, 0.875, 0],
  size: [0.62, 1.75, 0.62],
} as const satisfies OctreeCollisionBox;

export function hasMapOctreeCollisionBox(
  name: string,
): name is keyof typeof MAP_OCTREE_COLLISION_BOXES {
  return name in MAP_OCTREE_COLLISION_BOXES;
}
