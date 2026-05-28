import { useEffect, useState } from "react";
import { VEGETATION_INSTANCE_EXCLUDED_NODE_NAMES } from "@/data/world/vegetationConfig";
import type { MapNode, VegetationInstance } from "@/types/map/mapScene";
import { mapNodeToInstanceTransform } from "@/utils/map/mapInstanceTransform";
import { logger } from "@/utils/core/Logger";
import { loadMapSceneData } from "@/utils/map/loadMapSceneData";

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

  function addInstance(
    mapName: string,
    modelPath: string,
    node: MapNode,
  ): void {
    const entry = data.get(mapName);
    const instance = mapNodeToInstanceTransform(node);

    if (entry) {
      entry.instances.push(instance);
      return;
    }

    data.set(mapName, {
      modelPath,
      instances: [instance],
    });
  }

  for (const node of mapNodes) {
    if (node.type !== "Object3D") continue;
    if (VEGETATION_INSTANCE_EXCLUDED_NODE_NAMES.has(node.name)) continue;

    const modelPath = models.get(node.name);
    if (!modelPath) continue;

    addInstance(node.name, modelPath, node);
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
        if (!cancelled) {
          setData(null);
          setIsLoading(false);
        }
        return;
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
