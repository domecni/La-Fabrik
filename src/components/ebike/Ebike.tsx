import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import { animateCameraTransformTransition } from "@/world/GameCinematics";
import { useGameStore } from "@/managers/stores/useGameStore";
import { PLAYER_EYE_HEIGHT } from "@/data/player/playerConfig";
import type { Vector3Tuple } from "@/types/three/three";

const EBIKE_MODEL_PATH = "/models/ebike/model.gltf";

export interface CameraTransform {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
}

export const EBIKE_CAMERA_TRANSFORM: CameraTransform = {
  position: [-3.5, 6, 0],
  rotation: [-10, -90, 0],
};

const EBIKE_DROP_PLAYER_TRANSFORM: CameraTransform = {
  position: [0, 1.5, -3],
  rotation: [0, 0, 0],
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
  const camera = useThree((state) => state.camera);

  const restingPosition = useRef<Vector3Tuple>([
    position[0],
    position[1] - PLAYER_EYE_HEIGHT,
    position[2],
  ]);
  const restingRotation = useRef<number>(0);
  const forkRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    if (model) {
      const fork = model.getObjectByName("fourche");
      if (fork) {
        forkRef.current = fork;
      }
    }
  }, [model]);

  useEffect(() => {
    (window as any).ebikeVisualGroup = groupRef;
    (window as any).ebikeParkedPosition = restingPosition.current;
    (window as any).ebikeParkedRotation = restingRotation.current;
    return () => {
      (window as any).ebikeVisualGroup = null;
      (window as any).ebikeParkedPosition = null;
      (window as any).ebikeParkedRotation = null;
    };
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (movementMode === "ebike") {
        restingPosition.current = [
          groupRef.current.position.x,
          groupRef.current.position.y,
          groupRef.current.position.z,
        ];
        restingRotation.current = groupRef.current.rotation.y;

        // Smoothly rotate the front fork ("fourche") up to 15 degrees in its own Z axis
        const steerFactor = (window as any).ebikeSteerFactor || 0;
        if (forkRef.current) {
          // 15 degrees is 0.26 radians
          const targetForkRotation = steerFactor * 0.26;
          forkRef.current.rotation.z = THREE.MathUtils.lerp(
            forkRef.current.rotation.z,
            targetForkRotation,
            12 * delta
          );
        }
      } else {
        groupRef.current.position.set(...restingPosition.current);
        groupRef.current.rotation.set(0, restingRotation.current, 0);

        // Reset fork rotation when parked
        if (forkRef.current) {
          forkRef.current.rotation.z = 0;
        }
      }
      (window as any).ebikeParkedPosition = restingPosition.current;
      (window as any).ebikeParkedRotation = restingRotation.current;
    }
  });

  const camPointPos: Vector3Tuple = [
    restingPosition.current[0] + EBIKE_CAMERA_TRANSFORM.position[0],
    restingPosition.current[1] + EBIKE_CAMERA_TRANSFORM.position[1],
    restingPosition.current[2] + EBIKE_CAMERA_TRANSFORM.position[2],
  ];
  const dropPointPos: Vector3Tuple = [
    restingPosition.current[0] + EBIKE_DROP_PLAYER_TRANSFORM.position[0],
    restingPosition.current[1] + EBIKE_DROP_PLAYER_TRANSFORM.position[1],
    restingPosition.current[2] + EBIKE_DROP_PLAYER_TRANSFORM.position[2],
  ];

  const handleInteract = (): void => {
    if (movementMode === "walk") {
      const cameraOffset = new THREE.Vector3(...EBIKE_CAMERA_TRANSFORM.position);
      cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), restingRotation.current);

      const targetCamPos: Vector3Tuple = [
        restingPosition.current[0] + cameraOffset.x,
        restingPosition.current[1] + cameraOffset.y,
        restingPosition.current[2] + cameraOffset.z,
      ];

      const targetRotation: Vector3Tuple = [
        EBIKE_CAMERA_TRANSFORM.rotation[0],
        EBIKE_CAMERA_TRANSFORM.rotation[1] + THREE.MathUtils.radToDeg(restingRotation.current),
        EBIKE_CAMERA_TRANSFORM.rotation[2],
      ];

      animateCameraTransformTransition(targetCamPos, targetRotation, 1, () => {
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

      // Get camera's current rotation in degrees so we keep the exact orientation during dismount
      const currentEuler = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
      const targetRotation: Vector3Tuple = [
        THREE.MathUtils.radToDeg(currentEuler.x),
        THREE.MathUtils.radToDeg(currentEuler.y),
        THREE.MathUtils.radToDeg(currentEuler.z),
      ];

      animateCameraTransformTransition(targetCamPos, targetRotation, 1, () => {
        useGameStore.getState().setPlayerMovementMode("walk");
      });
    }
  };

  const handleInteractRef = useRef(handleInteract);
  handleInteractRef.current = handleInteract;

  const debugRef = useRef({ showCameraPoints: true });
  const debugActions = useRef({
    toggleRide: () => {
      handleInteractRef.current();
    }
  });

  useDebugFolder("Ebike", (folder) => {
    folder
      .add(debugRef.current, "showCameraPoints")
      .name("Show Camera Points")
      .onChange((value: boolean) => {
        debugRef.current.showCameraPoints = value;
      });

    folder
      .add(debugActions.current, "toggleRide")
      .name("Monter / Descendre");
  });

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
            <boxGeometry args={[10, 13, 2]} />
            <meshBasicMaterial colorWrite={false} depthWrite={false} />
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
