import type { Octree } from "three/addons/math/Octree.js";

export type Vector3Tuple = [number, number, number];

export type ColliderShape = "cuboid" | "ball" | "hull";

export type OctreeReadyHandler = (octree: Octree) => void;
