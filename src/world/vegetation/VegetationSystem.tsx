import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CHUNK_CONFIG } from "@/data/world/chunkStreamingConfig";
import { selectMapModelPathByDistance } from "@/data/world/mapLodConfig";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import {
  useGraphicsPreset,
  useGraphicsPresetConfig,
} from "@/hooks/world/useGraphicsSettings";
import { useVisibleWorldChunks } from "@/hooks/world/useVisibleWorldChunks";
import {
  isMapModelVisible,
  useMapPerformanceStore,
} from "@/managers/stores/useMapPerformanceStore";
import { InstancedVegetation } from "@/world/vegetation/InstancedVegetation";
import { useVegetationData } from "@/hooks/world/useVegetationData";
import type { VegetationInstance } from "@/types/map/mapScene";
import {
  VEGETATION_TYPE_KEYS,
  VEGETATION_TYPES,
  type VegetationType,
} from "@/data/world/vegetationConfig";
import { isInsideLaFabrikFootprint } from "@/data/world/laFabrikConfig";
import { createWorldInstanceChunks } from "@/utils/world/chunkInstances";
import type { GraphicsPreset } from "@/data/world/graphicsConfig";

interface VegetationSystemProps {
  onlyMapName?: string | null;
  streaming?: boolean;
}

interface VegetationChunk {
  key: string;
  type: VegetationType;
  modelPath: string;
  scaleMultiplier: number;
  castShadow: boolean;
  receiveShadow: boolean;
  windStrength: number;
  rotationOffset: readonly [number, number, number];
  centerX: number;
  centerZ: number;
  instances: VegetationInstance[];
}

function createVegetationChunks(
  type: VegetationType,
  instances: VegetationInstance[],
): VegetationChunk[] {
  const config = VEGETATION_TYPES[type];

  return createWorldInstanceChunks(instances).map((chunk) => {
    return {
      key: `${type}:${chunk.chunkKey}`,
      type,
      modelPath: config.modelPath,
      scaleMultiplier: config.scaleMultiplier,
      castShadow: config.castShadow,
      receiveShadow: config.receiveShadow,
      windStrength: config.windStrength,
      rotationOffset: config.rotationOffset,
      centerX: chunk.centerX,
      centerZ: chunk.centerZ,
      instances: chunk.instances,
    };
  });
}

function removeLaFabrikVegetation(
  instances: VegetationInstance[],
): VegetationInstance[] {
  return instances.filter((instance) => {
    const [x, , z] = instance.position;
    return !isInsideLaFabrikFootprint(x, z, 1.2);
  });
}

function areChunkModelPathsEqual(
  a: ReadonlyMap<string, string>,
  b: ReadonlyMap<string, string>,
): boolean {
  return (
    a.size === b.size && [...a].every(([key, value]) => b.get(key) === value)
  );
}

function useVegetationChunkModelPaths(
  chunks: readonly VegetationChunk[],
  preset: GraphicsPreset,
): ReadonlyMap<string, string> {
  const camera = useThree((state) => state.camera);
  const lastUpdateRef = useRef(-CHUNK_CONFIG.updateInterval);
  const modelPathsRef = useRef<Map<string, string>>(new Map());
  const [modelPaths, setModelPaths] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );

  const updateModelPaths = useCallback(() => {
    const cameraX = camera.position.x;
    const cameraZ = camera.position.z;
    const next = new Map<string, string>();

    for (const chunk of chunks) {
      const distance = Math.hypot(
        chunk.centerX - cameraX,
        chunk.centerZ - cameraZ,
      );
      const modelPath = selectMapModelPathByDistance({
        distance,
        modelName: VEGETATION_TYPES[chunk.type].mapName,
        modelPath: chunk.modelPath,
        preset,
      });
      next.set(chunk.key, modelPath);
    }

    if (areChunkModelPathsEqual(next, modelPathsRef.current)) return;

    modelPathsRef.current = next;
    setModelPaths(next);
  }, [camera, chunks, preset]);

  useEffect(() => {
    updateModelPaths();
  }, [updateModelPaths]);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime * 1000;
    if (now - lastUpdateRef.current < CHUNK_CONFIG.updateInterval) return;
    lastUpdateRef.current = now;

    updateModelPaths();
  });

  return modelPaths;
}

export function VegetationSystem({
  onlyMapName = null,
  streaming = true,
}: VegetationSystemProps): React.JSX.Element | null {
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
  const graphicsPresetKey = useGraphicsPreset();
  const graphicsPreset = useGraphicsPresetConfig();
  const groups = useMapPerformanceStore((state) => state.groups);
  const models = useMapPerformanceStore((state) => state.models);
  const { data, isLoading } = useVegetationData();
  const streamingEnabled =
    streaming &&
    CHUNK_CONFIG.enabled &&
    graphicsPreset.chunkStreamingEnabled &&
    sceneMode === "game" &&
    cameraMode === "player";

  const chunks = useMemo(() => {
    if (!data) return [];

    return VEGETATION_TYPE_KEYS.flatMap((type) => {
      const config = VEGETATION_TYPES[type];

      if (onlyMapName && config.mapName !== onlyMapName) return [];

      if (!config.enabled) return [];
      if (!isMapModelVisible(config.mapName, { groups, models })) return [];

      const entry = data.get(config.mapName);
      if (!entry || entry.instances.length === 0) return [];

      const instances = removeLaFabrikVegetation(entry.instances);
      if (instances.length === 0) return [];

      return createVegetationChunks(type, instances);
    });
  }, [data, groups, models, onlyMapName]);

  const visibleChunks = useVisibleWorldChunks(chunks, streamingEnabled, {
    loadRadius: graphicsPreset.chunkLoadRadius,
    unloadRadius: graphicsPreset.chunkUnloadRadius,
  });

  const chunkModelPaths = useVegetationChunkModelPaths(
    visibleChunks,
    graphicsPresetKey,
  );

  if (isLoading || !data) {
    return null;
  }

  return (
    <group name="vegetation-system">
      {visibleChunks.map((chunk) => {
        const modelPath = chunkModelPaths.get(chunk.key) ?? chunk.modelPath;
        return (
          <Suspense key={`${chunk.key}:${modelPath}`} fallback={null}>
            <InstancedVegetation
              modelPath={modelPath}
              instances={chunk.instances}
              scaleMultiplier={chunk.scaleMultiplier}
              castShadow={chunk.castShadow}
              receiveShadow={chunk.receiveShadow}
              windStrength={chunk.windStrength}
              rotationOffset={chunk.rotationOffset}
            />
          </Suspense>
        );
      })}
    </group>
  );
}
