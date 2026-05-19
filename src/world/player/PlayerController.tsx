import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Capsule } from "three/addons/math/Capsule.js";
import type { Octree } from "three/addons/math/Octree.js";
import {
  INTERACT_KEY,
  JUMP_KEY,
  MOVE_BACKWARD_KEY,
  MOVE_FORWARD_KEY,
  MOVE_LEFT_KEY,
  MOVE_RIGHT_KEY,
  PRIMARY_INTERACT_MOUSE_BUTTON,
} from "@/data/input/keybindings";
import {
  PLAYER_ACCELERATION_MULTIPLIER,
  PLAYER_AIR_CONTROL_FACTOR,
  PLAYER_CAPSULE_RADIUS,
  PLAYER_EYE_HEIGHT,
  PLAYER_GRAVITY,
  PLAYER_JUMP_SPEED,
  PLAYER_MAX_DELTA,
  PLAYER_XZ_DAMPING_FACTOR,
} from "@/data/player/playerConfig";
import { useRepairMovementLocked } from "@/hooks/gameplay/useRepairMovementLocked";
import { InteractionManager } from "@/managers/InteractionManager";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useSettingsStore } from "@/managers/stores/useSettingsStore";
import type { Vector3Tuple } from "@/types/three/three";
import { EBIKE_CAMERA_TRANSFORM } from "@/components/ebike/Ebike";

type Keys = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
};

const DEFAULT_KEYS: Keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
};

interface PlayerControllerProps {
  octree: Octree | null;
  spawnPosition: Vector3Tuple;
}

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _wishDir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _translateVec = new THREE.Vector3();
const _collisionCorrection = new THREE.Vector3();

function createSpawnCapsule(spawnPosition: Vector3Tuple): Capsule {
  return new Capsule(
    new THREE.Vector3(
      spawnPosition[0],
      spawnPosition[1] - PLAYER_EYE_HEIGHT + PLAYER_CAPSULE_RADIUS,
      spawnPosition[2],
    ),
    new THREE.Vector3(...spawnPosition),
    PLAYER_CAPSULE_RADIUS,
  );
}

function isPlayerInputLocked(): boolean {
  return (
    useSettingsStore.getState().isSettingsMenuOpen ||
    useGameStore.getState().isCinematicPlaying
  );
}

function setMovementKey(keys: Keys, key: string, pressed: boolean): boolean {
  switch (key.toLowerCase()) {
    case MOVE_FORWARD_KEY:
      keys.forward = pressed;
      return true;
    case MOVE_BACKWARD_KEY:
      keys.backward = pressed;
      return true;
    case MOVE_LEFT_KEY:
      keys.left = pressed;
      return true;
    case MOVE_RIGHT_KEY:
      keys.right = pressed;
      return true;
    default:
      return false;
  }
}

