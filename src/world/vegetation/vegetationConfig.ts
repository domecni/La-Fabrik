export const VEGETATION_LOD = {
  windAnimationRadius: 70,
  windFadeStart: 50,
  windFadeEnd: 70,
};

export const VEGETATION_MAX_INSTANCES = 500;

export const VEGETATION_TYPES = {
  buissons: {
    mapName: "buissons",
    modelPath: "/models/buisson/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: false,
    windEnabled: false,
    windIntensity: 1.2,
  },
  sapin: {
    mapName: "sapin",
    modelPath: "/models/sapin/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: true,
    windEnabled: false,
    windIntensity: 0.6,
  },
  arbre: {
    mapName: "arbre",
    modelPath: "/models/arbre/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: true,
    windEnabled: false,
    windIntensity: 0.8,
  },
  champdeble: {
    mapName: "champdeble",
    modelPath: "/models/champdeble/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: false,
    windEnabled: false,
    windIntensity: 1.0,
  },
  champdesoja: {
    mapName: "champdesoja",
    modelPath: "/models/champdesoja/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: false,
    windEnabled: false,
    windIntensity: 1.0,
  },
  champsdetournesol: {
    mapName: "champsdetournesol",
    modelPath: "/models/champsdetournesol/model.gltf",
    castShadow: true,
    receiveShadow: true,
    enabled: false,
    windEnabled: false,
    windIntensity: 0.9,
  },
} as const;

export type VegetationType = keyof typeof VEGETATION_TYPES;
export type VegetationConfig = (typeof VEGETATION_TYPES)[VegetationType];
