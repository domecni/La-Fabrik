import { useCallback, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CHUNK_CONFIG } from "@/data/world/chunkStreamingConfig";

export interface WorldChunkLike {
  centerX: number;
  centerZ: number;
  key: string;
}

function areSetsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  return a.size === b.size && [...a].every((key) => b.has(key));
}

export function useVisibleWorldChunks<TChunk extends WorldChunkLike>(
  chunks: readonly TChunk[],
  streamingEnabled: boolean,
): readonly TChunk[] {
  const camera = useThree((state) => state.camera);
  const lastUpdateRef = useRef(-CHUNK_CONFIG.updateInterval);
  const activeChunkKeysRef = useRef<Set<string>>(new Set());
  const [activeChunkKeys, setActiveChunkKeys] = useState<Set<string>>(
    () => new Set(),
  );

  const updateActiveChunks = useCallback(() => {
    const nextKeys = new Set<string>();
    const cameraX = camera.position.x;
    const cameraZ = camera.position.z;

    for (const chunk of chunks) {
      const distance = Math.hypot(
        chunk.centerX - cameraX,
        chunk.centerZ - cameraZ,
      );
      const wasActive = activeChunkKeysRef.current.has(chunk.key);
      const radius = wasActive
        ? CHUNK_CONFIG.unloadRadius
        : CHUNK_CONFIG.loadRadius;

      if (distance <= radius) {
        nextKeys.add(chunk.key);
      }
    }

    if (areSetsEqual(nextKeys, activeChunkKeysRef.current)) return;

    activeChunkKeysRef.current = nextKeys;
    setActiveChunkKeys(nextKeys);
  }, [camera, chunks]);

  useFrame(({ clock }) => {
    if (!streamingEnabled) return;

    const now = clock.elapsedTime * 1000;
    if (now - lastUpdateRef.current < CHUNK_CONFIG.updateInterval) return;
    lastUpdateRef.current = now;

    updateActiveChunks();
  });

  return useMemo(() => {
    if (!streamingEnabled) return chunks;

    return chunks.filter((chunk) => {
      if (activeChunkKeys.size > 0) {
        return activeChunkKeys.has(chunk.key);
      }

      return (
        Math.hypot(
          chunk.centerX - camera.position.x,
          chunk.centerZ - camera.position.z,
        ) <= CHUNK_CONFIG.loadRadius
      );
    });
  }, [
    activeChunkKeys,
    camera.position.x,
    camera.position.z,
    chunks,
    streamingEnabled,
  ]);
}
