import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type ElementRef,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type OrbitControlsRef = ElementRef<typeof OrbitControls>;

interface FlyControllerProps {
  speed?: number;
  verticalSpeed?: number;
  onPositionChange?: (position: THREE.Vector3) => void;
  disabled?: boolean;
}

interface FlyControllerRef {
  controls: OrbitControlsRef | null;
}

export const FlyController = forwardRef<FlyControllerRef, FlyControllerProps>(
  (
    { speed = 10, verticalSpeed = 5, onPositionChange, disabled = false },
    ref,
  ) => {
    const { camera: rawCamera } = useThree();
    const cameraRef = useRef(rawCamera);
    const keys = useRef<Partial<Record<string, boolean>>>({});
    const controlsRef = useRef<OrbitControlsRef | null>(null);
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
      // Disabled mode keeps OrbitControls active without keyboard movement.
      if (disabled) {
        return;
      }

      // Supports AZERTY, QWERTY, and arrow-key movement.
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
