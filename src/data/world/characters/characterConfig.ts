import type { Vector3Tuple } from "@/types/three/three";

export type CharacterId =
  | "electricienne"
  | "gerant"
  | "fermier"
  | "zone1_habitant1"
  | "zone1_habitant2"
  | "zone2_habitant1"
  | "zone2_habitant2"
  | "zone3_habitant1"
  | "zone3_habitant2";

export interface CharacterConfig {
  id: CharacterId;
  label: string;
  modelPath: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  animations: readonly string[];
  defaultAnimation: string;
  snapToTerrain?: boolean;
}

export const CHARACTER_CONFIGS = {
  electricienne: {
    id: "electricienne",
    label: "Electricienne",
    modelPath: "/models/electricienne-animated/model.gltf",
    position: [-40.5, 0, 45.5],
    rotation: [0, -0.35, 0],
    scale: [1.55, 1.55, 1.55],
    animations: ["Dance"],
    defaultAnimation: "Dance",
  },
  gerant: {
    id: "gerant",
    label: "Gerant",
    modelPath: "/models/gerant-animated/model.gltf",
    position: [58, 0, 62.5],
    rotation: [0, 1.83, 0],
    scale: [1.55, 1.55, 1.55],
    animations: ["idle", "walk"],
    defaultAnimation: "idle",
  },
  fermier: {
    id: "fermier",
    label: "Fermier",
    modelPath: "/models/fermier-animated/model.gltf",
    position: [-6.5, 0, -69.5],
    rotation: [0, -1.18, 0],
    scale: [1.55, 1.55, 1.55],
    animations: ["idle", "walk"],
    defaultAnimation: "idle",
  },
  zone1_habitant1: {
    id: "zone1_habitant1",
    label: "Zone 1 - Habitant 1",
    modelPath: "/models/habitant1-animated/model.gltf",
    position: [-43.64, 0, -16.72],
    rotation: [0, -1.23, 0],
    scale: [1.55, 1.55, 1.55],
    animations: ["idle", "walk"],
    defaultAnimation: "idle",
  },
  zone1_habitant2: {
    id: "zone1_habitant2",
    label: "Zone 1 - Habitant 2",
    modelPath: "/models/habitant2-animated/model.gltf",
    position: [-43.46, 0, -4.93],
    rotation: [0, -2.42, 0],
    scale: [1.55, 1.55, 1.55],
    animations: ["idle", "walk"],
    defaultAnimation: "idle",
  },
  zone2_habitant1: {
    id: "zone2_habitant1",
    label: "Zone 2 - Habitant 1",
    modelPath: "/models/habitant1-animated/model.gltf",
    position: [-3.41, 0, 73.01],
    rotation: [0, 1.97, 0],
    scale: [1.55, 1.55, 1.55],
    animations: ["idle", "walk"],
    defaultAnimation: "idle",
  },
  zone2_habitant2: {
    id: "zone2_habitant2",
    label: "Zone 2 - Habitant 2",
    modelPath: "/models/habitant2-animated/model.gltf",
    position: [-2.22, 0, 60.59],
    rotation: [0, 0.86, 0],
    scale: [1.55, 1.55, 1.55],
    animations: ["idle", "walk"],
    defaultAnimation: "idle",
  },
  zone3_habitant1: {
    id: "zone3_habitant1",
    label: "Zone 3 - Habitant 1",
    modelPath: "/models/habitant1-animated/model.gltf",
    position: [82.52, 0, -29.01],
    rotation: [0, -0.89, 0],
    scale: [1.55, 1.55, 1.55],
    animations: ["idle", "walk"],
    defaultAnimation: "idle",
  },
  zone3_habitant2: {
    id: "zone3_habitant2",
    label: "Zone 3 - Habitant 2",
    modelPath: "/models/habitant2-animated/model.gltf",
    position: [92.95, 0, -18.1],
    rotation: [0, -1.59, 0],
    scale: [1.55, 1.55, 1.55],
    animations: ["idle", "walk"],
    defaultAnimation: "idle",
  },
} satisfies Record<CharacterId, CharacterConfig>;

export const CHARACTER_IDS = [
  "electricienne",
  "gerant",
  "fermier",
  "zone1_habitant1",
  "zone1_habitant2",
  "zone2_habitant1",
  "zone2_habitant2",
  "zone3_habitant1",
  "zone3_habitant2",
] as const satisfies readonly CharacterId[];
