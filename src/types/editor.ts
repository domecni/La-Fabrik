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
