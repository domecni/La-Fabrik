import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import gsap from "gsap";
import * as THREE from "three";
import { InteractableObject } from "@/components/three/interaction/InteractableObject";
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
import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";
import { InteractionManager } from "@/managers/InteractionManager";
import type {
  HandTrackingHand,
  HandTrackingLandmark,
} from "@/types/handTracking/handTracking";
import type { ColliderShape, Vector3Tuple } from "@/types/three/three";

interface GrabbableObjectProps {
  position: Vector3Tuple;
  children: React.ReactNode;
  colliders?: ColliderShape;
  label?: string;
  handControlled?: boolean;
  onPositionChange?: (position: THREE.Vector3) => void;
  onSnap?: (position: THREE.Vector3) => void;
  snapDuration?: number;
  snapRadius?: number;
  snapTargets?: readonly Vector3Tuple[];
}

const grabDebugParams = {
  stiffness: GRAB_STIFFNESS_DEFAULT,
  throwBoost: GRAB_THROW_BOOST_DEFAULT,
  holdDistance: GRAB_HOLD_DISTANCE_DEFAULT,
};

const ZERO_ANGULAR_VELOCITY = { x: 0, y: 0, z: 0 };

const _holdTarget = new THREE.Vector3();
const _currentPos = new THREE.Vector3();
const _velocity = new THREE.Vector3();
const _handNdc = new THREE.Vector3();
const _handHitNdc = new THREE.Vector3();
const _handDirection = new THREE.Vector3();
const _handHitDirection = new THREE.Vector3();
const _cameraPos = new THREE.Vector3();
const _objectPos = new THREE.Vector3();
const _snapPosition = new THREE.Vector3();
const _snapTargetWorldPosition = new THREE.Vector3();
const _handRaycaster = new THREE.Raycaster();

const HAND_GRAB_SCREEN_RADIUS = 0.04;
const HAND_DEPTH_SENSITIVITY = 4;
const HAND_HIT_OFFSETS: Array<[number, number]> = [
  [0, 0],
  [HAND_GRAB_SCREEN_RADIUS, 0],
  [-HAND_GRAB_SCREEN_RADIUS, 0],
  [0, HAND_GRAB_SCREEN_RADIUS],
  [0, -HAND_GRAB_SCREEN_RADIUS],
];

function getHandCenterPoint(hand: HandTrackingHand): HandTrackingLandmark {
  const landmarks = hand.landmarks;
  if (landmarks.length === 0) {
    return { x: hand.x, y: hand.y, z: hand.z };
  }

  let minX = landmarks[0]!.x;
  let maxX = landmarks[0]!.x;
  let minY = landmarks[0]!.y;
  let maxY = landmarks[0]!.y;

  landmarks.forEach((landmark) => {
    minX = Math.min(minX, landmark.x);
    maxX = Math.max(maxX, landmark.x);
    minY = Math.min(minY, landmark.y);
    maxY = Math.max(maxY, landmark.y);
  });

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    z: hand.z,
  };
}

function getHandHit(
  group: THREE.Group | null,
  camera: THREE.Camera,
  cameraPos: THREE.Vector3,
  handCenter: HandTrackingLandmark,
): THREE.Intersection | null {
  if (!group) return null;

  const baseX = (1 - handCenter.x) * 2 - 1;
  const baseY = -handCenter.y * 2 + 1;

  for (const [offsetX, offsetY] of HAND_HIT_OFFSETS) {
    _handHitNdc.set(baseX + offsetX, baseY + offsetY, 0.5);
    _handHitNdc.unproject(camera);
    _handHitDirection.subVectors(_handHitNdc, cameraPos).normalize();
    _handRaycaster.set(cameraPos, _handHitDirection);
    _handRaycaster.far = INTERACTION_RADIUS;

    const hits = _handRaycaster.intersectObject(group, true);
    if (hits?.length > 0) return hits[0] ?? null;
  }

  return null;
}

