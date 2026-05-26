import { useCallback, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  WATER_SHADER_CONFIG,
  WATER_STREAMING_CONFIG,
  WATER_SURFACES,
} from "@/data/world/waterConfig";
import type { WaterSurfaceConfig } from "@/data/world/waterConfig";
import { WaterSurface } from "@/world/water/WaterSurface";

function getDistanceToWaterSurface(
  surface: WaterSurfaceConfig,
  x: number,
  z: number,
): number {
  const halfWidth = surface.size[0] / 2;
  const halfDepth = surface.size[1] / 2;
  const distanceX = Math.max(Math.abs(x - surface.position[0]) - halfWidth, 0);
  const distanceZ = Math.max(Math.abs(z - surface.position[2]) - halfDepth, 0);

  return Math.hypot(distanceX, distanceZ);
}

export function WaterSystem(): React.JSX.Element | null {
  const camera = useThree((state) => state.camera);
  const lastUpdateRef = useRef(-WATER_STREAMING_CONFIG.updateInterval);
  const [activeSurfaceIndexes, setActiveSurfaceIndexes] = useState<Set<number>>(
    () => new Set(),
  );

  const updateActiveSurfaces = useCallback(() => {
    const nextIndexes = new Set<number>();
    const cameraX = camera.position.x;
    const cameraZ = camera.position.z;

    WATER_SURFACES.forEach((surface, index) => {
      const distance = getDistanceToWaterSurface(surface, cameraX, cameraZ);
      const wasActive = activeSurfaceIndexes.has(index);
      const radius = wasActive
        ? WATER_STREAMING_CONFIG.unloadDistance
        : WATER_STREAMING_CONFIG.loadDistance;

      if (distance <= radius) {
        nextIndexes.add(index);
      }
    });

    if (
      nextIndexes.size === activeSurfaceIndexes.size &&
      [...nextIndexes].every((index) => activeSurfaceIndexes.has(index))
    ) {
      return;
    }

    setActiveSurfaceIndexes(nextIndexes);
  }, [activeSurfaceIndexes, camera]);

  useFrame(({ clock }) => {
    if (!WATER_STREAMING_CONFIG.enabled) return;

    const now = clock.elapsedTime * 1000;
    if (now - lastUpdateRef.current < WATER_STREAMING_CONFIG.updateInterval) {
      return;
    }

    lastUpdateRef.current = now;
    updateActiveSurfaces();
  });

  if (!WATER_SHADER_CONFIG.enabled) {
    return null;
  }

  const visibleSurfaces = WATER_SURFACES.map((surface, index) => ({
    index,
    surface,
  })).filter(({ index, surface }) => {
    if (!WATER_STREAMING_CONFIG.enabled) {
      return true;
    }

    if (activeSurfaceIndexes.size > 0) {
      return activeSurfaceIndexes.has(index);
    }

    return (
      getDistanceToWaterSurface(
        surface,
        camera.position.x,
        camera.position.z,
      ) <= WATER_STREAMING_CONFIG.loadDistance
    );
  });

  return (
    <group name="water-system">
      {visibleSurfaces.map(({ index, surface }) => (
        <WaterSurface key={index} {...surface} />
      ))}
    </group>
  );
}
