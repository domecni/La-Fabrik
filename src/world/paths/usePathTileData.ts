import { useMemo } from "react";
import { TERRAIN_SURFACE_PROJECTION } from "@/data/world/terrainConfig";
import { useTerrainSurfaceData } from "@/hooks/world/useTerrainSurfaceData";
import type { Vector3Tuple } from "@/types/three/three";
import { sampleTerrainSurfaceAtXZ } from "@/utils/world/terrainSurfaceSampler";
import type { MapAssetInstance } from "@/world/map-instancing/useMapInstancingData";
import {
  PATH_TILE_MAX_COUNT,
  PATH_SURFACE_KEY,
  PATH_TILE_ROTATION,
  PATH_TILE_SAMPLE_STEP,
  PATH_TILE_SCALE,
} from "@/world/paths/pathConfig";

function createSampleCenters(min: number, max: number, step: number): number[] {
  const start = Math.ceil(min / step) * step + step * 0.5;
  const centers: number[] = [];

  for (let value = start; value <= max; value += step) {
    centers.push(value);
  }

  return centers;
}

export function usePathTileData(): MapAssetInstance[] {
  const terrainSurfaceData = useTerrainSurfaceData();

  return useMemo(() => {
    if (!terrainSurfaceData) return [];

    const instances: MapAssetInstance[] = [];
    const xCenters = createSampleCenters(
      terrainSurfaceData.bounds.minX,
      terrainSurfaceData.bounds.maxX,
      PATH_TILE_SAMPLE_STEP,
    );
    const zCenters = createSampleCenters(
      terrainSurfaceData.bounds.minZ,
      terrainSurfaceData.bounds.maxZ,
      PATH_TILE_SAMPLE_STEP,
    );

    for (const x of xCenters) {
      for (const z of zCenters) {
        if (instances.length >= PATH_TILE_MAX_COUNT) return instances;

        const sample = sampleTerrainSurfaceAtXZ(
          terrainSurfaceData.imageData,
          x,
          z,
          terrainSurfaceData.bounds,
          TERRAIN_SURFACE_PROJECTION,
        );

        if (sample.key !== PATH_SURFACE_KEY) continue;

        instances.push({
          position: [x, 0, z],
          rotation: [...PATH_TILE_ROTATION] as Vector3Tuple,
          scale: [...PATH_TILE_SCALE] as Vector3Tuple,
        });
      }
    }

    return instances;
  }, [terrainSurfaceData]);
}
