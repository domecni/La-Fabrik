import type { Vector3Tuple } from "@/types/three/three";

export type PersonnageId = "electricienne" | "gerant" | "fermier";

export interface PersonnageConfig {
  id: PersonnageId;
  label: string;
  modelPath: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  animations: readonly string[];
  defaultAnimation: string;
}

export const PERSONNAGE_CONFIGS = {
  electricienne: {
    id: "electricienne",
    label: "Electricienne",
    modelPath: "/models/electricienne-animated/model.gltf",
    position: [-40.5, 0, 45.5],
    rotation: [0, -0.35, 0],
    scale: [1, 1, 1],
    animations: ["Dance"],
    defaultAnimation: "Dance",
  },
  gerant: {
    id: "gerant",
    label: "Gerant",
    modelPath: "/models/gerant-animated/model.gltf",
    position: [45.2, 0, 45.5],
    rotation: [0, -1.55, 0],
    scale: [1, 1, 1],
    animations: ["idle", "walk"],
    defaultAnimation: "idle",
  },
  fermier: {
    id: "fermier",
    label: "Fermier",
    modelPath: "/models/fermier-animated/model.gltf",
    position: [-6.5, 0, -69.5],
    rotation: [0, -1.18, 0],
    scale: [1, 1, 1],
    animations: ["idle", "walk"],
    defaultAnimation: "idle",
  },
} satisfies Record<PersonnageId, PersonnageConfig>;

export const PERSONNAGE_IDS = [
  "electricienne",
  "gerant",
  "fermier",
] as const satisfies readonly PersonnageId[];
