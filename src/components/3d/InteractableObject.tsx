import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { RefObject } from "react";
import { Debug } from "@/utils/debug/Debug";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import {
  InteractionManager,
  type InteractableHandle,
  type InteractableKind,
} from "@/stateManager/InteractionManager";
import { INTERACTION_RADIUS } from "@/data/interactionConfig";

interface InteractableObjectProps {
  kind: InteractableKind;
  label: string;
  position: [number, number, number];
  rigidBodyType?: "dynamic" | "fixed";
  colliders?: "cuboid" | "ball" | "hull";
  rbRef?: RefObject<RapierRigidBody | null>;
  onPress: () => void;
  onRelease?: () => void;
  children: React.ReactNode;
}

const _cameraPos = new THREE.Vector3();
const _cameraDir = new THREE.Vector3();
const _objectPos = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();

export function InteractableObject({
  kind,
  label,
  position,
  rigidBodyType = "dynamic",
  colliders = "cuboid",
  rbRef,
  onPress,
  onRelease = () => {},
  children,
}: InteractableObjectProps): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const internalRef = useRef<RapierRigidBody>(null);
  const bodyRef = rbRef ?? internalRef;
  const groupRef = useRef<THREE.Group>(null);
  const debugSphereRef = useRef<THREE.Mesh>(null);

  const handle = useRef<InteractableHandle>({
    kind,
    label,
    onPress,
    onRelease,
  });

  useEffect(() => {
    handle.current.onPress = onPress;
    handle.current.onRelease = onRelease;
  });

  useDebugFolder("Interaction", (folder) => {
    folder
      .add({ radius: INTERACTION_RADIUS }, "radius")
      .name("Interaction radius")
      .disable();
  });

  useFrame(() => {
    const body = bodyRef.current;
    const group = groupRef.current;
    const debug = Debug.getInstance();
    const manager = InteractionManager.getInstance();

    if (debugSphereRef.current) {
      debugSphereRef.current.visible =
        debug.active && debug.getShowInteractionSpheres();
    }

    if (body) {
      const t = body.translation();
      _objectPos.set(t.x, t.y, t.z);
    } else {
      _objectPos.set(...position);
    }

    camera.getWorldPosition(_cameraPos);
    const dist = _cameraPos.distanceTo(_objectPos);

    if (dist > INTERACTION_RADIUS) {
      if (manager.getState().focused === handle.current) {
        manager.setFocused(null);
      }
      return;
    }

    camera.getWorldDirection(_cameraDir);
    _raycaster.set(_cameraPos, _cameraDir);
    _raycaster.far = INTERACTION_RADIUS;

    const hits = group ? _raycaster.intersectObject(group, true) : [];

    const validHit = hits.find((h) => h.object !== debugSphereRef.current);

    if (validHit) {
      manager.setFocused(handle.current);
    } else if (manager.getState().focused === handle.current) {
      manager.setFocused(null);
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      type={rigidBodyType}
      colliders={colliders}
      position={position}
    >
      <group ref={groupRef}>
        {children}
        <mesh ref={debugSphereRef} visible={false}>
          <sphereGeometry args={[INTERACTION_RADIUS, 16, 16]} />
          <meshBasicMaterial
            color="#facc15"
            wireframe
            transparent
            opacity={0.25}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}
