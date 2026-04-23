import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface FlyControllerProps {
  speed?: number;
  verticalSpeed?: number;
  onPositionChange?: (position: THREE.Vector3) => void;
  disabled?: boolean;
}

export interface FlyControllerRef {
  controls: any;
}

const FlyControllerInner = forwardRef<FlyControllerRef, FlyControllerProps>(({ 
  speed = 10, 
  verticalSpeed = 5,
  onPositionChange,
  disabled = false
}, ref) => {
  const { camera } = useThree();
  const keys = useRef<{ [key: string]: boolean }>({});
  const controlsRef = useRef<any>(null);
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
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useFrame((_, delta) => {
    // En mode disabled: ZQSD désactivé, on garde que OrbitControls
    if (disabled) {
      return;
    }

    // ZQSD (AZERTY): Z=forward, S=backward, Q=left, D=right
    // Support aussi QWERTY et flèches
    const isForward = keys.current['KeyW'] || keys.current['KeyZ'] || keys.current['ArrowUp'];
    const isBackward = keys.current['KeyS'] || keys.current['ArrowDown'];
    const isLeft = keys.current['KeyQ'] || keys.current['KeyA'] || keys.current['ArrowLeft'];
    const isRight = keys.current['KeyD'] || keys.current['ArrowRight'];

    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(0, 0, Number(isBackward) - Number(isForward));
    const sideVector = new THREE.Vector3(Number(isRight) - Number(isLeft), 0, 0);

    direction.subVectors(frontVector, sideVector);
    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(speed * delta);
      direction.applyQuaternion(camera.quaternion);
      camera.position.add(direction);
    }

    // Space = monter, Shift = descendre
    if (keys.current['Space']) {
      camera.position.y += verticalSpeed * delta;
    }
    if (keys.current['ShiftLeft'] || keys.current['ShiftRight']) {
      camera.position.y -= verticalSpeed * delta;
    }

    if (onPositionChange && !camera.position.equals(lastPosition.current)) {
      lastPosition.current.copy(camera.position);
      onPositionChange(camera.position);
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
});

export default FlyControllerInner;