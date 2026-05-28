import { useEffect, useState } from "react";
import {
  MAP_INSTANCING_ASSETS,
  MAP_INSTANCING_ASSET_TYPES,
  type MapInstancingAssetType,
} from "@/data/world/mapInstancingConfig";
import type { MapNode } from "@/types/map/mapScene";
import {
  type MapNodeInstanceTransform,
  mapNodeToInstanceTransform,
} from "@/utils/map/mapInstanceTransform";
import { logger } from "@/utils/core/Logger";
import { getMapNodes, loadMapSceneData } from "@/utils/map/loadMapSceneData";

export type MapAssetInstance = MapNodeInstanceTransform;

export type MapInstancingData = Map<MapInstancingAssetType, MapAssetInstance[]>;

function extractMapInstancingData(mapNodes: MapNode[]): MapInstancingData {
  const data: MapInstancingData = new Map();

  for (const type of MAP_INSTANCING_ASSET_TYPES) {
    const config = MAP_INSTANCING_ASSETS[type];

    if (!config.enabled) continue;

    const instances = mapNodes
      .filter(
        (node) => node.name === config.mapName && node.type === "Object3D",
      )
      .map(mapNodeToInstanceTransform);

    if (instances.length > 0) {
      data.set(type, instances);
    }
  }

  return data;
}

export function useMapInstancingData(): {
  data: MapInstancingData | null;
  isLoading: boolean;
} {
  const [data, setData] = useState<MapInstancingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cachedNodes = getMapNodes();

      if (cachedNodes) {
        if (!cancelled) {
          setData(extractMapInstancingData(cachedNodes));
          setIsLoading(false);
        }
        return;
      }

      try {
        await loadMapSceneData();
      } catch (error) {
        logger.error("MapInstancing", "Failed to load map instancing data", {
          error: error instanceof Error ? error : String(error),
        });
      }

      const nodes = getMapNodes();

      if (!cancelled) {
        setData(nodes ? extractMapInstancingData(nodes) : new Map());
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
