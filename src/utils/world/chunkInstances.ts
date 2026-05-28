import { CHUNK_CONFIG } from "@/data/world/chunkStreamingConfig";
import type { Vector3Tuple } from "@/types/three/three";

interface PositionedInstance {
  position: Vector3Tuple;
}

export interface WorldInstanceChunk<TInstance extends PositionedInstance> {
  centerX: number;
  centerZ: number;
  chunkKey: string;
  instances: TInstance[];
}

function getWorldChunkKey(instance: PositionedInstance): string {
  const [x, , z] = instance.position;
  const chunkX = Math.floor(x / CHUNK_CONFIG.chunkSize);
  const chunkZ = Math.floor(z / CHUNK_CONFIG.chunkSize);
  return `${chunkX}:${chunkZ}`;
}

export function createWorldInstanceChunks<TInstance extends PositionedInstance>(
  instances: TInstance[],
): WorldInstanceChunk<TInstance>[] {
  const chunks = new Map<string, TInstance[]>();

  for (const instance of instances) {
    const chunkKey = getWorldChunkKey(instance);
    const chunk = chunks.get(chunkKey);

    if (chunk) {
      chunk.push(instance);
    } else {
      chunks.set(chunkKey, [instance]);
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
      centerX: center.x / chunkInstances.length,
      centerZ: center.z / chunkInstances.length,
      chunkKey,
      instances: chunkInstances,
    };
  });
}
