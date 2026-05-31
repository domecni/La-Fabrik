import type { Vector3Tuple } from "@/types/three/three";

export type CharacterId = "electricienne" | "gerant" | "fermier";

export interface CharacterConfig {
  id: CharacterId;
  label: string;
  modelPath: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  animations: readonly string[];
  defaultAnimation: string;
}

export const CHARACTER_CONFIGS = {
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
    position: [59.5, 0, 64.64],
    rotation: [0, 2.41, 0],
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
} satisfies Record<CharacterId, CharacterConfig>;

export const CHARACTER_IDS = [
  "electricienne",
  "gerant",
  "fermier",
] as const satisfies readonly CharacterId[];
