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
import { useMapInstancingData } from "@/hooks/world/useMapInstancingData";
import type { MapAssetInstance } from "@/types/map/mapScene";
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

export function MapInstancingSystem({
  onlyMapName = null,
  streaming = true,
}: MapInstancingSystemProps): React.JSX.Element | null {
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
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
            scaleMultiplier={chunk.config.scaleMultiplier}
            castShadow={chunk.config.castShadow}
            receiveShadow={chunk.config.receiveShadow}
          />
        </Suspense>
      ))}
    </group>
  );
}
