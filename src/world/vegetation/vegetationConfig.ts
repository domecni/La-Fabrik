export const VEGETATION_LOD = {
  windAnimationRadius: 70,
  windFadeStart: 50,
  windFadeEnd: 70,
};

export const VEGETATION_TYPES = {
  buissons: {
    mapName: "buisson",
    modelPath: "/models/buisson/model.gltf",
    scaleMultiplier: 2,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  sapin: {
    mapName: "sapin",
    modelPath: "/models/sapin/model.gltf",
    scaleMultiplier: 2,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  arbre: {
    mapName: "arbre",
    modelPath: "/models/arbre/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  champdeble: {
    mapName: "champdeble",
    modelPath: "/models/champdeble/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  champdesoja: {
    mapName: "champdesoja",
    modelPath: "/models/champdesoja/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
  champsdetournesol: {
    mapName: "champsdetournesol",
    modelPath: "/models/champsdetournesol/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    enabled: true,
  },
} as const;

export type VegetationType = keyof typeof VEGETATION_TYPES;

export const INSTANCED_MAP_EXCEPTIONS = new Set([
  "Scene",
  "blocking",
  "terrain",
]);
