import { Suspense } from "react";
import {
  useDynamicGrass,
  useGrassDensity,
} from "@/hooks/world/useGraphicsSettings";
import { GRASS_CONFIG } from "@/data/world/grassConfig";
import { GrassPatch } from "@/world/grass/GrassPatch";
import { useTerrainGrassSampler } from "@/world/grass/useTerrainGrassSampler";

export function GrassSystem(): React.JSX.Element | null {
  const terrainSampler = useTerrainGrassSampler();
  const dynamicGrass = useDynamicGrass();
  const grassDensity = useGrassDensity();
  const density = Math.max(0, grassDensity);

  if (!GRASS_CONFIG.enabled || !dynamicGrass || density <= 0) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <GrassPatch density={density} terrainSampler={terrainSampler} />
    </Suspense>
  );
}
