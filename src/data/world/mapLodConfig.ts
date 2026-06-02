import {
  GRAPHICS_PRESETS,
  type GraphicsPreset,
} from "@/data/world/graphicsConfig";

export const MAP_LOD_MODEL_PATHS = {
  ebike: "/models/ebike-LOD/model.gltf",
  eolienne: "/models/eolienne-LOD/model.gltf",
  pylone: "/models/pylone-LOD/model.gltf",
  boiteimmeuble: "/models/boiteimmeuble-LOD/model.gltf",
  ecole: "/models/ecole-LOD/model.gltf",
  immeuble1: "/models/immeuble1-LOD/model.gltf",
  lafabrik: "/models/lafabrik-LOD/model.gltf",
  maison1: "/models/maison1-LOD/model.gltf",
  panneauaffichage: "/models/panneauaffichage-LOD/model.gltf",
  arbre: "/models/arbre-LOD/model.glb",
  buisson: "/models/buisson-LOD/model.glb",
  sapin: "/models/sapin-LOD/model.glb",
} as const satisfies Record<string, string>;

export function getMapLodModelPath(modelName: string): string | null {
  return (
    MAP_LOD_MODEL_PATHS[modelName as keyof typeof MAP_LOD_MODEL_PATHS] ?? null
  );
}

export const MAP_LOD_SCALE_MULTIPLIERS = {
  sapin: 0.35,
  buisson: 0.7,
} as const satisfies Partial<Record<keyof typeof MAP_LOD_MODEL_PATHS, number>>;

export function getMapLodScaleMultiplier(modelName: string): number {
  return (
    MAP_LOD_SCALE_MULTIPLIERS[
      modelName as keyof typeof MAP_LOD_SCALE_MULTIPLIERS
    ] ?? 1
  );
}

export function selectMapModelPathByDistance({
  distance,
  modelName,
  modelPath,
  preset,
}: {
  distance: number;
  modelName: string;
  modelPath: string;
  preset: GraphicsPreset;
}): string {
  const lodModelPath = getMapLodModelPath(modelName);
  if (!lodModelPath) return modelPath;

  const presetConfig = GRAPHICS_PRESETS[preset];
  if (presetConfig.forceLodModels) return lodModelPath;

  return distance <= presetConfig.lodHighDetailDistance
    ? modelPath
    : lodModelPath;
}
