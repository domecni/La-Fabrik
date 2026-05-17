import { useRef } from "react";
import * as THREE from "three";
import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import { animateCameraTransition } from "@/world/GameCinematics";
import { useGameStore } from "@/managers/stores/useGameStore";
import type { Vector3Tuple } from "@/types/three/three";

const EBIKE_MODEL_PATH = "/models/ebike/model.gltf";

interface CameraTransform {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
}

const EBIKE_CAMERA_TRANSFORM: CameraTransform = {
  position: [-3, 8, 0],
  rotation: [0, 90, 0],
};

const EBIKE_DROP_PLAYER_TRANSFORM: CameraTransform = {
  position: [3, 1.5, 0],
  rotation: [0, 0, 0],
};

interface EbikeProps {
  position: Vector3Tuple;
}

export function Ebike({ position }: EbikeProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useLoggedGLTF(EBIKE_MODEL_PATH, {
    scope: "Ebike",
    position: [0, 0, 0],
  });
  const model = useClonedObject(scene);
  const movementMode = useGameStore((state) => state.player.movementMode);

  const debugRef = useRef({ showCameraPoints: true });
  useDebugFolder("Ebike", (folder) => {
    folder
      .add(debugRef.current, "showCameraPoints")
      .name("Show Camera Points")
      .onChange((value: boolean) => {
        debugRef.current.showCameraPoints = value;
      });
  });

  const camPointPos: Vector3Tuple = [
    position[0] + EBIKE_CAMERA_TRANSFORM.position[0],
    position[1] + EBIKE_CAMERA_TRANSFORM.position[1],
    position[2] + EBIKE_CAMERA_TRANSFORM.position[2],
  ];
  const dropPointPos: Vector3Tuple = [
    position[0] + EBIKE_DROP_PLAYER_TRANSFORM.position[0],
    position[1] + EBIKE_DROP_PLAYER_TRANSFORM.position[1],
    position[2] + EBIKE_DROP_PLAYER_TRANSFORM.position[2],
  ];

  const handleInteract = (): void => {
    if (movementMode === "walk") {
      const targetCamPos: Vector3Tuple = [
        position[0] + EBIKE_CAMERA_TRANSFORM.position[0],
        position[1] + EBIKE_CAMERA_TRANSFORM.position[1],
        position[2] + EBIKE_CAMERA_TRANSFORM.position[2],
      ];
      const targetLookAt: Vector3Tuple = [
        position[0],
        position[1] + 1,
        position[2],
      ];

      animateCameraTransition(targetCamPos, targetLookAt, 1, () => {
        useGameStore.getState().setPlayerMovementMode("ebike");
      });
    } else {
      const targetCamPos: Vector3Tuple = [
        position[0] + EBIKE_DROP_PLAYER_TRANSFORM.position[0],
        position[1] + EBIKE_DROP_PLAYER_TRANSFORM.position[1],
        position[2] + EBIKE_DROP_PLAYER_TRANSFORM.position[2],
      ];
      const targetLookAt: Vector3Tuple = [
        position[0],
        position[1] + 1,
        position[2],
      ];

      animateCameraTransition(targetCamPos, targetLookAt, 1, () => {
        useGameStore.getState().setPlayerMovementMode("walk");
      });
    }
  };

  return (
    <group ref={groupRef} position={position}>
      <primitive object={model} />
      <InteractableObject
        kind="trigger"
        label={
          movementMode === "walk" ? "Monter sur le bike" : "Descendre du bike"
        }
        position={position}
        radius={10}
        onPress={handleInteract}
      >
        <mesh>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="red" opacity={0.5} transparent />
        </mesh>
      </InteractableObject>
      {debugRef.current.showCameraPoints && (
        <>
          <mesh position={camPointPos}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial
              color="yellow"
              emissive="yellow"
              emissiveIntensity={0.5}
            />
          </mesh>
          <mesh position={dropPointPos}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial
              color="cyan"
              emissive="cyan"
              emissiveIntensity={0.5}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
