import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { InteractableObject } from "@/components/3d/InteractableObject";
import {
  GRAB_DEFAULT_COLLIDERS,
  GRAB_DEFAULT_LABEL,
  GRAB_HOLD_DISTANCE_DEFAULT,
  GRAB_HOLD_DISTANCE_MAX,
  GRAB_HOLD_DISTANCE_MIN,
  GRAB_HOLD_DISTANCE_STEP,
  GRAB_STIFFNESS_DEFAULT,
  GRAB_STIFFNESS_MAX,
  GRAB_STIFFNESS_MIN,
  GRAB_STIFFNESS_STEP,
  GRAB_THROW_BOOST_DEFAULT,
  GRAB_THROW_BOOST_MAX,
  GRAB_THROW_BOOST_MIN,
  GRAB_THROW_BOOST_STEP,
} from "@/data/grabConfig";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";

interface GrabbableObjectProps {
  position: [number, number, number];
  children: React.ReactNode;
  colliders?: "cuboid" | "ball" | "hull";
  label?: string;
}

// Shared mutable params — one debug folder controls all instances.
const params = {
  stiffness: GRAB_STIFFNESS_DEFAULT,
  throwBoost: GRAB_THROW_BOOST_DEFAULT,
  holdDistance: GRAB_HOLD_DISTANCE_DEFAULT,
};

const ZERO_ANGULAR_VELOCITY = { x: 0, y: 0, z: 0 };

const _holdTarget = new THREE.Vector3();
const _currentPos = new THREE.Vector3();
const _velocity = new THREE.Vector3();

export function GrabbableObject({
  position,
  children,
  colliders = GRAB_DEFAULT_COLLIDERS,
  label = GRAB_DEFAULT_LABEL,
}: GrabbableObjectProps): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const rbRef = useRef<RapierRigidBody>(null);
  const isHolding = useRef(false);

  useDebugFolder("GrabbableObject", (folder) => {
    folder
      .add(
        params,
        "stiffness",
        GRAB_STIFFNESS_MIN,
        GRAB_STIFFNESS_MAX,
        GRAB_STIFFNESS_STEP,
      )
      .name("Hold stiffness");
    folder
      .add(
        params,
        "throwBoost",
        GRAB_THROW_BOOST_MIN,
        GRAB_THROW_BOOST_MAX,
        GRAB_THROW_BOOST_STEP,
      )
      .name("Throw boost");
    folder
      .add(
        params,
        "holdDistance",
        GRAB_HOLD_DISTANCE_MIN,
        GRAB_HOLD_DISTANCE_MAX,
        GRAB_HOLD_DISTANCE_STEP,
      )
      .name("Hold distance");
  });

  useFrame(() => {
    if (!isHolding.current || !rbRef.current) return;

    camera.getWorldDirection(_holdTarget);
    _holdTarget.multiplyScalar(params.holdDistance).add(camera.position);

    const t = rbRef.current.translation();
    _currentPos.set(t.x, t.y, t.z);

    _velocity
      .subVectors(_holdTarget, _currentPos)
      .multiplyScalar(params.stiffness);

    rbRef.current.setLinvel(
      { x: _velocity.x, y: _velocity.y, z: _velocity.z },
      true,
    );
    rbRef.current.setAngvel(ZERO_ANGULAR_VELOCITY, true);
  });

  return (
    <RigidBody
      ref={rbRef}
      type="dynamic"
      colliders={colliders}
      position={position}
    >
      <InteractableObject
        kind="grab"
        label={label}
        position={position}
        bodyRef={rbRef}
        onPress={() => {
          isHolding.current = true;
        }}
        onRelease={() => {
          isHolding.current = false;
          if (!rbRef.current || params.throwBoost === GRAB_THROW_BOOST_DEFAULT)
            return;
          const v = rbRef.current.linvel();
          rbRef.current.setLinvel(
            {
              x: v.x * params.throwBoost,
              y: v.y * params.throwBoost,
              z: v.z * params.throwBoost,
            },
            true,
          );
        }}
      >
        {children}
      </InteractableObject>
    </RigidBody>
  );
}
