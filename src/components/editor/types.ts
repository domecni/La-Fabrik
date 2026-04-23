export interface MapNode {
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface SceneData {
  mapNodes: MapNode[];
  models: Map<string, string>;
}

export type TransformMode = "translate" | "rotate" | "scale";

export interface ObjectTransform {
  uuid: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export interface SceneSnapshot {
  objects: ObjectTransform[];
}