export function PlayerController({
  octree,
  spawnPosition,
}: PlayerControllerProps): null {
  const camera = useThree((state) => state.camera);
  const movementLocked = useRepairMovementLocked();
  const movementLockedRef = useRef(movementLocked);
  const keys = useRef<Keys>({ ...DEFAULT_KEYS });
  const velocity = useRef(new THREE.Vector3());
  const onFloor = useRef(false);
  const wantsJump = useRef(false);
  const initializedRef = useRef(false);
  const canMove = useGameStore((state) => state.missionFlow.canMove);
  const currentSpeed = useGameStore((state) => state.player.currentSpeed);
  const movementMode = useGameStore((state) => state.player.movementMode);
  const movementModeRef = useRef(movementMode);
  const prevMovementModeRef = useRef(movementMode);
  const ebikeAngle = useRef(0);

  useEffect(() => {
    movementModeRef.current = movementMode;
  }, [movementMode]);
  useEffect(() => {
    if (movementMode === "ebike") {
      // Teleport player capsule to the bike's current parked position
      const targetPos: Vector3Tuple = (window as any).ebikeParkedPosition || [0, 8.2, 0];
      const targetRot: number = (window as any).ebikeParkedRotation || 0;

      const headY = targetPos[1] + PLAYER_EYE_HEIGHT;
      const bottomY = targetPos[1] + PLAYER_CAPSULE_RADIUS;

      capsule.current.start.set(
        targetPos[0],
        bottomY,
        targetPos[2],
      );
      capsule.current.end.set(
        targetPos[0],
        headY,
        targetPos[2],
      );
      velocity.current.set(0, 0, 0);
      onFloor.current = false;
      wantsJump.current = false;

      // Initialize ebikeAngle to the bike's actual parked orientation!
      ebikeAngle.current = targetRot;

      // Position the camera exactly at the EBIKE_CAMERA_TRANSFORM offset rotated by targetRot
      const cameraOffset = new THREE.Vector3(...EBIKE_CAMERA_TRANSFORM.position);
      cameraOffset.applyAxisAngle(_up, targetRot);

      const camPos = new THREE.Vector3()
        .copy(capsule.current.end)
        .add(cameraOffset);
      camera.position.copy(camPos);

      // Set the camera's exact rotation according to EBIKE_CAMERA_TRANSFORM.rotation + targetRot
      const pitchRad = THREE.MathUtils.degToRad(EBIKE_CAMERA_TRANSFORM.rotation[0]);
      const yawRad = THREE.MathUtils.degToRad(EBIKE_CAMERA_TRANSFORM.rotation[1]) + targetRot;
      const rollRad = THREE.MathUtils.degToRad(EBIKE_CAMERA_TRANSFORM.rotation[2]);
      camera.rotation.set(pitchRad, yawRad, rollRad, "YXZ");
    } else if (movementMode === "walk" && prevMovementModeRef.current === "ebike") {
      // Restore default walk FOV
      const perspectiveCam = camera as THREE.PerspectiveCamera;
      perspectiveCam.fov = 60;
      perspectiveCam.updateProjectionMatrix();

      // Dismount! Teleport player capsule 3 units to the right
      const rightDir = new THREE.Vector3();
      camera.getWorldDirection(_forward);
      _forward.setY(0).normalize();
      rightDir.crossVectors(_forward, _up).normalize();

      const shift = rightDir.multiplyScalar(3);
      capsule.current.translate(shift);
      camera.position.copy(capsule.current.end);
    }
    prevMovementModeRef.current = movementMode;
  }, [movementMode, camera]);

  const capsule = useRef(createSpawnCapsule(spawnPosition));

  useLayoutEffect(() => {
    capsule.current.start.set(
      spawnPosition[0],
      spawnPosition[1] - PLAYER_EYE_HEIGHT + PLAYER_CAPSULE_RADIUS,
      spawnPosition[2],
    );
    capsule.current.end.set(...spawnPosition);
    velocity.current.set(0, 0, 0);
    onFloor.current = false;
    wantsJump.current = false;
    camera.position.copy(capsule.current.end);
    initializedRef.current = true;
  }, [camera, spawnPosition]);

  useEffect(() => {
    movementLockedRef.current = movementLocked;

    if (!movementLocked) return;

    keys.current = { ...DEFAULT_KEYS };
    wantsJump.current = false;
    velocity.current.setX(0);
    velocity.current.setZ(0);
  }, [movementLocked]);

  useEffect(() => {
    const interaction = InteractionManager.getInstance();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (isPlayerInputLocked()) return;

      if (setMovementKey(keys.current, event.key, true)) {
        if (movementLockedRef.current) {
          keys.current = { ...DEFAULT_KEYS };
        }
        event.preventDefault();
        return;
      }

      if (event.key === JUMP_KEY) {
        if (movementLockedRef.current) {
          wantsJump.current = false;
          event.preventDefault();
          return;
        }

        wantsJump.current = true;
        event.preventDefault();
        return;
      }

      if (event.key.toLowerCase() === INTERACT_KEY) {
        if (interaction.getState().focused?.kind === "trigger") {
          interaction.pressInteract();
        }
        event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      if (isPlayerInputLocked()) return;

      if (setMovementKey(keys.current, event.key, false)) {
        event.preventDefault();
      }
    };

    const handleMouseDown = (event: MouseEvent): void => {
      if (isPlayerInputLocked()) return;
      if (event.button !== PRIMARY_INTERACT_MOUSE_BUTTON) return;
      if (interaction.getState().focused?.kind === "grab") {
        interaction.pressInteract();
      }
    };

    const handleMouseUp = (event: MouseEvent): void => {
      if (isPlayerInputLocked()) return;
      if (event.button !== PRIMARY_INTERACT_MOUSE_BUTTON) return;
      if (interaction.getState().holding) {
        interaction.releaseInteract();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      keys.current = { ...DEFAULT_KEYS };
    };
  }, []);

  useFrame((_, delta) => {
    if (!initializedRef.current) return;

    if (isPlayerInputLocked() || !canMove) {
      keys.current = { ...DEFAULT_KEYS };
      velocity.current.set(0, 0, 0);
      wantsJump.current = false;
      return;
    }

    const dt = Math.min(delta, PLAYER_MAX_DELTA);

    // Rotate camera on Y-axis for ebike steering
    if (movementModeRef.current === "ebike") {
      const turnSpeed = 1.8; // radians per second
      if (keys.current.left) {
        ebikeAngle.current += turnSpeed * dt;
      }
      if (keys.current.right) {
        ebikeAngle.current -= turnSpeed * dt;
      }
    }

    camera.getWorldDirection(_forward);
    _forward.setY(0);
    if (_forward.lengthSq() > 0) {
      _forward.normalize();
      _right.crossVectors(_forward, _up).normalize();
    }

    _wishDir.set(0, 0, 0);
    if (!movementLocked) {
      if (keys.current.forward) _wishDir.add(_forward);
      if (keys.current.backward) _wishDir.sub(_forward);
      if (movementModeRef.current !== "ebike") {
        if (keys.current.left) _wishDir.sub(_right);
        if (keys.current.right) _wishDir.add(_right);
      }
    }
    if (_wishDir.lengthSq() > 0) _wishDir.normalize();

    const accel = onFloor.current
      ? currentSpeed
      : currentSpeed * PLAYER_AIR_CONTROL_FACTOR;
    velocity.current.x +=
      _wishDir.x * accel * dt * PLAYER_ACCELERATION_MULTIPLIER;
    velocity.current.z +=
      _wishDir.z * accel * dt * PLAYER_ACCELERATION_MULTIPLIER;

    const damping = Math.exp(-PLAYER_XZ_DAMPING_FACTOR * dt);
    velocity.current.x *= damping;
    velocity.current.z *= damping;

    if (onFloor.current) {
      velocity.current.y = Math.max(0, velocity.current.y);
      if (wantsJump.current) {
        velocity.current.y = PLAYER_JUMP_SPEED;
        onFloor.current = false;
      }
    } else {
      velocity.current.y -= PLAYER_GRAVITY * dt;
    }
    wantsJump.current = false;

    _translateVec.copy(velocity.current).multiplyScalar(dt);
    capsule.current.translate(_translateVec);

    if (octree) {
      const result = octree.capsuleIntersect(capsule.current);
      onFloor.current = false;

      if (result) {
        onFloor.current = result.normal.y > 0;

        if (!onFloor.current) {
          const vn = result.normal.dot(velocity.current);
          velocity.current.addScaledVector(result.normal, -vn);
        } else {
          velocity.current.y = Math.max(0, velocity.current.y);
        }

        capsule.current.translate(
          _collisionCorrection.copy(result.normal).multiplyScalar(result.depth),
        );
      }
    }

    if (movementModeRef.current === "ebike") {
      // Calculate dynamic steering factor
      let targetSteer = 0;
      if (keys.current.left) targetSteer = 1;
      else if (keys.current.right) targetSteer = -1;

      const currentSteer = (window as any).ebikeSteerFactor || 0;
      const steerFactor = THREE.MathUtils.lerp(currentSteer, targetSteer, 8 * dt);
      (window as any).ebikeSteerFactor = steerFactor;

      // 1. Dynamic FOV stretch based on speed!
      const speed = velocity.current.length();
      const targetFov = 60 + Math.min(speed * 0.35, 9); // stretch FOV up to 9 degrees at high speed (halved by two)!
      const perspectiveCam = camera as THREE.PerspectiveCamera;
      perspectiveCam.fov = THREE.MathUtils.lerp(perspectiveCam.fov, targetFov, 6 * dt);
      perspectiveCam.updateProjectionMatrix();

      // 2. Camera lag & dynamic swing trailing
      const cameraOffset = new THREE.Vector3(...EBIKE_CAMERA_TRANSFORM.position);
      cameraOffset.applyAxisAngle(_up, ebikeAngle.current);

      // Swing camera to optimize the view for both left and right turns:
      // Since the camera is on the left (X = -3.5), it naturally trails beautifully in right turns,
      // but cuts forward in left turns. We compensate by pushing the camera backward (+Z) during left turns!
      const swingX = -Math.abs(steerFactor) * 1.5;
      const swingZ = steerFactor > 0 ? steerFactor * 2.5 : steerFactor * 1.0;

      const cameraSwing = new THREE.Vector3(swingX, 0, swingZ);
      cameraSwing.applyAxisAngle(_up, ebikeAngle.current);
      cameraOffset.add(cameraSwing);

      const targetCamPos = new THREE.Vector3()
        .copy(capsule.current.end)
        .add(cameraOffset);

      // Smoothly lerp camera position to eliminate rigidity
      camera.position.lerp(targetCamPos, 12 * dt);

      // 3. Dynamic camera roll based on steering!
      const pitchRad = THREE.MathUtils.degToRad(EBIKE_CAMERA_TRANSFORM.rotation[0]);
      const yawRad = THREE.MathUtils.degToRad(EBIKE_CAMERA_TRANSFORM.rotation[1]) + ebikeAngle.current;
      // COMMENTED OUT: Camera roll/tilt during turns (keeping it flat)
      // const rollRad = THREE.MathUtils.degToRad(EBIKE_CAMERA_TRANSFORM.rotation[2]) - steerFactor * 0.08;
      const rollRad = THREE.MathUtils.degToRad(EBIKE_CAMERA_TRANSFORM.rotation[2]);
      camera.rotation.set(pitchRad, yawRad, rollRad, "YXZ");

      // 4. Synchronize visual e-bike position and apply leaning!
      const ebikeVisual = (window as any).ebikeVisualGroup?.current;
      if (ebikeVisual) {
        ebikeVisual.position.set(
          capsule.current.end.x,
          capsule.current.end.y - PLAYER_EYE_HEIGHT,
          capsule.current.end.z
        );
        // Lean (roll) the bike sideways in turns (up to 15 degrees)
        const leanAngle = steerFactor * 0.26; // rotate in direction of turn!
        ebikeVisual.rotation.set(0, ebikeAngle.current, leanAngle, "YXZ");
      }
    } else {
      camera.position.copy(capsule.current.end);
    }

    // Save player capsule end position and camera yaw globally so other components (like Ebike) can access it
    (window as any).playerPos = [capsule.current.end.x, capsule.current.end.y, capsule.current.end.z];
    (window as any).ebikeAngle = ebikeAngle.current;
  });

  return null;
}
