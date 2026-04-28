import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import * as THREE from "three";

interface FlyControllerProps {
  speed?: number;
  verticalSpeed?: number;
  onPositionChange?: (position: THREE.Vector3) => void;
  disabled?: boolean;
}

export interface FlyControllerRef {
  controls: OrbitControlsType | null;
}

export const FlyController = forwardRef<FlyControllerRef, FlyControllerProps>(
  (
    { speed = 10, verticalSpeed = 5, onPositionChange, disabled = false },
    ref,
  ) => {
    const { camera: rawCamera } = useThree();
    const cameraRef = useRef(rawCamera);
    const keys = useRef<{ [key: string]: boolean }>({});
    const controlsRef = useRef<OrbitControlsType | null>(null);
    const lastPosition = useRef(new THREE.Vector3());

    useImperativeHandle(ref, () => ({
      controls: controlsRef.current,
    }));

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
      keys.current[e.code] = true;
    }, []);

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
      keys.current[e.code] = false;
    }, []);

    useEffect(() => {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      };
    }, [handleKeyDown, handleKeyUp]);

    useFrame((_, delta) => {
      // En mode disabled: ZQSD désactivé, on garde que OrbitControls
      if (disabled) {
        return;
      }

      // ZQSD (AZERTY): Z=forward, S=backward, Q=left, D=right
      // Support aussi QWERTY et flèches
      const isForward =
        keys.current["KeyW"] || keys.current["KeyZ"] || keys.current["ArrowUp"];
      const isBackward = keys.current["KeyS"] || keys.current["ArrowDown"];
      const isLeft =
        keys.current["KeyQ"] ||
        keys.current["KeyA"] ||
        keys.current["ArrowLeft"];
      const isRight = keys.current["KeyD"] || keys.current["ArrowRight"];

      const direction = new THREE.Vector3();
      const frontVector = new THREE.Vector3(
        0,
        0,
        Number(isBackward) - Number(isForward),
      );
      const sideVector = new THREE.Vector3(
        Number(isRight) - Number(isLeft),
        0,
        0,
      );

      direction.subVectors(frontVector, sideVector);
      if (direction.lengthSq() > 0) {
        direction.normalize().multiplyScalar(speed * delta);
        direction.applyQuaternion(cameraRef.current.quaternion);
        cameraRef.current.position.add(direction);
      }

      // Space = monter, Shift = descendre
      if (keys.current["Space"]) {
        cameraRef.current.position.y += verticalSpeed * delta;
      }
      if (keys.current["ShiftLeft"] || keys.current["ShiftRight"]) {
        cameraRef.current.position.y -= verticalSpeed * delta;
      }

      if (
        onPositionChange &&
        !cameraRef.current.position.equals(lastPosition.current)
      ) {
        lastPosition.current.copy(cameraRef.current.position);
        onPositionChange(cameraRef.current.position);
      }
    });

    return (
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />
    );
  },
);

FlyController.displayName = "FlyController";
