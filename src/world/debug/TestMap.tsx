import type { ReactNode } from "react";
import { Component, useRef } from "react";
import * as THREE from "three";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { RepairGame } from "@/components/three/gameplay/RepairGame";
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
  TEST_SCENE_REPAIR_ZONE_MARKER_RADIUS,
  TEST_SCENE_REPAIR_ZONE_MARKER_TUBE_RADIUS,
  TEST_SCENE_REPAIR_ZONES,
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
import { logModelLoadError } from "@/utils/three/modelLoadLogger";

const ELECTRICIENNE_ANIMATED_MODEL_PATH =
  "/models/electricienne_animated/model.gltf";

interface TestMapProps {
  onOctreeReady: OctreeReadyHandler;
}

interface ModelPreviewErrorBoundaryProps {
  children: ReactNode;
  modelPath: string;
}

interface ModelPreviewErrorBoundaryState {
  hasError: boolean;
}

interface RepairPlaygroundZoneMarkerProps {
  color: string;
}

class ModelPreviewErrorBoundary extends Component<
  ModelPreviewErrorBoundaryProps,
  ModelPreviewErrorBoundaryState
> {
  constructor(props: ModelPreviewErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ModelPreviewErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    logModelLoadError(
      {
        modelPath: this.props.modelPath,
        scope: "TestMap.ModelPreview",
        position: [0, 0, -5],
        scale: 1,
      },
      error,
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
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

        {TEST_SCENE_REPAIR_ZONES.map((zone) => (
          <group key={zone.mission} position={zone.position}>
            <RepairPlaygroundZoneMarker color={zone.color} />
            <RepairGame mission={zone.mission} position={[0, 0, 0]} />
          </group>
        ))}
      </Physics>

      <ModelPreviewErrorBoundary modelPath={ELECTRICIENNE_ANIMATED_MODEL_PATH}>
        <AnimatedModel
          modelPath={ELECTRICIENNE_ANIMATED_MODEL_PATH}
          defaultAnimation="Idle"
          position={[0, 0, -5]}
          scale={1}
        />
      </ModelPreviewErrorBoundary>
    </>
  );
}

function RepairPlaygroundZoneMarker({
  color,
}: RepairPlaygroundZoneMarkerProps): React.JSX.Element {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry
          args={[
            TEST_SCENE_REPAIR_ZONE_MARKER_RADIUS,
            TEST_SCENE_REPAIR_ZONE_MARKER_TUBE_RADIUS,
            12,
            96,
          ]}
        />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, TEST_SCENE_REPAIR_ZONE_MARKER_RADIUS, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
    </group>
  );
}
