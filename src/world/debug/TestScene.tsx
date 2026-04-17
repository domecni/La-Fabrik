import { useEffect, useRef } from "react";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { Octree } from "three/addons/math/Octree.js";
import { GrabCube } from "@/world/objects/GrabCube";
import { TriggerSphere } from "@/world/objects/TriggerSphere";

interface TestSceneProps {
  onOctreeReady: (octree: Octree) => void;
}

export function TestScene({
  onOctreeReady,
}: TestSceneProps): React.JSX.Element {
  const floorRef = useRef<THREE.Group>(null);
  const octreeBuilt = useRef(false);

  useEffect(() => {
    if (octreeBuilt.current || !floorRef.current) return;
    octreeBuilt.current = true;

    floorRef.current.updateMatrixWorld(true);

    const octree = new Octree();
    octree.fromGraphNode(floorRef.current);
    onOctreeReady(octree);
  }, [onOctreeReady]);

  return (
    <>
      {/* Invisible floor mesh for Octree player collision */}
      <group ref={floorRef}>
        <mesh visible={false} position={[0, -0.5, 0]}>
          <boxGeometry args={[200, 1, 200]} />
          <meshBasicMaterial />
        </mesh>
      </group>

      {/* Rapier physics for interactable objects */}
      <Physics>
        <RigidBody type="fixed">
          <CuboidCollider args={[100, 0.5, 100]} position={[0, -0.5, 0]} />
        </RigidBody>
        <GrabCube />
        <TriggerSphere />
      </Physics>
    </>
  );
}
