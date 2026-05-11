import { useEffect, useRef } from "react";
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
  PLAYER_WALK_SPEED,
  PLAYER_XZ_DAMPING_FACTOR,
} from "@/data/player/playerConfig";
import { useRepairMovementLocked } from "@/hooks/gameplay/useRepairMovementLocked";
import { InteractionManager } from "@/managers/InteractionManager";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useSettingsStore } from "@/managers/stores/useSettingsStore";
import type { Vector3Tuple } from "@/types/three/three";

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

  const capsule = useRef(
    new Capsule(
      new THREE.Vector3(0, PLAYER_CAPSULE_RADIUS, 0),
      new THREE.Vector3(0, PLAYER_EYE_HEIGHT - PLAYER_CAPSULE_RADIUS, 0),
      PLAYER_CAPSULE_RADIUS,
    ),
  );

  useEffect(() => {
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
    if (isPlayerInputLocked()) {
      keys.current = { ...DEFAULT_KEYS };
      velocity.current.set(0, 0, 0);
      wantsJump.current = false;
      return;
    }

    const dt = Math.min(delta, PLAYER_MAX_DELTA);

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
      if (keys.current.left) _wishDir.sub(_right);
      if (keys.current.right) _wishDir.add(_right);
    }
    if (_wishDir.lengthSq() > 0) _wishDir.normalize();

    const accel = onFloor.current
      ? PLAYER_WALK_SPEED
      : PLAYER_WALK_SPEED * PLAYER_AIR_CONTROL_FACTOR;
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

    camera.position.copy(capsule.current.end);
  });

  return null;
}