export function GrabbableObject({
  position,
  children,
  colliders = GRAB_DEFAULT_COLLIDERS,
  label = GRAB_DEFAULT_LABEL,
  handControlled = false,
  onPositionChange,
  onSnap,
  snapDuration = 0.25,
  snapRadius = 0,
  snapTargets = [],
}: GrabbableObjectProps): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const { hands } = useHandTrackingSnapshot();
  const spaceRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const rbRef = useRef<RapierRigidBody>(null);
  const isHolding = useRef(false);
  const isHandHolding = useRef(false);
  const handHoldDistance = useRef<number | null>(null);
  const handHoldStartZ = useRef<number | null>(null);
  const snapTween = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    return () => {
      snapTween.current?.kill();
    };
  }, []);

  function snapToNearestTarget(): void {
    const body = rbRef.current;
    if (!body || snapTargets.length === 0 || snapRadius <= 0) return;

    const translation = body.translation();
    _currentPos.set(translation.x, translation.y, translation.z);

    let nearestTarget: Vector3Tuple | null = null;
    let nearestTargetWorld: Vector3Tuple | null = null;
    let nearestDistance = snapRadius;
    snapTargets.forEach((target) => {
      _snapTargetWorldPosition.set(target[0], target[1], target[2]);
      spaceRef.current?.localToWorld(_snapTargetWorldPosition);
      const distance = _currentPos.distanceTo(_snapTargetWorldPosition);
      if (distance <= nearestDistance) {
        nearestDistance = distance;
        nearestTarget = target;
        nearestTargetWorld = [
          _snapTargetWorldPosition.x,
          _snapTargetWorldPosition.y,
          _snapTargetWorldPosition.z,
        ];
      }
    });

    if (!nearestTarget || !nearestTargetWorld) return;

    snapTween.current?.kill();
    const animatedPosition = {
      x: _currentPos.x,
      y: _currentPos.y,
      z: _currentPos.z,
    };

    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel(ZERO_ANGULAR_VELOCITY, true);
    snapTween.current = gsap.to(animatedPosition, {
      x: nearestTargetWorld[0],
      y: nearestTargetWorld[1],
      z: nearestTargetWorld[2],
      duration: snapDuration,
      ease: "power2.out",
      onUpdate: () => {
        body.setTranslation(animatedPosition, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      },
      onComplete: () => {
        _snapPosition.set(
          animatedPosition.x,
          animatedPosition.y,
          animatedPosition.z,
        );
        onSnap?.(_snapPosition);
      },
    });
  }

  useDebugFolder("GrabbableObject", (folder) => {
    folder
      .add(
        grabDebugParams,
        "stiffness",
        GRAB_STIFFNESS_MIN,
        GRAB_STIFFNESS_MAX,
        GRAB_STIFFNESS_STEP,
      )
      .name("Hold stiffness");
    folder
      .add(
        grabDebugParams,
        "throwBoost",
        GRAB_THROW_BOOST_MIN,
        GRAB_THROW_BOOST_MAX,
        GRAB_THROW_BOOST_STEP,
      )
      .name("Throw boost");
    folder
      .add(
        grabDebugParams,
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
    onPositionChange?.(_currentPos);

    if (fistHand) {
      const handCenter = getHandCenterPoint(fistHand);

      _handNdc.set((1 - handCenter.x) * 2 - 1, -handCenter.y * 2 + 1, 0.5);
      _handNdc.unproject(camera);
      camera.getWorldPosition(_cameraPos);
      _handDirection.subVectors(_handNdc, _cameraPos).normalize();

      if (!isHandHolding.current) {
        _objectPos.copy(_currentPos);

        const isObjectInRange =
          _cameraPos.distanceTo(_objectPos) <= INTERACTION_RADIUS;
        const hit = isObjectInRange
          ? getHandHit(groupRef.current, camera, _cameraPos, handCenter)
          : null;

        isHandHolding.current = Boolean(hit);
        handHoldDistance.current = hit ? GRAB_HOLD_DISTANCE_DEFAULT : null;
        handHoldStartZ.current = hit ? fistHand.z : null;
        InteractionManager.getInstance().setHandHolding(isHandHolding.current);
      }
    } else {
      if (isHandHolding.current) {
        snapToNearestTarget();
      }
      isHandHolding.current = false;
      handHoldDistance.current = null;
      handHoldStartZ.current = null;
      InteractionManager.getInstance().setHandHolding(false);
    }

    if (!isHolding.current && !isHandHolding.current) return;

    if (fistHand && isHandHolding.current) {
      const depthOffset =
        handHoldStartZ.current === null
          ? 0
          : (fistHand.z - handHoldStartZ.current) * HAND_DEPTH_SENSITIVITY;
      const holdDistance = THREE.MathUtils.clamp(
        (handHoldDistance.current ?? grabDebugParams.holdDistance) +
          depthOffset,
        GRAB_HOLD_DISTANCE_MIN,
        GRAB_HOLD_DISTANCE_MAX,
      );

      _holdTarget
        .copy(_cameraPos)
        .addScaledVector(_handDirection, holdDistance);
    } else {
      camera.getWorldDirection(_holdTarget);
      _holdTarget
        .multiplyScalar(grabDebugParams.holdDistance)
        .add(camera.position);
    }

    _velocity
      .subVectors(_holdTarget, _currentPos)
      .multiplyScalar(grabDebugParams.stiffness);

    rbRef.current.setLinvel(
      { x: _velocity.x, y: _velocity.y, z: _velocity.z },
      true,
    );
    rbRef.current.setAngvel(ZERO_ANGULAR_VELOCITY, true);
  });

  return (
    <group ref={spaceRef}>
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
              snapToNearestTarget();
              if (
                !rbRef.current ||
                grabDebugParams.throwBoost === GRAB_THROW_BOOST_DEFAULT
              )
                return;
              const v = rbRef.current.linvel();
              rbRef.current.setLinvel(
                {
                  x: v.x * grabDebugParams.throwBoost,
                  y: v.y * grabDebugParams.throwBoost,
                  z: v.z * grabDebugParams.throwBoost,
                },
                true,
              );
            }}
          >
            {children}
          </InteractableObject>
        </group>
      </RigidBody>
    </group>
  );
}
