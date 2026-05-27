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

export type MapInstancingAssetType = keyof typeof MAP_INSTANCING_ASSETS;

export type MapInstancingAssetConfig =
  (typeof MAP_INSTANCING_ASSETS)[MapInstancingAssetType];

export const MAP_INSTANCED_NODE_NAMES: ReadonlySet<string> = new Set(
  Object.values(MAP_INSTANCING_ASSETS)
    .filter((config) => config.enabled)
    .map((config) => config.mapName),
);

export function isInstancedMapNodeName(name: string): boolean {
  return MAP_INSTANCED_NODE_NAMES.has(name);
}
