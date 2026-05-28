import { create } from "zustand";

export type MapPerformanceGroupName =
  | "vegetation"
  | "crops"
  | "trees"
  | "buildings"
  | "landmarks"
  | "props"
  | "terrain"
  | "sky";

export type MapPerformanceModelName =
  | "buisson"
  | "arbre"
  | "sapin"
  | "champdeble"
  | "champdesoja"
  | "champsdetournesol"
  | "ecole"
  | "generateur"
  | "fermeverticale"
  | "lafabrik"
  | "immeuble1"
  | "eolienne"
  | "pylone"
  | "boiteauxlettres"
  | "maison1"
  | "panneauaffichage"
  | "panneauclassique"
  | "panneaufleche"
  | "panneausolaire"
  | "parcebike"
  | "terrain"
  | "sky";

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

export const MAP_PERFORMANCE_GROUP_NAMES: readonly MapPerformanceGroupName[] = [
  "vegetation",
  "crops",
  "trees",
  "buildings",
  "landmarks",
  "props",
  "terrain",
  "sky",
];

export const MAP_PERFORMANCE_MODEL_NAMES: readonly MapPerformanceModelName[] = [
  "buisson",
  "arbre",
  "sapin",
  "champdeble",
  "champdesoja",
  "champsdetournesol",
  "ecole",
  "generateur",
  "fermeverticale",
  "lafabrik",
  "immeuble1",
  "eolienne",
  "pylone",
  "boiteauxlettres",
  "maison1",
  "panneauaffichage",
  "panneauclassique",
  "panneaufleche",
  "panneausolaire",
  "parcebike",
  "terrain",
  "sky",
];

const MODEL_GROUPS: Record<
  MapPerformanceModelName,
  readonly MapPerformanceGroupName[]
> = {
  buisson: ["vegetation"],
  arbre: ["vegetation", "trees"],
  sapin: ["vegetation", "trees"],
  champdeble: ["vegetation", "crops"],
  champdesoja: ["vegetation", "crops"],
  champsdetournesol: ["vegetation", "crops"],
  ecole: ["buildings", "landmarks"],
  generateur: ["landmarks"],
  fermeverticale: ["buildings", "landmarks"],
  lafabrik: ["buildings", "landmarks"],
  immeuble1: ["buildings"],
  eolienne: ["props"],
  pylone: ["props"],
  boiteauxlettres: ["props"],
  maison1: ["buildings"],
  panneauaffichage: ["props"],
  panneauclassique: ["props"],
  panneaufleche: ["props"],
  panneausolaire: ["props"],
  parcebike: ["props"],
  terrain: ["terrain"],
  sky: ["sky"],
};

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

  return MODEL_GROUPS[name].every((group) => visibility.groups[group]);
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
