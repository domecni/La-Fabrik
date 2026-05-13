import { useWorldSettingsStore } from "@/managers/stores/useWorldSettingsStore";
import type { GraphicsState } from "@/data/world/graphicsConfig";

export function useGraphicsSettings(): GraphicsState {
  return useWorldSettingsStore((state) => state.graphics);
}

export function useSetGraphicsSettings(): (
  graphics: Partial<GraphicsState>
) => void {
  return useWorldSettingsStore((state) => state.setGraphics);
}

export function useDynamicGrass(): boolean {
  return useWorldSettingsStore((state) => state.graphics.dynamicGrass);
}

export function useDynamicTrees(): boolean {
  return useWorldSettingsStore((state) => state.graphics.dynamicTrees);
}

export function useDynamicClouds(): boolean {
  return useWorldSettingsStore((state) => state.graphics.dynamicClouds);
}

export function useShadowsEnabled(): boolean {
  return useWorldSettingsStore((state) => state.graphics.shadowsEnabled);
}

export function useGrassDensity(): number {
  return useWorldSettingsStore((state) => state.graphics.grassDensity);
}

export function useGraphicsSetters() {
  const setDynamicGrass = useWorldSettingsStore(
    (state) => state.setDynamicGrass
  );
  const setDynamicTrees = useWorldSettingsStore(
    (state) => state.setDynamicTrees
  );
  const setDynamicClouds = useWorldSettingsStore(
    (state) => state.setDynamicClouds
  );
  const setShadowsEnabled = useWorldSettingsStore(
    (state) => state.setShadowsEnabled
  );
  const setGrassDensity = useWorldSettingsStore(
    (state) => state.setGrassDensity
  );

  return {
    setDynamicGrass,
    setDynamicTrees,
    setDynamicClouds,
    setShadowsEnabled,
    setGrassDensity,
  };
}
