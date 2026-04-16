import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PLAYER_EYE_HEIGHT } from "@/world/player/PlayerCamera";

const JUMP_HEIGHT = 1;
const GRAVITY = 18;
const JUMP_VELOCITY = Math.sqrt(2 * GRAVITY * JUMP_HEIGHT);
const MOVE_SPEED = 5;

type PlayerKeys = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
};

const DEFAULT_KEYS: PlayerKeys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

export function PlayerController(): null {
  const camera = useThree((state) => state.camera);
  const keys = useRef<PlayerKeys>({ ...DEFAULT_KEYS });
  const interact = useRef<() => void>(() => {});
  const verticalVelocity = useRef(0);
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const movement = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3(0, 1, 0));

  useEffect(() => {
    const handleKeyChange =
      (pressed: boolean) =>
      (event: KeyboardEvent): void => {
        switch (event.key.toLowerCase()) {
          case "z":
            keys.current.forward = pressed;
            break;
          case "s":
            keys.current.backward = pressed;
            break;
          case "q":
            keys.current.left = pressed;
            break;
          case "d":
            keys.current.right = pressed;
            break;
          case "e":
            if (pressed) {
              interact.current();
            }
            break;
          case " ":
            if (pressed && camera.position.y <= PLAYER_EYE_HEIGHT) {
              verticalVelocity.current = JUMP_VELOCITY;
            }
            break;
          default:
            return;
        }

        event.preventDefault();
      };

    const handleKeyDown = handleKeyChange(true);
    const handleKeyUp = handleKeyChange(false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      keys.current = { ...DEFAULT_KEYS };
    };
  }, [camera]);

  useFrame((_, delta) => {
    const currentForward = forward.current;
    const currentRight = right.current;
    const currentMovement = movement.current;

    currentMovement.set(0, 0, 0);

    camera.getWorldDirection(currentForward);
    currentForward.setY(0);

    if (currentForward.lengthSq() > 0) {
      currentForward.normalize();
      currentRight.crossVectors(currentForward, up.current).normalize();
    }

    if (keys.current.forward) {
      currentMovement.add(currentForward);
    }

    if (keys.current.backward) {
      currentMovement.sub(currentForward);
    }

    if (keys.current.left) {
      currentMovement.sub(currentRight);
    }

    if (keys.current.right) {
      currentMovement.add(currentRight);
    }

    if (currentMovement.lengthSq() > 0) {
      currentMovement.normalize().multiplyScalar(MOVE_SPEED * delta);
      camera.position.add(currentMovement);
    }

    verticalVelocity.current -= GRAVITY * delta;

    const nextY = camera.position.y + verticalVelocity.current * delta;
    camera.position.set(camera.position.x, nextY, camera.position.z);

    if (camera.position.y < PLAYER_EYE_HEIGHT) {
      verticalVelocity.current = 0;
      camera.position.set(
        camera.position.x,
        PLAYER_EYE_HEIGHT,
        camera.position.z,
      );
    }
  });

  return null;
}
