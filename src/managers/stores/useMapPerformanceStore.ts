import { create } from "zustand";
import {
  MAP_PERFORMANCE_GROUP_NAMES,
  MAP_PERFORMANCE_MODEL_GROUPS,
  MAP_PERFORMANCE_MODEL_NAMES,
  type MapPerformanceGroupName,
  type MapPerformanceModelName,
} from "@/data/world/mapPerformanceConfig";

export {
  MAP_PERFORMANCE_GROUP_NAMES,
  MAP_PERFORMANCE_MODEL_NAMES,
  type MapPerformanceGroupName,
  type MapPerformanceModelName,
};

export interface MapPerformanceVisibility {
  groups: Record<MapPerformanceGroupName, boolean>;
  models: Record<MapPerformanceModelName, boolean>;
}

interface MapPerformanceActions {
  setGroupVisible: (group: MapPerformanceGroupName, visible: boolean) => void;
  setModelVisible: (model: MapPerformanceModelName, visible: boolean) => void;
  resetVisibility: () => void;
}

type MapPerformanceStore = MapPerformanceVisibility & MapPerformanceActions;

function createVisibleRecord<T extends string>(
  keys: readonly T[],
): Record<T, boolean> {
  return Object.fromEntries(keys.map((key) => [key, true])) as Record<
    T,
    boolean
  >;
}

function createDefaultVisibility(): MapPerformanceVisibility {
  return {
    groups: createVisibleRecord(MAP_PERFORMANCE_GROUP_NAMES),
    models: createVisibleRecord(MAP_PERFORMANCE_MODEL_NAMES),
  };
}

function isMapPerformanceModelName(
  name: string,
): name is MapPerformanceModelName {
  return (MAP_PERFORMANCE_MODEL_NAMES as readonly string[]).includes(name);
}

export function isMapModelVisible(
  name: string,
  visibility: MapPerformanceVisibility,
): boolean {
  if (!isMapPerformanceModelName(name)) return true;
  if (!visibility.models[name]) return false;

  return MAP_PERFORMANCE_MODEL_GROUPS[name].every(
    (group) => visibility.groups[group],
  );
}

export const useMapPerformanceStore = create<MapPerformanceStore>()((set) => ({
  ...createDefaultVisibility(),
  setGroupVisible: (group, visible) =>
    set((state) => ({
      groups: { ...state.groups, [group]: visible },
    })),
  setModelVisible: (model, visible) =>
    set((state) => ({
      models: { ...state.models, [model]: visible },
    })),
  resetVisibility: () => set(createDefaultVisibility()),
}));
