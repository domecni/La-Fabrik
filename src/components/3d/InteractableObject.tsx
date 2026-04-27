import { useCallback, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type GUI from "lil-gui";
import type { RefObject } from "react";
import {
  INTERACTION_DEBUG_SPHERE_COLOR,
  INTERACTION_DEBUG_SPHERE_OPACITY,
  INTERACTION_DEBUG_SPHERE_SEGMENTS,
} from "@/data/debugConfig";
import { Debug } from "@/utils/debug/Debug";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import { InteractionManager } from "@/stateManager/InteractionManager";
import { INTERACTION_RADIUS } from "@/data/interactionConfig";
import type { Vector3Tuple } from "@/types/3d";
import type { InteractableHandle, InteractableKind } from "@/types/interaction";

interface InteractableObjectBaseProps {
  label: string;
  position: Vector3Tuple;
  bodyRef?: RefObject<RapierRigidBody | null>;
  onPress: () => void;
  children: React.ReactNode;
}

interface TriggerInteractableObjectProps extends InteractableObjectBaseProps {
  kind: "trigger";
}

interface GrabInteractableObjectProps extends InteractableObjectBaseProps {
  kind: "grab";
  onRelease: () => void;
}

type InteractableObjectProps =
  | TriggerInteractableObjectProps
  | GrabInteractableObjectProps;

type MutableInteractableHandle = {
  kind: InteractableKind;
  label: string;
  onPress: () => void;
  onRelease?: () => void;
};

const _cameraPos = new THREE.Vector3();
const _cameraDir = new THREE.Vector3();
const _objectPos = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();

export function InteractableObject(
  props: InteractableObjectProps,
): React.JSX.Element {
  const { kind, label, position, bodyRef, onPress, children } = props;
  const onRelease = props.kind === "grab" ? props.onRelease : undefined;
  const camera = useThree((state) => state.camera);
  const groupRef = useRef<THREE.Group>(null);
  const debugSphereRef = useRef<THREE.Mesh>(null);

  const handle = useRef<InteractableHandle>(
    props.kind === "grab"
      ? { kind: props.kind, label, onPress, onRelease: props.onRelease }
      : { kind: props.kind, label, onPress },
  );

  useEffect(() => {
    const current = handle.current as MutableInteractableHandle;
    current.kind = kind;
    current.label = label;
    current.onPress = onPress;

    if (kind === "grab" && onRelease) {
      current.onRelease = onRelease;
      return;
    }

    delete current.onRelease;
    return undefined;
  }, [kind, label, onPress, onRelease]);

  const setupInteractionDebugFolder = useCallback((folder: GUI) => {
    folder
      .add({ radius: INTERACTION_RADIUS }, "radius")
      .name("Interaction radius")
      .disable();
  }, []);

  useDebugFolder("Interaction", setupInteractionDebugFolder);

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
