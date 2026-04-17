import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { InteractableObject } from "@/components/3d/InteractableObject";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";

const CUBE_SIZE = 0.5;
const HOLD_DISTANCE = 2;
const SPAWN_POSITION: [number, number, number] = [0, 1, -3];

const params = { stiffness: 15, throwBoost: 1.0 };

const _holdTarget = new THREE.Vector3();
const _currentPos = new THREE.Vector3();
const _velocity = new THREE.Vector3();

export function GrabCube(): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const rbRef = useRef<RapierRigidBody>(null);
  const isHolding = useRef(false);

  useDebugFolder("GrabCube", (folder) => {
    folder.add(params, "stiffness", 1, 50, 1).name("Hold stiffness");
    folder.add(params, "throwBoost", 0.5, 3.0, 0.1).name("Throw boost");
  });

  useFrame(() => {
    if (!isHolding.current || !rbRef.current) return;

    camera.getWorldDirection(_holdTarget);
    _holdTarget.multiplyScalar(HOLD_DISTANCE).add(camera.position);

    const t = rbRef.current.translation();
    _currentPos.set(t.x, t.y, t.z);

    _velocity
      .subVectors(_holdTarget, _currentPos)
      .multiplyScalar(params.stiffness);

    rbRef.current.setLinvel(
      { x: _velocity.x, y: _velocity.y, z: _velocity.z },
      true,
    );
    rbRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
  });

  return (
    <InteractableObject
      kind="grab"
      label="Prendre"
      position={SPAWN_POSITION}
      rigidBodyType="dynamic"
      colliders="cuboid"
      rbRef={rbRef}
      onPress={() => {
        isHolding.current = true;
      }}
      onRelease={() => {
        isHolding.current = false;
        if (rbRef.current && params.throwBoost !== 1.0) {
          const v = rbRef.current.linvel();
          rbRef.current.setLinvel(
            {
              x: v.x * params.throwBoost,
              y: v.y * params.throwBoost,
              z: v.z * params.throwBoost,
            },
            true,
          );
        }
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        <meshStandardMaterial color="#e07b39" roughness={0.6} metalness={0.1} />
      </mesh>
    </InteractableObject>
  );
}
