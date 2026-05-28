import { Suspense, useMemo } from "react";
import { CHUNK_CONFIG } from "@/data/world/chunkStreamingConfig";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
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
import {
  type MapAssetInstance,
  useMapInstancingData,
} from "@/hooks/world/useMapInstancingData";

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
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
  const groups = useMapPerformanceStore((state) => state.groups);
  const models = useMapPerformanceStore((state) => state.models);
  const { data, isLoading } = useMapInstancingData();
  const streamingEnabled =
    CHUNK_CONFIG.enabled && sceneMode === "game" && cameraMode === "player";

  const chunks = useMemo(() => {
    if (!data) return [];

    return MAP_INSTANCING_ASSET_TYPES.flatMap((type) => {
      const config = MAP_INSTANCING_ASSETS[type];

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
  }, [data, groups, models]);

  const visibleChunks = useVisibleWorldChunks(chunks, streamingEnabled);

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
