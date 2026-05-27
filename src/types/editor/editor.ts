import type { Vector3Tuple } from "../three/three";

export interface MapNode {
  name: string;
  type: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  sourcePath?: number[];
}

export interface HierarchicalMapNode extends MapNode {
  role?: "group";
  children?: HierarchicalMapNode[];
}

export interface SceneData {
  mapNodes: MapNode[];
  models: Map<string, string>;
  mapTree?: HierarchicalMapNode | HierarchicalMapNode[];
}

export type TransformMode = "translate" | "rotate" | "scale";
