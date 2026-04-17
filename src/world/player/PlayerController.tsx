import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { InteractionManager } from "@/stateManager/InteractionManager";
import { PLAYER_EYE_HEIGHT } from "@/world/player/PlayerCamera";

const MOVE_SPEED = 5;
const GRAVITY = -20;
const JUMP_VELOCITY = 7;
const FLOOR_Y = 0;

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

export function PlayerController(): null {
  const camera = useThree((state) => state.camera);
  const keys = useRef<Keys>({ ...DEFAULT_KEYS });
  const velocityY = useRef(0);
  const isGrounded = useRef(false);
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const movement = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3(0, 1, 0));

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
          keys.current.jump = true;
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
    const currentForward = forward.current;
    const currentRight = right.current;
    const currentMovement = movement.current;

    camera.getWorldDirection(currentForward);
    currentForward.setY(0);

    if (currentForward.lengthSq() > 0) {
      currentForward.normalize();
      currentRight.crossVectors(currentForward, up.current).normalize();
    }

    currentMovement.set(0, 0, 0);

    if (keys.current.forward) currentMovement.add(currentForward);
    if (keys.current.backward) currentMovement.sub(currentForward);
    if (keys.current.left) currentMovement.sub(currentRight);
    if (keys.current.right) currentMovement.add(currentRight);

    if (currentMovement.lengthSq() > 0) {
      currentMovement.normalize().multiplyScalar(MOVE_SPEED * delta);
      camera.position.add(currentMovement);
    }

    const groundY = FLOOR_Y + PLAYER_EYE_HEIGHT;
    isGrounded.current = camera.position.y <= groundY + 0.01;

    if (keys.current.jump && isGrounded.current) {
      velocityY.current = JUMP_VELOCITY;
      keys.current.jump = false;
    }

    if (!isGrounded.current) {
      velocityY.current += GRAVITY * delta;
    } else if (velocityY.current < 0) {
      velocityY.current = 0;
    }

    camera.position.setY(
      Math.max(groundY, camera.position.y + velocityY.current * delta),
    );
  });

  return null;
}
