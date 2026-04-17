import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Capsule } from "three/addons/math/Capsule.js";
import type { Octree } from "three/addons/math/Octree.js";
import { InteractionManager } from "@/stateManager/InteractionManager";
import {
  PLAYER_EYE_HEIGHT,
  PLAYER_CAPSULE_RADIUS,
} from "@/world/player/PlayerCamera";

const WALK_SPEED = 11;
const AIR_CONTROL = 0.35;
const JUMP_SPEED = 9;
const GRAVITY = 30;

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
}

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _wishDir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _translateVec = new THREE.Vector3();

export function PlayerController({ octree }: PlayerControllerProps): null {
  const camera = useThree((state) => state.camera);
  const keys = useRef<Keys>({ ...DEFAULT_KEYS });
  const velocity = useRef(new THREE.Vector3());
  const onFloor = useRef(false);
  const wantsJump = useRef(false);

  // Capsule: start = feet, end = eyes
  const capsule = useRef(
    new Capsule(
      new THREE.Vector3(0, PLAYER_CAPSULE_RADIUS, 0),
      new THREE.Vector3(0, PLAYER_EYE_HEIGHT - PLAYER_CAPSULE_RADIUS, 0),
      PLAYER_CAPSULE_RADIUS,
    ),
  );

  // Sync capsule to camera spawn position on mount
  useEffect(() => {
    const spawnY = camera.position.y;
    capsule.current.start.set(
      0,
      spawnY - PLAYER_EYE_HEIGHT + PLAYER_CAPSULE_RADIUS,
      0,
    );
    capsule.current.end.set(0, spawnY, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interaction = InteractionManager.getInstance();

    const handleKeyDown = (event: KeyboardEvent): void => {
      switch (event.key.toLowerCase()) {
        case "z":
          keys.current.forward = true;
          break;
        case "s":
          keys.current.backward = true;
          break;
        case "q":
          keys.current.left = true;
          break;
        case "d":
          keys.current.right = true;
          break;
        case " ":
          wantsJump.current = true;
          break;
        case "e":
          if (interaction.getState().focused?.kind === "trigger") {
            interaction.pressInteract();
          }
          break;
        default:
          return;
      }
      event.preventDefault();
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      switch (event.key.toLowerCase()) {
        case "z":
          keys.current.forward = false;
          break;
        case "s":
          keys.current.backward = false;
          break;
        case "q":
          keys.current.left = false;
          break;
        case "d":
          keys.current.right = false;
          break;
        case "e":
          if (interaction.getState().focused?.kind === "trigger") {
            interaction.releaseInteract();
          }
          break;
        default:
          return;
      }
      event.preventDefault();
    };

    const handleMouseDown = (event: MouseEvent): void => {
      if (event.button !== 0) return;
      if (interaction.getState().focused?.kind === "grab") {
        interaction.pressInteract();
      }
    };

    const handleMouseUp = (event: MouseEvent): void => {
      if (event.button !== 0) return;
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
    // Clamp delta so physics don't explode on tab focus regain
    const dt = Math.min(delta, 0.05);

    // Compute wish direction from camera yaw (XZ only)
    camera.getWorldDirection(_forward);
    _forward.setY(0);
    if (_forward.lengthSq() > 0) {
      _forward.normalize();
      _right.crossVectors(_forward, _up).normalize();
    }

    _wishDir.set(0, 0, 0);
    if (keys.current.forward) _wishDir.add(_forward);
    if (keys.current.backward) _wishDir.sub(_forward);
    if (keys.current.left) _wishDir.sub(_right);
    if (keys.current.right) _wishDir.add(_right);
    if (_wishDir.lengthSq() > 0) _wishDir.normalize();

    // Accelerate horizontally
    const accel = onFloor.current ? WALK_SPEED : WALK_SPEED * AIR_CONTROL;
    velocity.current.x += _wishDir.x * accel * dt * 9;
    velocity.current.z += _wishDir.z * accel * dt * 9;

    // Exponential damping on XZ
    const damping = Math.exp(-8 * dt);
    velocity.current.x *= damping;
    velocity.current.z *= damping;

    // Gravity + jump
    if (onFloor.current) {
      velocity.current.y = Math.max(0, velocity.current.y);
      if (wantsJump.current) {
        velocity.current.y = JUMP_SPEED;
        onFloor.current = false;
      }
    } else {
      velocity.current.y -= GRAVITY * dt;
    }
    wantsJump.current = false;

    // Move capsule
    _translateVec.copy(velocity.current).multiplyScalar(dt);
    capsule.current.translate(_translateVec);

    // Resolve collisions against octree
    if (octree) {
      const result = octree.capsuleIntersect(capsule.current);
      onFloor.current = false;

      if (result) {
        onFloor.current = result.normal.y > 0;

        if (!onFloor.current) {
          // Cancel velocity component going into the wall
          const vn = result.normal.dot(velocity.current);
          velocity.current.addScaledVector(result.normal, -vn);
        } else {
          velocity.current.y = Math.max(0, velocity.current.y);
        }

        // Push capsule out of geometry
        capsule.current.translate(
          result.normal.clone().multiplyScalar(result.depth),
        );
      }
    }

    // Sync camera to capsule top (eye position)
    camera.position.copy(capsule.current.end);
  });

  return null;
}
