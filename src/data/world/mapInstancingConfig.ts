export const MAP_INSTANCING_ASSETS = {
  boiteauxlettres: {
    mapName: "boiteauxlettres",
    modelPath: "/models/boiteauxlettres/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  pylone: {
    mapName: "pylone",
    modelPath: "/models/pylone/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  immeuble1: {
    mapName: "immeuble1",
    modelPath: "/models/immeuble1/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  maison1: {
    mapName: "maison1",
    modelPath: "/models/maison1/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  eolienne: {
    mapName: "eolienne",
    modelPath: "/models/eolienne/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  parcebike: {
    mapName: "parcebike",
    modelPath: "/models/parcebike/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  panneauaffichage: {
    mapName: "panneauaffichage",
    modelPath: "/models/panneauaffichage/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  panneauclassique: {
    mapName: "panneauclassique",
    modelPath: "/models/panneauclassique/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  panneaufleche: {
    mapName: "panneaufleche",
    modelPath: "/models/panneaufleche/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  panneausolaire: {
    mapName: "panneausolaire",
    modelPath: "/models/panneausolaire/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
} as const;

export const MAP_INSTANCING_ASSET_TYPES = [
  "boiteauxlettres",
  "pylone",
  "immeuble1",
  "maison1",
  "eolienne",
  "parcebike",
  "panneauaffichage",
  "panneauclassique",
  "panneaufleche",
  "panneausolaire",
] as const satisfies readonly (keyof typeof MAP_INSTANCING_ASSETS)[];

export type MapInstancingAssetType =
  (typeof MAP_INSTANCING_ASSET_TYPES)[number];

export type MapInstancingAssetConfig =
  (typeof MAP_INSTANCING_ASSETS)[MapInstancingAssetType];
