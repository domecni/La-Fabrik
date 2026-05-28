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
import {
  type VegetationInstance,
  useVegetationData,
} from "@/hooks/world/useVegetationData";
import {
  VEGETATION_TYPE_KEYS,
  VEGETATION_TYPES,
  type VegetationType,
} from "@/data/world/vegetationConfig";

interface VegetationChunk {
  key: string;
  type: VegetationType;
  modelPath: string;
  scaleMultiplier: number;
  castShadow: boolean;
  receiveShadow: boolean;
  windStrength: number;
  centerX: number;
  centerZ: number;
  instances: VegetationInstance[];
}

function getChunkKey(instance: VegetationInstance): string {
  const [x, , z] = instance.position;
  const chunkX = Math.floor(x / CHUNK_CONFIG.chunkSize);
  const chunkZ = Math.floor(z / CHUNK_CONFIG.chunkSize);
  return `${chunkX}:${chunkZ}`;
}

function createVegetationChunks(
  type: VegetationType,
  instances: VegetationInstance[],
): VegetationChunk[] {
  const config = VEGETATION_TYPES[type];
  const chunks = new Map<string, VegetationInstance[]>();

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
      type,
      modelPath: config.modelPath,
      scaleMultiplier: config.scaleMultiplier,
      castShadow: config.castShadow,
      receiveShadow: config.receiveShadow,
      windStrength: config.windStrength,
      centerX: center.x / chunkInstances.length,
      centerZ: center.z / chunkInstances.length,
      instances: chunkInstances,
    };
  });
}

export function VegetationSystem(): React.JSX.Element | null {
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
  const groups = useMapPerformanceStore((state) => state.groups);
  const models = useMapPerformanceStore((state) => state.models);
  const { data, isLoading } = useVegetationData();
  const streamingEnabled =
    CHUNK_CONFIG.enabled && sceneMode === "game" && cameraMode === "player";

  const chunks = useMemo(() => {
    if (!data) return [];

    return VEGETATION_TYPE_KEYS.flatMap((type) => {
      const config = VEGETATION_TYPES[type];

      if (!config.enabled) return [];
      if (!isMapModelVisible(config.mapName, { groups, models })) return [];

      const entry = data.get(config.mapName);
      if (!entry || entry.instances.length === 0) return [];

      return createVegetationChunks(type, entry.instances);
    });
  }, [data, groups, models]);

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
          />
        </Suspense>
      ))}
    </group>
  );
}
