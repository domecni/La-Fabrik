import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { useTerrainSurfaceData } from "@/hooks/world/useTerrainSurfaceData";
import {
  useDynamicGrass,
  useGrassDensity,
} from "@/hooks/world/useGraphicsSettings";
import type { TerrainSurfaceBounds } from "@/types/world/terrainSurface";
import { GRASS_CONFIG } from "@/world/grass/grassConfig";
import { GrassPatch } from "@/world/grass/GrassPatch";

interface GrassChunk {
  centerX: number;
  centerZ: number;
  key: string;
  x: number;
  z: number;
}

function getChunkRange(min: number, max: number): number[] {
  const start = Math.floor(min / GRASS_CONFIG.chunkSize);
  const end = Math.floor(max / GRASS_CONFIG.chunkSize);
  const chunks: number[] = [];

  for (let value = start; value <= end; value++) {
    chunks.push(value);
  }

  return chunks;
}

function createGrassChunks(bounds: TerrainSurfaceBounds): GrassChunk[] {
  const chunks: GrassChunk[] = [];
  const xChunks = getChunkRange(bounds.minX, bounds.maxX);
  const zChunks = getChunkRange(bounds.minZ, bounds.maxZ);

  for (const x of xChunks) {
    for (const z of zChunks) {
      chunks.push({
        centerX: x * GRASS_CONFIG.chunkSize + GRASS_CONFIG.chunkSize * 0.5,
        centerZ: z * GRASS_CONFIG.chunkSize + GRASS_CONFIG.chunkSize * 0.5,
        key: `${x}:${z}`,
        x,
        z,
      });
    }
  }

  return chunks;
}

export function GrassSystem(): React.JSX.Element | null {
  const camera = useThree((state) => state.camera);
  const terrainSurfaceData = useTerrainSurfaceData();
  const sceneMode = useSceneMode();
  const dynamicGrass = useDynamicGrass();
  const grassDensity = useGrassDensity();
  const lastUpdateRef = useRef(-GRASS_CONFIG.updateInterval);
  const [activeChunkKeys, setActiveChunkKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const density = Math.max(0, grassDensity);
  const chunks = useMemo(
    () =>
      terrainSurfaceData ? createGrassChunks(terrainSurfaceData.bounds) : [],
    [terrainSurfaceData],
  );
  const streamingEnabled = sceneMode === "game";

  const updateActiveChunks = useCallback(() => {
    const nextKeys = new Set<string>();

    for (const chunk of chunks) {
      const distance = Math.hypot(
        chunk.centerX - camera.position.x,
        chunk.centerZ - camera.position.z,
      );
      const wasActive = activeChunkKeys.has(chunk.key);
      const radius = wasActive
        ? GRASS_CONFIG.unloadRadius
        : GRASS_CONFIG.loadRadius;

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
    if (now - lastUpdateRef.current < GRASS_CONFIG.updateInterval) return;
    lastUpdateRef.current = now;

    updateActiveChunks();
  });

  if (
    !GRASS_CONFIG.enabled ||
    !dynamicGrass ||
    density <= 0 ||
    !terrainSurfaceData
  ) {
    return null;
  }

  const visibleChunks = streamingEnabled
    ? chunks.filter((chunk) => {
        if (activeChunkKeys.size > 0) {
          return activeChunkKeys.has(chunk.key);
        }

        return (
          Math.hypot(
            chunk.centerX - camera.position.x,
            chunk.centerZ - camera.position.z,
          ) <= GRASS_CONFIG.loadRadius
        );
      })
    : chunks;

  return (
    <group name="grass-system">
      {visibleChunks.map((chunk) => (
        <Suspense key={chunk.key} fallback={null}>
          <GrassPatch
            chunkX={chunk.x}
            chunkZ={chunk.z}
            density={density}
            terrainSurfaceData={terrainSurfaceData}
          />
        </Suspense>
      ))}
    </group>
  );
}
