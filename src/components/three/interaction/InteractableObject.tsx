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
} from "@/data/debug/debugConfig";
import { Debug } from "@/utils/debug/Debug";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import { InteractionManager } from "@/managers/InteractionManager";
import { INTERACTION_RADIUS } from "@/data/interaction/interactionConfig";
import type { InteractableHandle } from "@/types/interaction/interaction";
import type { Vector3Tuple } from "@/types/three/three";

interface InteractableObjectBaseProps {
  label: string;
  position: Vector3Tuple;
  radius?: number;
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

const _cameraPos = new THREE.Vector3();
const _cameraDir = new THREE.Vector3();
const _objectPos = new THREE.Vector3();
const _objectBounds = new THREE.Box3();
const _raycaster = new THREE.Raycaster();

function getInteractableWorldPosition(
  group: THREE.Group,
  debugSphere: THREE.Mesh | null,
): THREE.Vector3 {
  _objectBounds.makeEmpty();

  for (const child of group.children) {
    if (child === debugSphere) continue;
    _objectBounds.expandByObject(child);
  }

  if (!_objectBounds.isEmpty()) {
    return _objectBounds.getCenter(_objectPos);
  }

  return group.getWorldPosition(_objectPos);
}

function createInteractableHandle(
  props: InteractableObjectProps,
): InteractableHandle {
  if (props.kind === "grab") {
    return {
      kind: props.kind,
      label: props.label,
      onPress: props.onPress,
      onRelease: props.onRelease,
    };
  }

  return {
    kind: props.kind,
    label: props.label,
    onPress: props.onPress,
  };
}

export function InteractableObject(
  props: InteractableObjectProps,
): React.JSX.Element {
  const {
    kind,
    label,
    position,
    radius = INTERACTION_RADIUS,
    bodyRef,
    onPress,
    children,
  } = props;
  const onRelease = props.kind === "grab" ? props.onRelease : null;
  const camera = useThree((state) => state.camera);
  const groupRef = useRef<THREE.Group>(null);
  const debugSphereRef = useRef<THREE.Mesh>(null);

  const handle = useRef<InteractableHandle>(createInteractableHandle(props));

  useEffect(() => {
    const currentHandle = handle.current;
    const manager = InteractionManager.getInstance();

    if (currentHandle.kind === kind) {
      currentHandle.label = label;
      currentHandle.onPress = onPress;

      if (currentHandle.kind === "grab") {
        if (!onRelease) return;
        currentHandle.onRelease = onRelease;
      }

      return;
    }

    manager.setNearby(currentHandle, false);

    if (kind === "grab") {
      if (!onRelease) return;
      handle.current = { kind, label, onPress, onRelease };
    } else {
      handle.current = { kind, label, onPress };
    }

    if (manager.getState().focused === currentHandle) {
      manager.setFocused(handle.current);
    }
  }, [kind, label, onPress, onRelease]);

  useEffect(() => {
    const currentHandle = handle.current;

    return () => {
      const manager = InteractionManager.getInstance();
      manager.setNearby(currentHandle, false);
      if (manager.getState().focused === currentHandle) {
        manager.setFocused(null);
      }
    };
  }, []);

  const setupInteractionDebugFolder = useCallback((folder: GUI) => {
    const debug = Debug.getInstance();
    const controls = {
      showInteractionSpheres: debug.getShowInteractionSpheres(),
    };

    folder
      .add(controls, "showInteractionSpheres")
      .name("Interaction Spheres")
      .onChange((value: boolean) => {
        debug.setShowInteractionSpheres(value);
      });

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
    } else if (group) {
      getInteractableWorldPosition(group, debugSphereRef.current);
    } else {
      _objectPos.set(...position);
    }

    camera.getWorldPosition(_cameraPos);
    const dist = _cameraPos.distanceTo(_objectPos);
    const isNearby = dist <= radius;

    manager.setNearby(handle.current, isNearby);

    if (!isNearby) {
      if (manager.getState().focused === handle.current) {
        manager.setFocused(null);
      }
      return;
    }

    camera.getWorldDirection(_cameraDir);
    _raycaster.set(_cameraPos, _cameraDir);
    _raycaster.far = radius;

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
            radius,
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
