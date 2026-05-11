import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RepairBrokenPartHighlightProps {
  target: THREE.Object3D;
}

const _box = new THREE.Box3();
const _sphere = new THREE.Sphere();
const _worldPosition = new THREE.Vector3();
const _localPosition = new THREE.Vector3();

export function RepairBrokenPartHighlight({
  target,
}: RepairBrokenPartHighlightProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    _box.setFromObject(target).getBoundingSphere(_sphere);

    _worldPosition.copy(_sphere.center);
    _localPosition.copy(_worldPosition);
    group.parent?.worldToLocal(_localPosition);
    group.position.copy(_localPosition);

    const pulse = 1 + Math.sin(clock.elapsedTime * 5) * 0.08;
    const radius = Math.max(_sphere.radius, 0.35) * pulse;
    group.scale.setScalar(radius);
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.14} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.06, 32, 16]} />
        <meshBasicMaterial
          color="#ef4444"
          wireframe
          transparent
          opacity={0.65}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.12, 0.025, 8, 96]} />
        <meshBasicMaterial color="#dc2626" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}
