import { create } from "zustand";
import { CLOUD_DEFAULTS, type CloudState } from "@/data/world/cloudConfig";
import { FOG_CONFIG, type FogState } from "@/data/world/fogConfig";
import { WIND_DEFAULTS, type WindState } from "@/data/world/windConfig";
import {
  GRAPHICS_DEFAULTS,
  type GraphicsPreset,
  type GraphicsState,
} from "@/data/world/graphicsConfig";

interface WorldSettingsState {
  clouds: CloudState;
  fog: FogState;
  wind: WindState;
  graphics: GraphicsState;
}

interface WorldSettingsActions {
  setClouds: (clouds: Partial<CloudState>) => void;
  setFog: (fog: Partial<FogState>) => void;
  setWind: (wind: Partial<WindState>) => void;
  setWindSpeed: (speed: number) => void;
  setWindDirection: (direction: number) => void;
  setWindStrength: (strength: number) => void;
  setGraphicsPreset: (preset: GraphicsPreset) => void;
  setGraphics: (graphics: Partial<GraphicsState>) => void;
  setDynamicGrass: (enabled: boolean) => void;
  setDynamicTrees: (enabled: boolean) => void;
  setDynamicClouds: (enabled: boolean) => void;
  setShadowsEnabled: (enabled: boolean) => void;
  setGrassDensity: (density: number) => void;
  resetToDefaults: () => void;
}

type WorldSettingsStore = WorldSettingsState & WorldSettingsActions;

const DEFAULT_STATE: WorldSettingsState = {
  clouds: { ...CLOUD_DEFAULTS },
  fog: {
    density: FOG_CONFIG.density,
    far: FOG_CONFIG.far,
    mode: FOG_CONFIG.mode,
    near: FOG_CONFIG.near,
  },
  wind: { ...WIND_DEFAULTS },
  graphics: { ...GRAPHICS_DEFAULTS },
};

export const useWorldSettingsStore = create<WorldSettingsStore>()((set) => ({
  ...DEFAULT_STATE,

  setClouds: (cloudsUpdate) =>
    set((state) => ({
      clouds: { ...state.clouds, ...cloudsUpdate },
    })),

  setFog: (fogUpdate) =>
    set((state) => ({
      fog: { ...state.fog, ...fogUpdate },
    })),

  setWind: (windUpdate) =>
    set((state) => ({
      wind: { ...state.wind, ...windUpdate },
    })),

  setWindSpeed: (speed) =>
    set((state) => ({
      wind: { ...state.wind, speed },
    })),

  setWindDirection: (direction) =>
    set((state) => ({
      wind: { ...state.wind, direction },
    })),

  setWindStrength: (strength) =>
    set((state) => ({
      wind: { ...state.wind, strength },
    })),

  setGraphics: (graphicsUpdate) =>
    set((state) => ({
      graphics: { ...state.graphics, ...graphicsUpdate },
    })),

  setGraphicsPreset: (preset) =>
    set((state) => ({
      graphics: { ...state.graphics, preset },
    })),

  setDynamicGrass: (dynamicGrass) =>
    set((state) => ({
      graphics: { ...state.graphics, dynamicGrass },
    })),

  setDynamicTrees: (dynamicTrees) =>
    set((state) => ({
      graphics: { ...state.graphics, dynamicTrees },
    })),

  setDynamicClouds: (dynamicClouds) =>
    set((state) => ({
      graphics: { ...state.graphics, dynamicClouds },
    })),

  setShadowsEnabled: (shadowsEnabled) =>
    set((state) => ({
      graphics: { ...state.graphics, shadowsEnabled },
    })),

  setGrassDensity: (grassDensity) =>
    set((state) => ({
      graphics: { ...state.graphics, grassDensity },
    })),

  resetToDefaults: () => set(DEFAULT_STATE),
}));
