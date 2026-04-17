import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { RefObject } from "react";
import {
  INTERACTION_DEBUG_SPHERE_COLOR,
  INTERACTION_DEBUG_SPHERE_OPACITY,
  INTERACTION_DEBUG_SPHERE_SEGMENTS,
} from "@/data/debugConfig";
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
  bodyRef?: RefObject<RapierRigidBody | null>;
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
  bodyRef,
  onPress,
  onRelease = () => {},
  children,
}: InteractableObjectProps): React.JSX.Element {
  const camera = useThree((state) => state.camera);
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
    const group = groupRef.current;
    const debug = Debug.getInstance();
    const manager = InteractionManager.getInstance();

    if (debugSphereRef.current) {
      debugSphereRef.current.visible =
        debug.active && debug.getShowInteractionSpheres();
    }

    if (bodyRef?.current) {
      const t = bodyRef.current.translation();
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
    <group ref={groupRef}>
      {children}
      <mesh ref={debugSphereRef} visible={false}>
        <sphereGeometry
          args={[
            INTERACTION_RADIUS,
            INTERACTION_DEBUG_SPHERE_SEGMENTS,
            INTERACTION_DEBUG_SPHERE_SEGMENTS,
          ]}
        />
        <meshBasicMaterial
          color={INTERACTION_DEBUG_SPHERE_COLOR}
          wireframe
          transparent
          opacity={INTERACTION_DEBUG_SPHERE_OPACITY}
        />
      </mesh>
    </group>
  );
}
