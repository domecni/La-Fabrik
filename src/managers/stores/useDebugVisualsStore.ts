import { create } from "zustand";

interface DebugVisualsStore {
  showPlayerModel: boolean;
  setShowPlayerModel: (value: boolean) => void;
  showOctree: boolean;
  setShowOctree: (value: boolean) => void;
  octreeMaxDepth: number;
  setOctreeMaxDepth: (value: number) => void;
  octreeMinDepth: number;
  setOctreeMinDepth: (value: number) => void;
  octreeLeavesOnly: boolean;
  setOctreeLeavesOnly: (value: boolean) => void;
  octreeOpacity: number;
  setOctreeOpacity: (value: number) => void;
  octreeFabrikOnly: boolean;
  setOctreeFabrikOnly: (value: boolean) => void;
}

export const useDebugVisualsStore = create<DebugVisualsStore>((set) => ({
  showPlayerModel: false,
  setShowPlayerModel: (showPlayerModel) => set({ showPlayerModel }),
  showOctree: false,
  setShowOctree: (showOctree) => set({ showOctree }),
  octreeMaxDepth: 8,
  setOctreeMaxDepth: (octreeMaxDepth) => set({ octreeMaxDepth }),
  octreeMinDepth: 4,
  setOctreeMinDepth: (octreeMinDepth) => set({ octreeMinDepth }),
  octreeLeavesOnly: true,
  setOctreeLeavesOnly: (octreeLeavesOnly) => set({ octreeLeavesOnly }),
  octreeOpacity: 0.35,
  setOctreeOpacity: (octreeOpacity) => set({ octreeOpacity }),
  octreeFabrikOnly: false,
  setOctreeFabrikOnly: (octreeFabrikOnly) => set({ octreeFabrikOnly }),
}));
