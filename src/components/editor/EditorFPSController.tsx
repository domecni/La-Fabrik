import { useEffect, useRef, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const WALK_SPEED = 8;
const JUMP_SPEED = 7;
const MOUSE_SENSITIVITY = 0.002;

export default function EditorFPSController() {
  const { camera } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const velocity = useRef(new THREE.Vector3());
  const wantsJump = useRef(false);
  const mouseLocked = useRef(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keys.current.add(e.code);

    switch (e.key.toLowerCase()) {
      case " ":
        wantsJump.current = true;
        e.preventDefault();
        break;
      case "e":
        e.preventDefault();
        break;
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keys.current.delete(e.code);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!mouseLocked.current) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      camera.rotation.y -= movementX * MOUSE_SENSITIVITY;
      camera.rotation.x -= movementY * MOUSE_SENSITIVITY;
      camera.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, camera.rotation.x),
      );
    },
    [camera],
  );

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 0) {
      if (!mouseLocked.current) {
        mouseLocked.current = true;
        document.body.requestPointerLock();
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handleMouseDown]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    if (!mouseLocked.current) return;

    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);
    const up = new THREE.Vector3(0, 1, 0);

    forward.applyQuaternion(camera.quaternion);
    right.applyQuaternion(camera.quaternion);

    forward.setY(0);
    right.setY(0);

    if (forward.lengthSq() > 0) forward.normalize();
    if (right.lengthSq() > 0) right.normalize();
    if (up.lengthSq() > 0) up.normalize();

    const isForward =
      keys.current.has("KeyW") ||
      keys.current.has("ArrowUp") ||
      keys.current.has("KeyZ");
    const isBackward =
      keys.current.has("KeyS") || keys.current.has("ArrowDown");
    const isLeft =
      keys.current.has("KeyA") ||
      keys.current.has("ArrowLeft") ||
      keys.current.has("KeyQ");
    const isRight = keys.current.has("KeyD") || keys.current.has("ArrowRight");

    const wishDir = new THREE.Vector3();
    if (isForward) wishDir.add(forward);
    if (isBackward) wishDir.sub(forward);
    if (isLeft) wishDir.sub(right);
    if (isRight) wishDir.add(right);

    if (wishDir.lengthSq() > 0) {
      wishDir.normalize().multiplyScalar(WALK_SPEED * dt * 10);
      velocity.current.x += wishDir.x;
      velocity.current.z += wishDir.z;
    }

    const damping = Math.exp(-8 * dt);
    velocity.current.x *= damping;
    velocity.current.z *= damping;

    if (wantsJump.current) {
      velocity.current.y = JUMP_SPEED;
      wantsJump.current = false;
    } else {
      velocity.current.y -= 20 * dt;
    }

    camera.position.copy(
      camera.position.clone().add(velocity.current.clone().multiplyScalar(dt)),
    );

    if (camera.position.y < 2) {
      camera.position.y = 2;
      velocity.current.y = 0;
      velocity.current.x *= 0.9;
      velocity.current.z *= 0.9;
    }
  });

  return null;
}
