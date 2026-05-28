import type { CinematicDefinition } from "@/types/cinematics/cinematics";

export type {
  HierarchicalMapNode,
  MapNode,
  SceneData,
} from "@/types/map/mapScene";

export type TransformMode = "translate" | "rotate" | "scale";

export interface EditorCinematicPreviewRequest {
  id: string;
  cinematic: CinematicDefinition;
}
