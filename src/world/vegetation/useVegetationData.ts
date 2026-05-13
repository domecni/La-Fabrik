import { useEffect, useState } from "react";
import type { MapNode } from "@/types/editor/editor";
import type { Vector3Tuple } from "@/types/three/three";
import { getMapNodes, loadMapSceneData } from "@/utils/map/loadMapSceneData";
import {
  VEGETATION_TYPES,
  type VegetationType,
} from "@/world/vegetation/vegetationConfig";

export interface VegetationInstance {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
}

export type VegetationData = Map<VegetationType, VegetationInstance[]>;

function mapNodeToInstance(node: MapNode): VegetationInstance {
  return {
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
  };
}

function extractVegetationData(mapNodes: MapNode[]): VegetationData {
  const data: VegetationData = new Map();

  for (const [type, config] of Object.entries(VEGETATION_TYPES)) {
    if (!config.enabled) continue;

    const instances = mapNodes
      .filter((node) => node.name === config.mapName)
      .map(mapNodeToInstance);

    if (instances.length > 0) {
      data.set(type as VegetationType, instances);
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
      const cachedNodes = getMapNodes();

      if (cachedNodes) {
        if (!cancelled) {
          setData(extractVegetationData(cachedNodes));
          setIsLoading(false);
        }
        return;
      }

      await loadMapSceneData();
      const nodes = getMapNodes();

      if (!cancelled && nodes) {
        setData(extractVegetationData(nodes));
        setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading };
}
