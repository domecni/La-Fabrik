import { create } from "zustand";
import {
  PERSONNAGE_CONFIGS,
  PERSONNAGE_IDS,
  type PersonnageId,
} from "@/data/world/personnages/personnageConfig";
import type { Vector3Tuple } from "@/types/three/three";

interface PersonnageDebugState {
  animation: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
}

interface PersonnageDebugStore {
  personnages: Record<PersonnageId, PersonnageDebugState>;
  setAnimation: (id: PersonnageId, animation: string) => void;
  setPosition: (id: PersonnageId, axis: 0 | 1 | 2, value: number) => void;
  setRotation: (id: PersonnageId, axis: 0 | 1 | 2, value: number) => void;
  setScale: (id: PersonnageId, axis: 0 | 1 | 2, value: number) => void;
}

function updateVector(
  vector: Vector3Tuple,
  axis: 0 | 1 | 2,
  value: number,
): Vector3Tuple {
  const next: Vector3Tuple = [...vector];
  next[axis] = value;
  return next;
}

const initialPersonnages = Object.fromEntries(
  PERSONNAGE_IDS.map((id) => {
    const config = PERSONNAGE_CONFIGS[id];

    return [
      id,
      {
        animation: config.defaultAnimation,
        position: [...config.position],
        rotation: [...config.rotation],
        scale: [...config.scale],
      },
    ];
  }),
) as Record<PersonnageId, PersonnageDebugState>;

export const usePersonnageDebugStore = create<PersonnageDebugStore>((set) => ({
  personnages: initialPersonnages,
  setAnimation: (id, animation) =>
    set((state) => ({
      personnages: {
        ...state.personnages,
        [id]: { ...state.personnages[id], animation },
      },
    })),
  setPosition: (id, axis, value) =>
    set((state) => ({
      personnages: {
        ...state.personnages,
        [id]: {
          ...state.personnages[id],
          position: updateVector(state.personnages[id].position, axis, value),
        },
      },
    })),
  setRotation: (id, axis, value) =>
    set((state) => ({
      personnages: {
        ...state.personnages,
        [id]: {
          ...state.personnages[id],
          rotation: updateVector(state.personnages[id].rotation, axis, value),
        },
      },
    })),
  setScale: (id, axis, value) =>
    set((state) => ({
      personnages: {
        ...state.personnages,
        [id]: {
          ...state.personnages[id],
          scale: updateVector(state.personnages[id].scale, axis, value),
        },
      },
    })),
}));
