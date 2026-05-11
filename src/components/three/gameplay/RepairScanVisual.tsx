import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RepairScanVisualProps {
  target?: THREE.Object3D | null | undefined;
}

export function RepairScanVisual({
  target = null,
}: RepairScanVisualProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const scanLineRef = useRef<THREE.Mesh>(null);
  const worldPosition = useRef(new THREE.Vector3());
  const localPosition = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    const group = groupRef.current;
    const scanLine = scanLineRef.current;
    if (!group || !scanLine) return;

    if (target) {
      target.getWorldPosition(worldPosition.current);
      localPosition.current.copy(worldPosition.current);
      group.parent?.worldToLocal(localPosition.current);
      group.position.copy(localPosition.current);
    }

    scanLine.position.y = 0.35 + Math.sin(clock.elapsedTime * 4) * 0.7;
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.35, 0.035, 12, 96]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.75} />
      </mesh>
      <mesh ref={scanLineRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 1.25, 96]} />
        <meshBasicMaterial
          color="#7dd3fc"
          side={THREE.DoubleSide}
          transparent
          opacity={0.45}
        />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[1.25, 32, 16]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}
