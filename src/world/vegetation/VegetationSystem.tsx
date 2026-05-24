import { Suspense, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CHUNK_CONFIG } from "@/data/world/fogConfig";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import {
  isMapModelVisible,
  useMapPerformanceStore,
} from "@/managers/stores/useMapPerformanceStore";
import { InstancedVegetation } from "@/world/vegetation/InstancedVegetation";
import {
  type VegetationInstance,
  useVegetationData,
} from "@/world/vegetation/useVegetationData";
import {
  VEGETATION_TYPES,
  type VegetationType,
} from "@/world/vegetation/vegetationConfig";

interface VegetationChunk {
  key: string;
  type: VegetationType;
  modelPath: string;
  castShadow: boolean;
  receiveShadow: boolean;
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
      castShadow: config.castShadow,
      receiveShadow: config.receiveShadow,
      centerX: center.x / chunkInstances.length,
      centerZ: center.z / chunkInstances.length,
      instances: chunkInstances,
    };
  });
}

export function VegetationSystem(): React.JSX.Element | null {
  const camera = useThree((state) => state.camera);
  const cameraMode = useCameraMode();
  const sceneMode = useSceneMode();
  const groups = useMapPerformanceStore((state) => state.groups);
  const models = useMapPerformanceStore((state) => state.models);
  const { data, isLoading } = useVegetationData();
  const lastUpdateRef = useRef(-CHUNK_CONFIG.updateInterval);
  const [activeChunkKeys, setActiveChunkKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const streamingEnabled =
    CHUNK_CONFIG.enabled && sceneMode === "game" && cameraMode === "player";

  const chunks = useMemo(() => {
    if (!data) return [];

    return Object.entries(VEGETATION_TYPES).flatMap(([type, config]) => {
      if (!config.enabled) return [];
      if (!isMapModelVisible(config.mapName, { groups, models })) return [];

      const entry = data.get(config.mapName);
      if (!entry || entry.instances.length === 0) return [];

      return createVegetationChunks(type as VegetationType, entry.instances);
    });
  }, [data, groups, models]);

  useFrame(({ clock }) => {
    if (!streamingEnabled) return;

    const now = clock.elapsedTime * 1000;
    if (now - lastUpdateRef.current < CHUNK_CONFIG.updateInterval) return;
    lastUpdateRef.current = now;

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
  });

  if (isLoading || !data) {
    return null;
  }

  const visibleChunks = streamingEnabled
    ? chunks.filter((chunk) => activeChunkKeys.has(chunk.key))
    : chunks;

  return (
    <group name="vegetation-system">
      {visibleChunks.map((chunk) => (
        <Suspense key={chunk.key} fallback={null}>
          <InstancedVegetation
            modelPath={chunk.modelPath}
            instances={chunk.instances}
            castShadow={chunk.castShadow}
            receiveShadow={chunk.receiveShadow}
          />
        </Suspense>
      ))}
    </group>
  );
}
