import { GRAPHICS_PRESETS } from "@/data/world/graphicsConfig";
import type {
  GraphicsPreset,
  GraphicsPresetConfig,
} from "@/data/world/graphicsConfig";
import { useWorldSettingsStore } from "@/managers/stores/useWorldSettingsStore";

export function useGraphicsPreset(): GraphicsPreset {
  return useWorldSettingsStore((state) => state.graphics.preset);
}

export function useGraphicsPresetConfig(): GraphicsPresetConfig {
  return useWorldSettingsStore(
    (state) => GRAPHICS_PRESETS[state.graphics.preset],
  );
}

export function useDynamicGrass(): boolean {
  return useWorldSettingsStore((state) => state.graphics.dynamicGrass);
}

export function useDynamicClouds(): boolean {
  return useWorldSettingsStore((state) => state.graphics.dynamicClouds);
}

export function useGrassDensity(): number {
  return useWorldSettingsStore((state) => state.graphics.grassDensity);
}
