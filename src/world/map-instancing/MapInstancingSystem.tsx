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
import { InstancedMapAsset } from "@/world/map-instancing/InstancedMapAsset";
import {
  MAP_INSTANCING_ASSETS,
  MAP_INSTANCING_ASSET_TYPES,
  type MapInstancingAssetConfig,
  type MapInstancingAssetType,
} from "@/data/world/mapInstancingConfig";
import { useMapInstancingData } from "@/hooks/world/useMapInstancingData";
import type { MapAssetInstance } from "@/types/map/mapScene";
import type { GraphicsPreset } from "@/data/world/graphicsConfig";
import { createWorldInstanceChunks } from "@/utils/world/chunkInstances";

interface MapInstancingSystemProps {
  onlyMapName?: string | null;
  streaming?: boolean;
}

interface MapAssetChunk {
  key: string;
  config: MapInstancingAssetConfig;
  centerX: number;
  centerZ: number;
  instances: MapAssetInstance[];
}

function createMapAssetChunks(
  type: MapInstancingAssetType,
  config: MapInstancingAssetConfig,
  instances: MapAssetInstance[],
): MapAssetChunk[] {
  return createWorldInstanceChunks(instances).map((chunk) => {
    return {
      key: `${type}:${chunk.chunkKey}`,
      config,
      centerX: chunk.centerX,
      centerZ: chunk.centerZ,
      instances: chunk.instances,
    };
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

function getNearestChunkInstanceDistance(
  chunk: MapAssetChunk,
  cameraX: number,
  cameraZ: number,
): number {
  return chunk.instances.reduce((nearestDistance, instance) => {
    const distance = Math.hypot(
      instance.position[0] - cameraX,
      instance.position[2] - cameraZ,
    );

    return Math.min(nearestDistance, distance);
  }, Number.POSITIVE_INFINITY);
}

function useChunkModelPaths(
  chunks: readonly MapAssetChunk[],
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
    const nextModelPaths = new Map<string, string>();

    for (const chunk of chunks) {
      const distance = getNearestChunkInstanceDistance(chunk, cameraX, cameraZ);
      const modelPath = selectMapModelPathByDistance({
        distance,
        modelName: chunk.config.mapName,
        modelPath: chunk.config.modelPath,
        preset,
      });

      nextModelPaths.set(chunk.key, modelPath);
    }

    if (areChunkModelPathsEqual(nextModelPaths, modelPathsRef.current)) return;

    modelPathsRef.current = nextModelPaths;
    setModelPaths(nextModelPaths);
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

export function MapInstancingSystem({
  onlyMapName = null,
  streaming = true,
}: MapInstancingSystemProps): React.JSX.Element | null {
  const camera = useThree((state) => state.camera);
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
  const graphicsPreset = useGraphicsPreset();
  const graphicsPresetConfig = useGraphicsPresetConfig();
  const groups = useMapPerformanceStore((state) => state.groups);
  const models = useMapPerformanceStore((state) => state.models);
  const { data, isLoading } = useMapInstancingData();
  const streamingEnabled =
    streaming &&
    CHUNK_CONFIG.enabled &&
    sceneMode === "game" &&
    cameraMode === "player";

  const chunks = useMemo(() => {
    if (!data) return [];

    return MAP_INSTANCING_ASSET_TYPES.flatMap((type) => {
      const config = MAP_INSTANCING_ASSETS[type];

      if (onlyMapName && config.mapName !== onlyMapName) return [];

      if (
        !config.enabled ||
        !isMapModelVisible(config.mapName, { groups, models })
      ) {
        return [];
      }

      const instances = data.get(type);
      if (!instances || instances.length === 0) return [];

      return createMapAssetChunks(type, config, instances);
    });
  }, [data, groups, models, onlyMapName]);

  const visibleChunks = useVisibleWorldChunks(chunks, streamingEnabled, {
    loadRadius: graphicsPresetConfig.chunkLoadRadius,
    unloadRadius: graphicsPresetConfig.chunkUnloadRadius,
  });
  const chunkModelPaths = useChunkModelPaths(visibleChunks, graphicsPreset);
  const getChunkModelPath = useCallback(
    (chunk: MapAssetChunk): string => {
      const cachedModelPath = chunkModelPaths.get(chunk.key);
      if (cachedModelPath) return cachedModelPath;

      return selectMapModelPathByDistance({
        distance: getNearestChunkInstanceDistance(
          chunk,
          camera.position.x,
          camera.position.z,
        ),
        modelName: chunk.config.mapName,
        modelPath: chunk.config.modelPath,
        preset: graphicsPreset,
      });
    },
    [camera, chunkModelPaths, graphicsPreset],
  );

  if (isLoading || !data) {
    return null;
  }

  return (
    <group name="map-instancing-system">
      {visibleChunks.map((chunk) => {
        const modelPath = getChunkModelPath(chunk);

        return (
          <Suspense key={`${chunk.key}:${modelPath}`} fallback={null}>
            <InstancedMapAsset
              modelPath={modelPath}
              instances={chunk.instances}
              scaleMultiplier={chunk.config.scaleMultiplier}
              castShadow={chunk.config.castShadow}
              receiveShadow={chunk.config.receiveShadow}
            />
          </Suspense>
        );
      })}
    </group>
  );
}
