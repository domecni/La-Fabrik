import { create } from "zustand";
import type { Vector3Tuple } from "@/types/three/three";

/**
 * Tracks whether a repair mini-game is currently in its "focused" phase
 * (fragmented / scanning / repairing / reassembling). When active, a dark
 * sphere expands around the repair model to visually isolate the player
 * from the rest of the map. The store also exposes the world-space center
 * of the bubble so map content can dim/hide content outside it if needed.
 */
interface RepairFocusStore {
  active: boolean;
  center: Vector3Tuple;
  setFocus: (active: boolean, center?: Vector3Tuple) => void;
}

export const useRepairFocusStore = create<RepairFocusStore>((set) => ({
  active: false,
  center: [0, 0, 0],
  setFocus: (active, center) =>
    set((state) => ({
      active,
      center: center ?? state.center,
    })),
}));
