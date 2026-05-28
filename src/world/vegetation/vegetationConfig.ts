export const VEGETATION_TYPES = {
  buissons: {
    mapName: "buisson",
    modelPath: "/models/buisson/model.gltf",
    scaleMultiplier: 2,
    castShadow: true,
    receiveShadow: true,
    windStrength: 0.08,
    enabled: true,
  },
  sapin: {
    mapName: "sapin",
    modelPath: "/models/sapin/model.gltf",
    scaleMultiplier: 5,
    castShadow: true,
    receiveShadow: true,
    windStrength: 0.04,
    enabled: true,
  },
  arbre: {
    mapName: "arbre",
    modelPath: "/models/arbre/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    windStrength: 0.06,
    enabled: true,
  },
  champdeble: {
    mapName: "champdeble",
    modelPath: "/models/champdeble/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    windStrength: 0.18,
    enabled: true,
  },
  champdesoja: {
    mapName: "champdesoja",
    modelPath: "/models/champdesoja/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    windStrength: 0.16,
    enabled: true,
  },
  champsdetournesol: {
    mapName: "champsdetournesol",
    modelPath: "/models/champsdetournesol/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    windStrength: 0.14,
    enabled: true,
  },
} as const;

export const VEGETATION_TYPE_KEYS = [
  "buissons",
  "sapin",
  "arbre",
  "champdeble",
  "champdesoja",
  "champsdetournesol",
] as const satisfies readonly (keyof typeof VEGETATION_TYPES)[];

export type VegetationType = (typeof VEGETATION_TYPE_KEYS)[number];

export const INSTANCED_MAP_EXCEPTIONS = new Set([
  "Scene",
  "blocking",
  "terrain",
]);
