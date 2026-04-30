import type { Vector3Tuple } from "@/types/three/three";

export interface MapNode {
  name: string;
  type: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
}

export interface SceneData {
  mapNodes: MapNode[];
  models: Map<string, string>;
}

export type TransformMode = "translate" | "rotate" | "scale";
