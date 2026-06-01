import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { EbikeGPSMap } from "@/components/ebike/EbikeGPSMap";
import { EbikeSpeedometer } from "@/components/ebike/EbikeSpeedometer";
import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import { useEbikeSounds } from "@/hooks/ebike/useEbikeSounds";
import {
  getObjectBottomOffset,
  useTerrainHeightSampler,
} from "@/hooks/three/useTerrainHeight";
import { animateCameraTransformTransition } from "@/world/GameCinematics";
import { useGameStore } from "@/managers/stores/useGameStore";
import {
  EBIKE_CAMERA_TRANSFORM,
  EBIKE_DROP_PLAYER_TRANSFORM,
  EBIKE_WORLD_SCALE,
  EBIKE_WORLD_ROTATION_Y,
} from "@/data/ebike/ebikeConfig";
import type { Vector3Tuple } from "@/types/three/three";
import "@/types/ebike/ebikeWindow";

const EBIKE_MODEL_PATH = "/models/ebike/model.gltf";

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
  const terrainHeight = useTerrainHeightSampler();
  const parkedPosition = useMemo<Vector3Tuple>(() => {
    const [x, y, z] = position;
    const height = terrainHeight.getHeight(x, z) ?? y;
    const bottomOffset = getObjectBottomOffset(model, [
      EBIKE_WORLD_SCALE,
      EBIKE_WORLD_SCALE,
      EBIKE_WORLD_SCALE,
    ]);

    return [x, height + bottomOffset, z];
  }, [model, position, terrainHeight]);
  const movementMode = useGameStore((state) => state.player.movementMode);
  const mainState = useGameStore((state) => state.mainState);
  const ebikeStep = useGameStore((state) => state.ebike.currentStep);
  const setMissionStep = useGameStore((state) => state.setMissionStep);
  const camera = useThree((state) => state.camera);
  const updateEbikeSounds = useEbikeSounds();
  const repairGameOwnsEbikeModel =
    mainState === "ebike" &&
    ebikeStep !== "locked" &&
    ebikeStep !== "waiting" &&
    ebikeStep !== "inspected";

  // Map active mainState to target repair zone coordinate
  const destPos = useMemo(() => {
    switch (mainState) {
      case "ebike":
        return { x: 8, y: 0, z: -6 };
      case "pylon":
        return { x: 64, y: 0, z: -66 };
      case "farm":
        return { x: -24, y: 0, z: 42 };
      default:
        return undefined;
    }
  }, [mainState]);

  // Throttled GPS start position to optimize pathfinding A* algorithm execution
  const [gpsStartPos, setGpsStartPos] = useState<{
    x: number;
    y: number;
    z: number;
  }>({
    x: parkedPosition[0],
    y: parkedPosition[1],
    z: parkedPosition[2],
  });
  const lastGpsUpdatePos = useRef<THREE.Vector3>(
    new THREE.Vector3(...parkedPosition),
  );

  // Use ref for internal state, and state for debug visualization (to avoid ref access during render)
  const restingPositionRef = useRef<Vector3Tuple>([
    parkedPosition[0],
    parkedPosition[1],
    parkedPosition[2],
  ]);
  const restingRotationRef = useRef<number>(EBIKE_WORLD_ROTATION_Y);
  const forkRef = useRef<THREE.Object3D | null>(null);

  // State for debug visualization (synced from refs during useFrame)
  const [showCameraPoints, setShowCameraPoints] = useState(true);
  const [debugRestingPosition, setDebugRestingPosition] =
    useState<Vector3Tuple>([
      parkedPosition[0],
      parkedPosition[1],
      parkedPosition[2],
    ]);

  useEffect(() => {
    if (movementMode === "ebike") return;

    restingPositionRef.current = parkedPosition;
    restingRotationRef.current = EBIKE_WORLD_ROTATION_Y;
    lastGpsUpdatePos.current.set(...parkedPosition);

    if (groupRef.current) {
      groupRef.current.position.set(...parkedPosition);
      groupRef.current.rotation.set(0, EBIKE_WORLD_ROTATION_Y, 0);
    }

    window.ebikeParkedPosition = parkedPosition;
    window.ebikeParkedRotation = EBIKE_WORLD_ROTATION_Y;
  }, [movementMode, parkedPosition]);

  useEffect(() => {
    if (model) {
      const fork = model.getObjectByName("fourche");
      if (fork) {
        forkRef.current = fork;
      }
    }
  }, [model]);

  useEffect(() => {
    if (!model) return;

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [model]);

  useEffect(() => {
    window.ebikeVisualGroup = groupRef;
    window.ebikeParkedPosition = restingPositionRef.current;
    window.ebikeParkedRotation = restingRotationRef.current;
    return () => {
      window.ebikeVisualGroup = null;
      window.ebikeParkedPosition = null;
      window.ebikeParkedRotation = null;
    };
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (movementMode === "ebike") {
        updateEbikeSounds({
          mounted: true,
          driving: window.ebikeDriveInputActive === true,
          breakdown: window.ebikeBreakdownActive === true,
        });

        restingPositionRef.current = [
          groupRef.current.position.x,
          groupRef.current.position.y,
          groupRef.current.position.z,
        ];
        restingRotationRef.current = groupRef.current.rotation.y;

        // Smoothly rotate the front fork ("fourche") up to 15 degrees in its own Z axis
        const steerFactor = window.ebikeSteerFactor ?? 0;
        if (forkRef.current) {
          // 15 degrees is 0.26 radians
          const targetForkRotation = steerFactor * 0.26;
          forkRef.current.rotation.z = THREE.MathUtils.lerp(
            forkRef.current.rotation.z,
            targetForkRotation,
            12 * delta,
          );
        }

        // Throttled GPS start position update to prevent performance loss
        const currentPos = groupRef.current.position;
        if (currentPos.distanceTo(lastGpsUpdatePos.current) > 2.0) {
          lastGpsUpdatePos.current.copy(currentPos);
          setGpsStartPos({ x: currentPos.x, y: currentPos.y, z: currentPos.z });
        }

        // Sync debug visualization state (throttled to avoid excessive re-renders)
        if (showCameraPoints) {
          setDebugRestingPosition([...restingPositionRef.current]);
        }
      } else {
        updateEbikeSounds({ mounted: false, driving: false, breakdown: false });
        groupRef.current.position.set(...restingPositionRef.current);
        groupRef.current.rotation.set(0, restingRotationRef.current, 0);

        // Reset fork rotation when parked
        if (forkRef.current) {
          forkRef.current.rotation.z = 0;
        }
      }
      window.ebikeParkedPosition = restingPositionRef.current;
      window.ebikeParkedRotation = restingRotationRef.current;
    }
  });

  // Debug visualization positions computed from state (not refs)
  const camPointPos: Vector3Tuple = [
    debugRestingPosition[0] + EBIKE_CAMERA_TRANSFORM.position[0],
    debugRestingPosition[1] + EBIKE_CAMERA_TRANSFORM.position[1],
    debugRestingPosition[2] + EBIKE_CAMERA_TRANSFORM.position[2],
  ];
  const dropPointPos: Vector3Tuple = [
    debugRestingPosition[0] + EBIKE_DROP_PLAYER_TRANSFORM.position[0],
    debugRestingPosition[1] + EBIKE_DROP_PLAYER_TRANSFORM.position[1],
    debugRestingPosition[2] + EBIKE_DROP_PLAYER_TRANSFORM.position[2],
  ];
  const interactionLabel =
    mainState === "ebike"
      ? "Réparer l'e-bike"
      : movementMode === "walk"
        ? "Monter sur le bike"
        : "Descendre du bike";

  const handleInteract = useCallback((): void => {
    if (window.ebikeBreakdownActive === true) return;

    if (movementMode === "walk") {
      if (
        mainState === "ebike" &&
        (ebikeStep === "locked" || ebikeStep === "waiting")
      ) {
        setMissionStep("ebike", "inspected");
        return;
      }

      if (mainState === "ebike" && ebikeStep === "inspected") {
        setMissionStep("ebike", "fragmented");
        return;
      }

      const cameraOffset = new THREE.Vector3(
        ...EBIKE_CAMERA_TRANSFORM.position,
      );
      cameraOffset.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        restingRotationRef.current,
      );

      const targetCamPos: Vector3Tuple = [
        restingPositionRef.current[0] + cameraOffset.x,
        restingPositionRef.current[1] + cameraOffset.y,
        restingPositionRef.current[2] + cameraOffset.z,
      ];

      const targetRotation: Vector3Tuple = [
        EBIKE_CAMERA_TRANSFORM.rotation[0],
        EBIKE_CAMERA_TRANSFORM.rotation[1] +
          THREE.MathUtils.radToDeg(restingRotationRef.current),
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
      const currentEuler = new THREE.Euler().setFromQuaternion(
        camera.quaternion,
        "YXZ",
      );
      const targetRotation: Vector3Tuple = [
        THREE.MathUtils.radToDeg(currentEuler.x),
        THREE.MathUtils.radToDeg(currentEuler.y),
        THREE.MathUtils.radToDeg(currentEuler.z),
      ];

      animateCameraTransformTransition(targetCamPos, targetRotation, 1, () => {
        useGameStore.getState().setPlayerMovementMode("walk");
      });
    }
  }, [movementMode, mainState, ebikeStep, setMissionStep, camera, position]);

  // Store handleInteract in a ref for use in debug folder callback
  const handleInteractRef = useRef(handleInteract);
  useEffect(() => {
    handleInteractRef.current = handleInteract;
  }, [handleInteract]);

  // Mutable object for lil-gui binding
  const debugState = useRef({ showCameraPoints: true });

  useDebugFolder("Ebike", (folder) => {
    folder
      .add(debugState.current, "showCameraPoints")
      .name("Show Camera Points")
      .onChange((value: boolean) => {
        setShowCameraPoints(value);
      });

    folder
      .add({ toggleRide: () => handleInteractRef.current() }, "toggleRide")
      .name("Monter / Descendre");
  });

  return (
    <>
      {!repairGameOwnsEbikeModel ? (
        <group
          ref={groupRef}
          position={parkedPosition}
          rotation={[0, EBIKE_WORLD_ROTATION_Y, 0]}
          scale={EBIKE_WORLD_SCALE}
        >
          <primitive object={model} />
          <InteractableObject
            kind="trigger"
            label={interactionLabel}
            position={parkedPosition}
            radius={5}
            onPress={handleInteract}
          >
            <mesh>
              <boxGeometry args={[8, 9, 2]} />
              <meshBasicMaterial colorWrite={false} depthWrite={false} />
            </mesh>
          </InteractableObject>

          {/* Dynamic 3D GPS Dashboard Screen */}
          <group position={[0, 7, 0]} rotation={[0, 90, 0]}>
            <EbikeGPSMap
              width={0.8}
              height={0.8}
              startPos={gpsStartPos}
              destPos={destPos}
              mapImageUrl="/assets/world/gps/map_background.png"
              worldBounds={{
                minX: -166,
                maxX: 163,
                minZ: -142,
                maxZ: 138,
              }}
              zoom={4}
            />
          </group>
          <group position={[0, 6.35, 0]} rotation={[0, 90, 0]}>
            <EbikeSpeedometer />
          </group>
        </group>
      ) : null}

      {showCameraPoints && !repairGameOwnsEbikeModel && (
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
