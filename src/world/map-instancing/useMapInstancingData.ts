import { useEffect, useState } from "react";
import type { MapNode } from "@/types/editor/editor";
import type { Vector3Tuple } from "@/types/three/three";
import { getMapNodes, loadMapSceneData } from "@/utils/map/loadMapSceneData";
import {
  MAP_INSTANCING_ASSETS,
  type MapInstancingAssetType,
} from "@/world/map-instancing/mapInstancingConfig";

export interface MapAssetInstance {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
}

export type MapInstancingData = Map<MapInstancingAssetType, MapAssetInstance[]>;

function mapNodeToInstance(node: MapNode): MapAssetInstance {
  return {
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
  };
}

function extractMapInstancingData(mapNodes: MapNode[]): MapInstancingData {
  const data: MapInstancingData = new Map();

  for (const [type, config] of Object.entries(MAP_INSTANCING_ASSETS)) {
    if (!config.enabled) continue;

    const instances = mapNodes
      .filter(
        (node) => node.name === config.mapName && node.type === "Object3D",
      )
      .map(mapNodeToInstance);

    if (instances.length > 0) {
      data.set(type as MapInstancingAssetType, instances);
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

      await loadMapSceneData();
      const nodes = getMapNodes();

      if (!cancelled && nodes) {
        setData(extractMapInstancingData(nodes));
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
