export const MAP_INSTANCING_ASSETS = {
  boiteauxlettres: {
    mapName: "boiteauxlettres",
    modelPath: "/models/boiteauxlettres/model.gltf",
    scaleMultiplier: 2,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  pylone: {
    mapName: "pylone",
    modelPath: "/models/pylone/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  immeuble1: {
    mapName: "immeuble1",
    modelPath: "/models/immeuble1/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  maison1: {
    mapName: "maison1",
    modelPath: "/models/maison1/model.gltf",
    scaleMultiplier: 3,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  eolienne: {
    mapName: "eolienne",
    modelPath: "/models/eolienne/model.gltf",
    scaleMultiplier: 0.85,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  parcebike: {
    mapName: "parcebike",
    modelPath: "/models/parcebike/model.gltf",
    scaleMultiplier: 2,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  panneauaffichage: {
    mapName: "panneauaffichage",
    modelPath: "/models/panneauaffichage/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  panneauclassique: {
    mapName: "panneauclassique",
    modelPath: "/models/panneauclassique/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  panneaufleche: {
    mapName: "panneaufleche",
    modelPath: "/models/panneaufleche/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  panneausolaire: {
    mapName: "panneausolaire",
    modelPath: "/models/panneausolaire/model.gltf",
    scaleMultiplier: 0.85,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
} as const;

const MAP_SINGLE_MODEL_SCALE_MULTIPLIERS = {
  ebike: 0.3,
} as const satisfies Record<string, number>;

export function getMapSingleModelScaleMultiplier(name: string): number {
  return (
    MAP_SINGLE_MODEL_SCALE_MULTIPLIERS[
      name as keyof typeof MAP_SINGLE_MODEL_SCALE_MULTIPLIERS
    ] ?? 1
  );
}

function getMapInstancedModelScaleMultiplier(name: string): number {
  return (
    Object.values(MAP_INSTANCING_ASSETS).find(
      (config) => config.mapName === name,
    )?.scaleMultiplier ?? 1
  );
}

export function getMapModelScaleMultiplier(name: string): number {
  return (
    getMapSingleModelScaleMultiplier(name) *
    getMapInstancedModelScaleMultiplier(name)
  );
}

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
