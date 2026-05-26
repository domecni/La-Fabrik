import { create } from "zustand";
import { CLOUD_DEFAULTS, type CloudState } from "@/data/world/cloudConfig";
import { WIND_DEFAULTS, type WindState } from "@/data/world/windConfig";
import {
  GRAPHICS_DEFAULTS,
  type GraphicsState,
} from "@/data/world/graphicsConfig";

interface WorldSettingsState {
  clouds: CloudState;
  wind: WindState;
  graphics: GraphicsState;
}

interface WorldSettingsActions {
  setClouds: (clouds: Partial<CloudState>) => void;
  setWind: (wind: Partial<WindState>) => void;
  setWindSpeed: (speed: number) => void;
  setWindDirection: (direction: number) => void;
  setWindStrength: (strength: number) => void;
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
  wind: { ...WIND_DEFAULTS },
  graphics: { ...GRAPHICS_DEFAULTS },
};

export const useWorldSettingsStore = create<WorldSettingsStore>()((set) => ({
  ...DEFAULT_STATE,

  setClouds: (cloudsUpdate) =>
    set((state) => ({
      clouds: { ...state.clouds, ...cloudsUpdate },
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
