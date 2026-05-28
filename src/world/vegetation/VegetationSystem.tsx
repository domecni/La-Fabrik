import { Suspense, useMemo } from "react";
import { CHUNK_CONFIG } from "@/data/world/chunkStreamingConfig";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
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
import { createWorldInstanceChunks } from "@/utils/world/chunkInstances";

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

export function VegetationSystem({
  onlyMapName = null,
  streaming = true,
}: VegetationSystemProps): React.JSX.Element | null {
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
  const groups = useMapPerformanceStore((state) => state.groups);
  const models = useMapPerformanceStore((state) => state.models);
  const { data, isLoading } = useVegetationData();
  const streamingEnabled =
    streaming &&
    CHUNK_CONFIG.enabled &&
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

      return createVegetationChunks(type, entry.instances);
    });
  }, [data, groups, models, onlyMapName]);

  const visibleChunks = useVisibleWorldChunks(chunks, streamingEnabled);

  if (isLoading || !data) {
    return null;
  }

  return (
    <group name="vegetation-system">
      {visibleChunks.map((chunk) => (
        <Suspense key={chunk.key} fallback={null}>
          <InstancedVegetation
            modelPath={chunk.modelPath}
            instances={chunk.instances}
            scaleMultiplier={chunk.scaleMultiplier}
            castShadow={chunk.castShadow}
            receiveShadow={chunk.receiveShadow}
            windStrength={chunk.windStrength}
            rotationOffset={chunk.rotationOffset}
          />
        </Suspense>
      ))}
    </group>
  );
}
