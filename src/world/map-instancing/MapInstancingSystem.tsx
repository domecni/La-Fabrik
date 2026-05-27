import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CHUNK_CONFIG } from "@/data/world/fogConfig";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import {
  isMapModelVisible,
  useMapPerformanceStore,
} from "@/managers/stores/useMapPerformanceStore";
import { InstancedMapAsset } from "@/world/map-instancing/InstancedMapAsset";
import {
  MAP_INSTANCING_ASSETS,
  type MapInstancingAssetConfig,
  type MapInstancingAssetType,
} from "@/world/map-instancing/mapInstancingConfig";
import {
  type MapAssetInstance,
  useMapInstancingData,
} from "@/world/map-instancing/useMapInstancingData";

interface MapAssetChunk {
  key: string;
  config: MapInstancingAssetConfig;
  centerX: number;
  centerZ: number;
  instances: MapAssetInstance[];
}

function getChunkKey(instance: MapAssetInstance): string {
  const [x, , z] = instance.position;
  const chunkX = Math.floor(x / CHUNK_CONFIG.chunkSize);
  const chunkZ = Math.floor(z / CHUNK_CONFIG.chunkSize);
  return `${chunkX}:${chunkZ}`;
}

function createMapAssetChunks(
  type: MapInstancingAssetType,
  config: MapInstancingAssetConfig,
  instances: MapAssetInstance[],
): MapAssetChunk[] {
  const chunks = new Map<string, MapAssetInstance[]>();

  for (const instance of instances) {
    const key = getChunkKey(instance);
    const chunk = chunks.get(key);

    if (chunk) {
      chunk.push(instance);
    } else {
      chunks.set(key, [instance]);
    }
  }

  return [...chunks.entries()].map(([chunkKey, chunkInstances]) => {
    const center = chunkInstances.reduce(
      (sum, instance) => {
        sum.x += instance.position[0];
        sum.z += instance.position[2];
        return sum;
      },
      { x: 0, z: 0 },
    );

    return {
      key: `${type}:${chunkKey}`,
      config,
      centerX: center.x / chunkInstances.length,
      centerZ: center.z / chunkInstances.length,
      instances: chunkInstances,
    };
  });
}

export function MapInstancingSystem(): React.JSX.Element | null {
  const camera = useThree((state) => state.camera);
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
  const groups = useMapPerformanceStore((state) => state.groups);
  const models = useMapPerformanceStore((state) => state.models);
  const { data, isLoading } = useMapInstancingData();
  const lastUpdateRef = useRef(-CHUNK_CONFIG.updateInterval);
  const [activeChunkKeys, setActiveChunkKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const streamingEnabled =
    CHUNK_CONFIG.enabled && sceneMode === "game" && cameraMode === "player";

  const chunks = useMemo(() => {
    if (!data) return [];

    return Object.entries(MAP_INSTANCING_ASSETS).flatMap(([type, config]) => {
      if (
        !config.enabled ||
        !isMapModelVisible(config.mapName, { groups, models })
      ) {
        return [];
      }

      const instances = data.get(type as MapInstancingAssetType);
      if (!instances || instances.length === 0) return [];

      return createMapAssetChunks(
        type as MapInstancingAssetType,
        config,
        instances,
      );
    });
  }, [data, groups, models]);

  const visibleChunks = streamingEnabled
    ? chunks.filter((chunk) => {
        if (activeChunkKeys.size > 0) {
          return activeChunkKeys.has(chunk.key);
        }

        return (
          Math.hypot(
            chunk.centerX - camera.position.x,
            chunk.centerZ - camera.position.z,
          ) <= CHUNK_CONFIG.loadRadius
        );
      })
    : chunks;

  const updateActiveChunks = useCallback(() => {
    const nextKeys = new Set<string>();
    const cameraX = camera.position.x;
    const cameraZ = camera.position.z;

    for (const chunk of chunks) {
      const distance = Math.hypot(
        chunk.centerX - cameraX,
        chunk.centerZ - cameraZ,
      );
      const wasActive = activeChunkKeys.has(chunk.key);
      const radius = wasActive
        ? CHUNK_CONFIG.unloadRadius
        : CHUNK_CONFIG.loadRadius;

      if (distance <= radius) {
        nextKeys.add(chunk.key);
      }
    }

    if (
      nextKeys.size === activeChunkKeys.size &&
      [...nextKeys].every((key) => activeChunkKeys.has(key))
    ) {
      return;
    }

    setActiveChunkKeys(nextKeys);
  }, [activeChunkKeys, camera, chunks]);

  useFrame(({ clock }) => {
    if (!streamingEnabled) return;

    const now = clock.elapsedTime * 1000;
    if (now - lastUpdateRef.current < CHUNK_CONFIG.updateInterval) return;
    lastUpdateRef.current = now;

    updateActiveChunks();
  });

  if (isLoading || !data) {
    return null;
  }

  return (
    <group name="map-instancing-system">
      {visibleChunks.map((chunk) => (
        <Suspense key={chunk.key} fallback={null}>
          <InstancedMapAsset
            modelPath={chunk.config.modelPath}
            instances={chunk.instances}
            castShadow={chunk.config.castShadow}
            receiveShadow={chunk.config.receiveShadow}
          />
        </Suspense>
      ))}
    </group>
  );
}
