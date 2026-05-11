import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RepairPromptVideo } from "@/components/three/gameplay/RepairPromptVideo";

interface RepairBrokenPartPromptProps {
  src: string;
  target: THREE.Object3D;
}

const _box = new THREE.Box3();
const _sphere = new THREE.Sphere();
const _localPosition = new THREE.Vector3();

export function RepairBrokenPartPrompt({
  src,
  target,
}: RepairBrokenPartPromptProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    _box.setFromObject(target).getBoundingSphere(_sphere);
    _localPosition.copy(_sphere.center);
    group.parent?.worldToLocal(_localPosition);
    group.position.copy(_localPosition);
  });

  return (
    <group ref={groupRef}>
      <RepairPromptVideo src={src} position={[0, 0, 0]} size={72} />
    </group>
  );
}
