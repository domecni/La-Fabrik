import { useEffect, useState } from "react";
import { INSTANCED_MAP_EXCEPTIONS } from "@/world/vegetation/vegetationConfig";
import type { MapNode } from "@/types/map/mapScene";
import {
  type MapNodeInstanceTransform,
  mapNodeToInstanceTransform,
} from "@/utils/map/mapInstanceTransform";
import { logger } from "@/utils/core/Logger";
import { loadMapSceneData } from "@/utils/map/loadMapSceneData";

export type VegetationInstance = MapNodeInstanceTransform;

interface InstancedMapEntry {
  modelPath: string;
  instances: VegetationInstance[];
}

export type VegetationData = Map<string, InstancedMapEntry>;

function extractVegetationData(
  mapNodes: MapNode[],
  models: Map<string, string>,
): VegetationData {
  const data: VegetationData = new Map();

  for (const node of mapNodes) {
    if (node.type !== "Object3D") continue;
    if (INSTANCED_MAP_EXCEPTIONS.has(node.name)) continue;

    const modelPath = models.get(node.name);
    if (!modelPath) continue;

    const entry = data.get(node.name);

    if (entry) {
      entry.instances.push(mapNodeToInstanceTransform(node));
    } else {
      data.set(node.name, {
        modelPath,
        instances: [mapNodeToInstanceTransform(node)],
      });
    }
  }

  return data;
}

export function useVegetationData(): {
  data: VegetationData | null;
  isLoading: boolean;
} {
  const [data, setData] = useState<VegetationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let sceneData: Awaited<ReturnType<typeof loadMapSceneData>> | null = null;

      try {
        sceneData = await loadMapSceneData();
      } catch (error) {
        logger.error("Vegetation", "Failed to load vegetation data", {
          error: error instanceof Error ? error : String(error),
        });
      }

      if (!cancelled) {
        setData(
          sceneData
            ? extractVegetationData(sceneData.mapNodes, sceneData.models)
            : new Map(),
        );
        setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading };
}
