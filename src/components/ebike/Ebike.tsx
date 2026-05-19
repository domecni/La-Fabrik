import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import { animateCameraTransition, animateCameraTransformTransition } from "@/world/GameCinematics";
import { useGameStore } from "@/managers/stores/useGameStore";
import { PLAYER_EYE_HEIGHT } from "@/data/player/playerConfig";
import type { Vector3Tuple } from "@/types/three/three";

const EBIKE_MODEL_PATH = "/models/ebike/model.gltf";

export interface CameraTransform {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
}

export const EBIKE_CAMERA_TRANSFORM: CameraTransform = {
  position: [-3, 8, 0],
  rotation: [0, 0, 0],
};

const EBIKE_DROP_PLAYER_TRANSFORM: CameraTransform = {
  position: [3, 1.5, 0],
  rotation: [90, 90, 0],
};

interface EbikeProps {
  position: Vector3Tuple;
}

export function Ebike({ position }: EbikeProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useLoggedGLTF(EBIKE_MODEL_PATH, {
    scope: "Ebike",
    position: position,
  });
  const model = useClonedObject(scene);
  const movementMode = useGameStore((state) => state.player.movementMode);

  useFrame(() => {
    if (groupRef.current) {
      if (movementMode === "ebike") {
        // Follow player physical position (capsule end)
        const playerPos = (window as any).playerPos || [0, 10, 0];
        groupRef.current.position.set(playerPos[0], playerPos[1] - PLAYER_EYE_HEIGHT, playerPos[2]);

        // Match the e-bike's actual physical steering heading
        const angle = (window as any).ebikeAngle || 0;
        groupRef.current.rotation.set(0, angle, 0);
      } else {
        // Reset to original position
        groupRef.current.position.set(...position);
        groupRef.current.rotation.set(0, 0, 0);
      }
    }
  });

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
      animateCameraTransformTransition(targetCamPos, EBIKE_CAMERA_TRANSFORM.rotation, 1, () => {
        useGameStore.getState().setPlayerMovementMode("ebike");
      });
    } else {
      const currentPos = new THREE.Vector3();
      if (groupRef.current) {
        groupRef.current.getWorldPosition(currentPos);
      } else {
        currentPos.set(...position);
      }

      const targetCamPos: Vector3Tuple = [
        currentPos.x + EBIKE_DROP_PLAYER_TRANSFORM.position[0],
        currentPos.y + EBIKE_DROP_PLAYER_TRANSFORM.position[1],
        currentPos.z + EBIKE_DROP_PLAYER_TRANSFORM.position[2],
      ];
      const targetLookAt: Vector3Tuple = [
        currentPos.x,
        currentPos.y + 1,
        currentPos.z,
      ];

      animateCameraTransition(targetCamPos, targetLookAt, 1, () => {
        useGameStore.getState().setPlayerMovementMode("walk");
      });
    }
  };

  return (
    <>
      <group ref={groupRef} position={position}>
        <primitive object={model} />
        <InteractableObject
          kind="trigger"
          label={
            movementMode === "walk" ? "Monter sur le bike" : "Descendre du bike"
          }
          position={position}
          radius={15}
          onPress={handleInteract}
        >
          <mesh>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshStandardMaterial color="red" opacity={0.5} transparent />
          </mesh>
        </InteractableObject>
      </group>
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
    </>
  );
}
