import { create } from "zustand";
import {
  CHARACTER_CONFIGS,
  CHARACTER_IDS,
  type CharacterId,
} from "@/data/world/characters/characterConfig";
import type { Vector3Tuple } from "@/types/three/three";

interface CharacterDebugState {
  animation: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
}

interface CharacterDebugStore {
  characters: Record<CharacterId, CharacterDebugState>;
  setAnimation: (id: CharacterId, animation: string) => void;
  setPosition: (id: CharacterId, axis: 0 | 1 | 2, value: number) => void;
  setRotation: (id: CharacterId, axis: 0 | 1 | 2, value: number) => void;
  setScale: (id: CharacterId, axis: 0 | 1 | 2, value: number) => void;
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

const initialCharacters = Object.fromEntries(
  CHARACTER_IDS.map((id) => {
    const config = CHARACTER_CONFIGS[id];

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
) as Record<CharacterId, CharacterDebugState>;

export const useCharacterDebugStore = create<CharacterDebugStore>((set) => ({
  characters: initialCharacters,
  setAnimation: (id, animation) =>
    set((state) => ({
      characters: {
        ...state.characters,
        [id]: { ...state.characters[id], animation },
      },
    })),
  setPosition: (id, axis, value) =>
    set((state) => ({
      characters: {
        ...state.characters,
        [id]: {
          ...state.characters[id],
          position: updateVector(state.characters[id].position, axis, value),
        },
      },
    })),
  setRotation: (id, axis, value) =>
    set((state) => ({
      characters: {
        ...state.characters,
        [id]: {
          ...state.characters[id],
          rotation: updateVector(state.characters[id].rotation, axis, value),
        },
      },
    })),
  setScale: (id, axis, value) =>
    set((state) => ({
      characters: {
        ...state.characters,
        [id]: {
          ...state.characters[id],
          scale: updateVector(state.characters[id].scale, axis, value),
        },
      },
    })),
}));
