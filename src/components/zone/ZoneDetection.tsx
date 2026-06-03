import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { isDebugEnabled } from "@/utils/debug/isDebugEnabled";
import type { ZoneConfig } from "@/types/gameplay/zone";

interface ZoneDetectionProps {
  zone: ZoneConfig;
  onEnter: () => void;
  height?: number;
}

const _cameraPos = new THREE.Vector3();

export function ZoneDebugVisual({
  zone,
  active,
}: {
  zone: ZoneConfig;
  active: boolean;
}): React.JSX.Element | null {
  if (!isDebugEnabled()) return null;
  return (
    <group position={zone.position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[zone.radius - 0.2, zone.radius, 32]} />
        <meshBasicMaterial
          color={active ? "#22c55e" : "#fbbf24"}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh>
        <cylinderGeometry
          args={[zone.radius, zone.radius, zone.height, 16, 1, true]}
        />
        <meshBasicMaterial
          color={active ? "#22c55e" : "#fbbf24"}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function ZoneDetection({
  zone,
  onEnter,
  height,
}: ZoneDetectionProps): React.JSX.Element | null {
  const camera = useThree((state) => state.camera);
  const hasTriggeredRef = useRef(false);
  const onEnterRef = useRef(onEnter);

  useEffect(() => {
    onEnterRef.current = onEnter;
  }, [onEnter]);

  useFrame(() => {
    if (hasTriggeredRef.current) return;

    camera.getWorldPosition(_cameraPos);
    const dx = _cameraPos.x - zone.position[0];
    const dz = _cameraPos.z - zone.position[2];
    const horizontalDist = Math.sqrt(dx * dx + dz * dz);

    if (horizontalDist > zone.radius) return;

    const zoneHeight = height ?? zone.height;
    if (_cameraPos.y < zone.position[1] - zoneHeight / 2) return;
    if (_cameraPos.y > zone.position[1] + zoneHeight / 2) return;

    hasTriggeredRef.current = true;
    onEnterRef.current();
  });

  return null;
}
