import type { Vector3Tuple } from "@/types/three/three";

export interface MapNode {
  id?: string;
  name: string;
  type: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  sourcePath?: number[];
}

export interface MapNodeInstanceTransform {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
}

export type MapAssetInstance = MapNodeInstanceTransform;
export type VegetationInstance = MapNodeInstanceTransform;

export interface HierarchicalMapNode extends MapNode {
  role?: "group";
  children?: HierarchicalMapNode[];
}

export interface SceneData {
  mapNodes: MapNode[];
  models: Map<string, string>;
  mapTree?: HierarchicalMapNode | HierarchicalMapNode[];
}
