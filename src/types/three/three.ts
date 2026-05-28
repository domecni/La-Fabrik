import type { Octree } from "three-stdlib";

export type Vector3Tuple = [number, number, number];

export type Vector3Scale = Vector3Tuple | number;

export interface ModelTransformProps {
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Scale;
}

export type ColliderShape = "cuboid" | "ball" | "hull";

export type OctreeReadyHandler = (octree: Octree) => void;
