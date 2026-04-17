import { useEffect, useRef } from "react";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { Octree } from "three/addons/math/Octree.js";
import { GrabbableObject } from "@/components/3d/GrabbableObject";
import { TriggerObject } from "@/components/3d/TriggerObject";
import {
  TEST_SCENE_FLOOR_COLLIDER_HALF_EXTENTS,
  TEST_SCENE_FLOOR_POSITION,
  TEST_SCENE_FLOOR_SIZE,
  TEST_SCENE_GRABBABLE_BOX_SIZE,
  TEST_SCENE_GRABBABLE_COLOR,
  TEST_SCENE_GRABBABLE_METALNESS,
  TEST_SCENE_GRABBABLE_POSITION,
  TEST_SCENE_GRABBABLE_ROUGHNESS,
  TEST_SCENE_TRIGGER_COLOR,
  TEST_SCENE_TRIGGER_METALNESS,
  TEST_SCENE_TRIGGER_POSITION,
  TEST_SCENE_TRIGGER_RADIUS,
  TEST_SCENE_TRIGGER_ROUGHNESS,
  TEST_SCENE_TRIGGER_SEGMENTS,
  TEST_SCENE_TRIGGER_SOUND_PATH,
} from "@/data/testSceneConfig";

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
      <group ref={floorRef}>
        <mesh visible={false} position={TEST_SCENE_FLOOR_POSITION}>
          <boxGeometry args={TEST_SCENE_FLOOR_SIZE} />
          <meshBasicMaterial />
        </mesh>
      </group>

      <Physics>
        <RigidBody type="fixed">
          <CuboidCollider
            args={TEST_SCENE_FLOOR_COLLIDER_HALF_EXTENTS}
            position={TEST_SCENE_FLOOR_POSITION}
          />
        </RigidBody>

        <GrabbableObject
          position={TEST_SCENE_GRABBABLE_POSITION}
          colliders="cuboid"
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={TEST_SCENE_GRABBABLE_BOX_SIZE} />
            <meshStandardMaterial
              color={TEST_SCENE_GRABBABLE_COLOR}
              roughness={TEST_SCENE_GRABBABLE_ROUGHNESS}
              metalness={TEST_SCENE_GRABBABLE_METALNESS}
            />
          </mesh>
        </GrabbableObject>

        <TriggerObject
          position={TEST_SCENE_TRIGGER_POSITION}
          soundPath={TEST_SCENE_TRIGGER_SOUND_PATH}
        >
          <mesh castShadow receiveShadow>
            <sphereGeometry
              args={[
                TEST_SCENE_TRIGGER_RADIUS,
                TEST_SCENE_TRIGGER_SEGMENTS,
                TEST_SCENE_TRIGGER_SEGMENTS,
              ]}
            />
            <meshStandardMaterial
              color={TEST_SCENE_TRIGGER_COLOR}
              roughness={TEST_SCENE_TRIGGER_ROUGHNESS}
              metalness={TEST_SCENE_TRIGGER_METALNESS}
            />
          </mesh>
        </TriggerObject>
      </Physics>
    </>
  );
}
