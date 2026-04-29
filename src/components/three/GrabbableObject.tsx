import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { InteractableObject } from "@/components/three/InteractableObject";
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
} from "@/data/interaction/grabConfig";
import { INTERACTION_RADIUS } from "@/data/interaction/interactionConfig";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import { useHandTrackingSnapshot } from "@/hooks/useHandTrackingSnapshot";
import type { ColliderShape, Vector3Tuple } from "@/types/three";

interface GrabbableObjectProps {
  position: Vector3Tuple;
  children: React.ReactNode;
  colliders?: ColliderShape;
  label?: string;
  handControlled?: boolean;
}

// Shared params let one debug folder drive every instance.
const params = {
  stiffness: GRAB_STIFFNESS_DEFAULT,
  throwBoost: GRAB_THROW_BOOST_DEFAULT,
  holdDistance: GRAB_HOLD_DISTANCE_DEFAULT,
};

const ZERO_ANGULAR_VELOCITY = { x: 0, y: 0, z: 0 };

const _holdTarget = new THREE.Vector3();
const _currentPos = new THREE.Vector3();
const _velocity = new THREE.Vector3();
const _handNdc = new THREE.Vector3();
const _handDirection = new THREE.Vector3();
const _cameraPos = new THREE.Vector3();
const _objectPos = new THREE.Vector3();
const _handRaycaster = new THREE.Raycaster();

export function GrabbableObject({
  position,
  children,
  colliders = GRAB_DEFAULT_COLLIDERS,
  label = GRAB_DEFAULT_LABEL,
  handControlled = false,
}: GrabbableObjectProps): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const { hands } = useHandTrackingSnapshot();
  const groupRef = useRef<THREE.Group>(null);
  const rbRef = useRef<RapierRigidBody>(null);
  const isHolding = useRef(false);
  const isHandHolding = useRef(false);

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
    if (!rbRef.current) return;

    const fistHand = handControlled
      ? hands.find((hand) => hand.isFist)
      : undefined;

    const t = rbRef.current.translation();
    _currentPos.set(t.x, t.y, t.z);

    if (fistHand) {
      _handNdc.set((1 - fistHand.x) * 2 - 1, -fistHand.y * 2 + 1, 0.5);
      _handNdc.unproject(camera);
      camera.getWorldPosition(_cameraPos);
      _handDirection.subVectors(_handNdc, _cameraPos).normalize();

      if (!isHandHolding.current) {
        _objectPos.copy(_currentPos);
        _handRaycaster.set(_cameraPos, _handDirection);
        _handRaycaster.far = INTERACTION_RADIUS;

        const isObjectInRange =
          _cameraPos.distanceTo(_objectPos) <= INTERACTION_RADIUS;
        const hits = groupRef.current
          ? _handRaycaster.intersectObject(groupRef.current, true)
          : [];

        isHandHolding.current = isObjectInRange && hits.length > 0;
      }
    } else {
      isHandHolding.current = false;
    }

    if (!isHolding.current && !isHandHolding.current) return;

    if (fistHand && isHandHolding.current) {
      _holdTarget
        .copy(_cameraPos)
        .addScaledVector(_handDirection, params.holdDistance);
    } else {
      camera.getWorldDirection(_holdTarget);
      _holdTarget.multiplyScalar(params.holdDistance).add(camera.position);
    }

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
      <group ref={groupRef}>
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
            if (
              !rbRef.current ||
              params.throwBoost === GRAB_THROW_BOOST_DEFAULT
            )
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
      </group>
    </RigidBody>
  );
}
