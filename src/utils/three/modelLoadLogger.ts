import { logger } from "@/utils/core/Logger";
import type { Vector3Scale, Vector3Tuple } from "@/types/three/three";

export interface ModelLoadLogContext {
  modelPath: string;
  scope: string;
  position?: Vector3Tuple | undefined;
  rotation?: Vector3Tuple | undefined;
  scale?: Vector3Scale | undefined;
}

interface LoadedModelInfo {
  scene: {
    name: string;
  };
  animations: Array<{
    name: string;
  }>;
}

function getModelLoadHint(error: Error): string | undefined {
  const message = error.message.toLowerCase();

  if (
    message.includes("unexpected token 'v'") ||
    message.includes("version https://git-lfs") ||
    message.includes("git-lfs")
  ) {
    return "This file looks like a Git LFS pointer instead of a real GLTF asset. Run `git lfs pull` or replace the asset.";
  }

  if (message.includes("couldn't load texture")) {
    return "A texture referenced by the GLTF could not be loaded. Check file names, casing, and paths next to the model.";
  }

  return undefined;
}

export function logModelLoadSuccess(
  context: ModelLoadLogContext,
  gltf: LoadedModelInfo,
): void {
  logger.debug("ModelLoader", "Model loaded", {
    modelPath: context.modelPath,
    scope: context.scope,
    position: context.position,
    rotation: context.rotation,
    scale: context.scale,
    sceneName: gltf.scene.name || null,
    animations: gltf.animations.map((animation) => animation.name),
    animationCount: gltf.animations.length,
  });
}

export function logModelLoadError(
  context: ModelLoadLogContext,
  error: Error,
): void {
  logger.error("ModelLoader", "Model failed to load", {
    modelPath: context.modelPath,
    scope: context.scope,
    position: context.position,
    rotation: context.rotation,
    scale: context.scale,
    reason: error.message,
    hint: getModelLoadHint(error),
  });
}
