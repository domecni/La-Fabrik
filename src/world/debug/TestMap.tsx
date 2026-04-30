import { useRef } from "react";
import * as THREE from "three";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { RepairGameZone } from "@/components/three/gameplay/RepairGameZone";
import { GrabbableObject } from "@/components/three/interaction/GrabbableObject";
import { AnimatedModel } from "@/components/three/models/AnimatedModel";
import { TriggerObject } from "@/components/three/interaction/TriggerObject";
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
} from "@/data/debug/testSceneConfig";
import { useOctreeGraphNode } from "@/hooks/three/useOctreeGraphNode";
import type { OctreeReadyHandler } from "@/types/three/three";

interface TestMapProps {
  onOctreeReady: OctreeReadyHandler;
}

export function TestMap({ onOctreeReady }: TestMapProps): React.JSX.Element {
  const floorRef = useRef<THREE.Group>(null);

  useOctreeGraphNode(floorRef, onOctreeReady);

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
          handControlled
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

        <RepairGameZone />
      </Physics>

      <AnimatedModel
        modelPath="/models/elec/model.gltf"
        defaultAnimation="Idle"
        position={[0, 0, -5]}
        scale={1}
      />
    </>
  );
}
