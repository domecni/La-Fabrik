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

export const MAP_PERFORMANCE_MODEL_GROUPS: Record<
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
