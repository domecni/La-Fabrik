export const VEGETATION_TYPES = {
  buissons: {
    mapName: "buisson",
    modelPath: "/models/buisson/model.gltf",
    scaleMultiplier: 1.5,
    castShadow: true,
    receiveShadow: true,
    windStrength: 0.06,
    rotationOffset: [0, 0, 0],
    enabled: true,
  },
  sapin: {
    mapName: "sapin",
    modelPath: "/models/sapin/model.gltf",
    scaleMultiplier: 4,
    castShadow: true,
    receiveShadow: true,
    windStrength: 0.12,
    rotationOffset: [0, 0, 0],
    enabled: true,
  },
  arbre: {
    mapName: "arbre",
    modelPath: "/models/arbre/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    windStrength: 0.15,
    rotationOffset: [0, 0, 0],
    enabled: true,
  },
  champdeble: {
    mapName: "champdeble",
    modelPath: "/models/champdeble/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    windStrength: 0.15,
    rotationOffset: [0, 0, 0],
    enabled: true,
  },
  champdesoja: {
    mapName: "champdesoja",
    modelPath: "/models/champdesoja/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    windStrength: 0.15,
    rotationOffset: [0, 0, 0],
    enabled: true,
  },
  champsdetournesol: {
    mapName: "champsdetournesol",
    modelPath: "/models/champsdetournesol/model.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    windStrength: 0.15,
    rotationOffset: [0, 0, 0],
    enabled: true,
  },
  potager: {
    mapName: "potager",
    modelPath: "/models/potager/potager.gltf",
    scaleMultiplier: 1,
    castShadow: true,
    receiveShadow: true,
    windStrength: 0,
    rotationOffset: [0, 0, 0],
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
  "potager",
] as const satisfies readonly (keyof typeof VEGETATION_TYPES)[];

export type VegetationType = (typeof VEGETATION_TYPE_KEYS)[number];

export function getVegetationModelScaleMultiplier(name: string): number {
  return (
    Object.values(VEGETATION_TYPES).find((config) => config.mapName === name)
      ?.scaleMultiplier ?? 1
  );
}

export const VEGETATION_INSTANCE_EXCLUDED_NODE_NAMES = new Set([
  "Scene",
  "blocking",
  "terrain",
]);
