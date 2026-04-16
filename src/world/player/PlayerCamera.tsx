import { useEffect } from "react";
import { PointerLockControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export const PLAYER_EYE_HEIGHT = 1.75;

const PLAYER_SPAWN_POSITION = new THREE.Vector3(0, PLAYER_EYE_HEIGHT, 6);
const PLAYER_LOOK_AT = new THREE.Vector3(0, PLAYER_EYE_HEIGHT, 0);

export function PlayerCamera(): React.JSX.Element {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.copy(PLAYER_SPAWN_POSITION);
    camera.lookAt(PLAYER_LOOK_AT);
    camera.updateProjectionMatrix();

    return () => {
      document.exitPointerLock?.();
    };
  }, [camera]);

  return <PointerLockControls />;
}
