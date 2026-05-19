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
      // Teleport player capsule to the bike's spawning position [0, 10, 0]
      const targetPos: Vector3Tuple = [0, 10, 0];
      capsule.current.start.set(
        targetPos[0],
        targetPos[1] - PLAYER_EYE_HEIGHT + PLAYER_CAPSULE_RADIUS,
        targetPos[2],
      );
      capsule.current.end.set(...targetPos);
      velocity.current.set(0, 0, 0);
      onFloor.current = false;
      wantsJump.current = false;

      // Initialize ebikeAngle to the bike's visual orientation (0 by default)
      ebikeAngle.current = 0;

      // Position the camera exactly at the EBIKE_CAMERA_TRANSFORM offset [-3, 8, 0]
      const cameraOffset = new THREE.Vector3(-3, 8, 0);
      const camPos = new THREE.Vector3()
        .copy(capsule.current.end)
        .add(cameraOffset);
      camera.position.copy(camPos);
      camera.lookAt(capsule.current.end.x, capsule.current.end.y + 1, capsule.current.end.z);
    } else if (movementMode === "walk" && prevMovementModeRef.current === "ebike") {
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

    if (movementModeRef.current === "ebike") {
      _forward.set(Math.sin(ebikeAngle.current), 0, Math.cos(ebikeAngle.current)).normalize();
      _right.crossVectors(_forward, _up).normalize();
    } else {
      camera.getWorldDirection(_forward);
      _forward.setY(0);
      if (_forward.lengthSq() > 0) {
        _forward.normalize();
        _right.crossVectors(_forward, _up).normalize();
      }
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
      // Offset of position rotated by e-bike angle
      const cameraOffset = new THREE.Vector3(...EBIKE_CAMERA_TRANSFORM.position);
      cameraOffset.applyAxisAngle(_up, ebikeAngle.current);

      const camPos = new THREE.Vector3()
        .copy(capsule.current.end)
        .add(cameraOffset);
      camera.position.copy(camPos);

      // Set camera rotation strictly to EBIKE_CAMERA_TRANSFORM.rotation + ebikeAngle.current
      const pitchRad = THREE.MathUtils.degToRad(EBIKE_CAMERA_TRANSFORM.rotation[0]);
      const yawRad = THREE.MathUtils.degToRad(EBIKE_CAMERA_TRANSFORM.rotation[1]) + ebikeAngle.current;
      const rollRad = THREE.MathUtils.degToRad(EBIKE_CAMERA_TRANSFORM.rotation[2]);
      camera.rotation.set(pitchRad, yawRad, rollRad, "YXZ");
    } else {
      camera.position.copy(capsule.current.end);
    }

    // Save player capsule end position and camera yaw globally so other components (like Ebike) can access it
    (window as any).playerPos = [capsule.current.end.x, capsule.current.end.y, capsule.current.end.z];
    (window as any).ebikeAngle = ebikeAngle.current;
  });

  return null;
}
