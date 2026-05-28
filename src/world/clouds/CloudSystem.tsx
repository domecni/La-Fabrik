import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CLOUD_CONFIG } from "@/data/world/cloudConfig";
import { getWindVector } from "@/utils/world/windVector";
import { useDynamicClouds } from "@/hooks/world/useGraphicsSettings";
import { useCloudSettings } from "@/hooks/world/useCloudSettings";
import { useWind } from "@/hooks/world/useWind";
import { CloudModel } from "@/components/three/world/CloudModel";
import type { CloudState } from "@/data/world/cloudConfig";

interface CloudInstance {
  height: number;
  rotationY: number;
  scale: number;
  speedMultiplier: number;
  x: number;
  z: number;
}

function lerp(min: number, max: number, ratio: number): number {
  return min + (max - min) * ratio;
}

function createCloudInstances(cloudSettings: CloudState): CloudInstance[] {
  const instances: CloudInstance[] = [];
  const [areaWidth, areaDepth] = CLOUD_CONFIG.areaSize;
  const count = Math.max(0, Math.round(cloudSettings.count));
  const columns = Math.ceil(Math.sqrt(count));
  const rows = columns > 0 ? Math.ceil(count / columns) : 0;

  for (let index = 0; index < count; index++) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const columnRatio = columns <= 1 ? 0.5 : column / (columns - 1);
    const rowRatio = rows <= 1 ? 0.5 : row / (rows - 1);
    const variation = ((index * 37) % 100) / 100;

    instances.push({
      height: lerp(cloudSettings.minHeight, cloudSettings.maxHeight, variation),
      rotationY: lerp(
        cloudSettings.minRotation,
        cloudSettings.maxRotation,
        variation,
      ),
      scale: lerp(cloudSettings.minScale, cloudSettings.maxScale, variation),
      speedMultiplier: lerp(
        cloudSettings.minSpeedMultiplier,
        cloudSettings.maxSpeedMultiplier,
        ((index * 53) % 100) / 100,
      ),
      x: CLOUD_CONFIG.center[0] + (columnRatio - 0.5) * areaWidth,
      z: CLOUD_CONFIG.center[2] + (rowRatio - 0.5) * areaDepth,
    });
  }

  return instances;
}

function wrapAxis(
  value: number,
  center: number,
  size: number,
  padding: number,
): number {
  const min = center - size / 2 - padding;
  const max = center + size / 2 + padding;
  const range = max - min;

  if (value < min) return value + range;
  if (value > max) return value - range;
  return value;
}

export function CloudSystem(): React.JSX.Element | null {
  const cloudSettings = useCloudSettings();
  const dynamicClouds = useDynamicClouds();
  const wind = useWind();
  const refs = useRef<Array<THREE.Group | null>>([]);
  const clouds = useMemo(
    () => createCloudInstances(cloudSettings),
    [cloudSettings],
  );

  useFrame((_, delta) => {
    const windVector = getWindVector(wind);
    const windLength = Math.hypot(windVector.x, windVector.z);
    const safeWindLength = Math.max(windLength, CLOUD_CONFIG.minDriftSpeed);
    const directionX =
      windLength > 0 ? windVector.x / windLength : Math.cos(wind.direction);
    const directionZ =
      windLength > 0 ? windVector.z / windLength : Math.sin(wind.direction);

    refs.current.forEach((cloud, index) => {
      if (!cloud) return;

      const instance = clouds[index];
      if (!instance) return;

      const distance = safeWindLength * instance.speedMultiplier * delta;
      cloud.position.x = wrapAxis(
        cloud.position.x + directionX * distance,
        CLOUD_CONFIG.center[0],
        CLOUD_CONFIG.areaSize[0],
        CLOUD_CONFIG.wrapPadding,
      );
      cloud.position.z = wrapAxis(
        cloud.position.z + directionZ * distance,
        CLOUD_CONFIG.center[2],
        CLOUD_CONFIG.areaSize[1],
        CLOUD_CONFIG.wrapPadding,
      );
    });
  });

  if (!CLOUD_CONFIG.enabled || !dynamicClouds) {
    return null;
  }

  return (
    <group name="cloud-system">
      {clouds.map((cloud, index) => (
        <group
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          position={[cloud.x, cloud.height, cloud.z]}
          rotation={[0, cloud.rotationY, 0]}
          scale={cloud.scale}
        >
          <Suspense fallback={null}>
            <CloudModel
              castShadow={cloudSettings.castShadow}
              receiveShadow={cloudSettings.receiveShadow}
            />
          </Suspense>
        </group>
      ))}
    </group>
  );
}
