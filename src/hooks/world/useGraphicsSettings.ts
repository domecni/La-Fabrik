import { useWorldSettingsStore } from "@/managers/stores/useWorldSettingsStore";

export function useDynamicGrass(): boolean {
  return useWorldSettingsStore((state) => state.graphics.dynamicGrass);
}

export function useDynamicClouds(): boolean {
  return useWorldSettingsStore((state) => state.graphics.dynamicClouds);
}

export function useGrassDensity(): number {
  return useWorldSettingsStore((state) => state.graphics.grassDensity);
}
