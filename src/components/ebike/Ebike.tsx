import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { EbikeGPSMap } from "@/components/ebike/EbikeGPSMap";
import { EbikeSpeedmeter } from "@/components/ebike/EbikeSpeedmeter";
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
import { assetUrl } from "@/utils/assetUrl";

const EBIKE_MODEL_PATH = "/models/ebike/model.gltf";

// Reusable vectors — allocated once to avoid per-frame GC pressure
const _phareWorldPos = new THREE.Vector3();
const _bikeForward = new THREE.Vector3();
const _aimDir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

interface EbikeProps {
  position: Vector3Tuple;
  /**
   * When true (default), the parked position is snapped to the world terrain
   * height. Pass false in test scenes that don't render the world terrain so
   * the bike stays at the explicit Y of {@link position} instead of floating
   * at the (invisible) terrain height.
   */
  snapToTerrain?: boolean;
}

export function Ebike({
  position,
  snapToTerrain = true,
}: EbikeProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useLoggedGLTF(EBIKE_MODEL_PATH, {
    scope: "Ebike",
    position: position,
  });
  const model = useClonedObject(scene);
  const terrainHeight = useTerrainHeightSampler();
  const parkedPosition = useMemo<Vector3Tuple>(() => {
    const [x, y, z] = position;
    const height = snapToTerrain ? (terrainHeight.getHeight(x, z) ?? y) : y;
    const bottomOffset = getObjectBottomOffset(model, [
      EBIKE_WORLD_SCALE,
      EBIKE_WORLD_SCALE,
      EBIKE_WORLD_SCALE,
    ]);

    return [x, height + bottomOffset, z];
  }, [model, position, snapToTerrain, terrainHeight]);
  const movementMode = useGameStore((state) => state.player.movementMode);
  const mainState = useGameStore((state) => state.mainState);
  const ebikeStep = useGameStore((state) => state.ebike.currentStep);
  const setMissionStep = useGameStore((state) => state.setMissionStep);
  const camera = useThree((state) => state.camera);
  const threeScene = useThree((state) => state.scene);
  const updateEbikeSounds = useEbikeSounds();
  const repairGameOwnsEbikeModel =
    mainState === "ebike" &&
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
  const phareRef = useRef<THREE.Object3D | null>(null);
  const headlightRef = useRef<THREE.SpotLight | null>(null);
  // SpotLight target — must live in the scene to define the cone direction.
  const headlightTarget = useMemo(() => new THREE.Object3D(), []);
  // Original quaternion of the Fourche node — rotation is applied on top of this.
  const forkInitialQuatRef = useRef(new THREE.Quaternion());
  // Smoothed steer angle for the fork (avoids direct Euler manipulation).
  const forkAngleRef = useRef(0);
  // Ref copy of movementMode — useFrame closures can capture stale React state.
  const movementModeRef = useRef(movementMode);
  // Becomes true the first time the player mounts. After that, dismounting
  // must NOT reset position back to the original spawn point.
  const hasRiddenRef = useRef(false);

  // State for debug visualization (synced from refs during useFrame)
  const [showCameraPoints, setShowCameraPoints] = useState(true);

  // Keep movementModeRef in sync — useFrame closures capture React state at
  // render time and can become stale between renders.
  useEffect(() => {
    movementModeRef.current = movementMode;
  }, [movementMode]);

  // SpotLight target must be in the scene to define the cone direction.
  useEffect(() => {
    threeScene.add(headlightTarget);
    return () => {
      threeScene.remove(headlightTarget);
    };
  }, [threeScene, headlightTarget]);

  // Link the target to the SpotLight once it mounts.
  useEffect(() => {
    if (headlightRef.current) {
      headlightRef.current.target = headlightTarget;
    }
  }, [headlightTarget]);

  useEffect(() => {
    if (movementMode === "ebike") {
      // Player just mounted — mark as ridden so we never reset position again.
      hasRiddenRef.current = true;
      return;
    }

    if (hasRiddenRef.current) {
      // Player dismounted: keep the position the bike was left at.
      // Just make sure the window vars are up to date for the next mount.
      window.ebikeParkedPosition = restingPositionRef.current;
      window.ebikeParkedRotation = restingRotationRef.current;
      return;
    }

    // Bike has never been ridden yet — safe to (re)place it at the spawn point.
    // This also fires when parkedPosition recalculates (e.g. terrain loads late).
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
    if (!model) return;

    let forkNode: THREE.Object3D | null = null;
    model.traverse((child) => {
      if (child.name.toLowerCase() === "fourche") forkNode = child;
      if (child.name === "Phare") phareRef.current = child;
    });

    if (forkNode) {
      forkRef.current = forkNode;
      // Snapshot the rest-pose quaternion — steering is applied on top of this.
      forkInitialQuatRef.current.copy((forkNode as THREE.Object3D).quaternion);
      forkAngleRef.current = 0;
      console.log("[Ebike] Fork found:", (forkNode as THREE.Object3D).name);
    } else {
      const names: string[] = [];
      model.traverse((c) => {
        if (c.name) names.push(c.name);
      });
      console.warn("[Ebike] Fork not found. All nodes:", names);
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
    // ── SpotLight headlight — tune the constants below ────────────────────────
    // ── SpotLight headlight — tune these four constants ───────────────────────
    const LIGHT_OFFSET_X = -0.7; // position : left(-) / right(+)
    const LIGHT_OFFSET_Y = 1.5; // position : down(-) / up(+)
    const LIGHT_OFFSET_Z = 0; // position : backward(-) / forward(+)
    const LIGHT_AIM_DEG = 90; // aim rotation around Y : 0=forward, -90=left, +90=right
    const LIGHT_TARGET_DIST = 20; // metres devant la position de la lumière
    // ─────────────────────────────────────────────────────────────────────────
    if (headlightRef.current && phareRef.current && groupRef.current) {
      phareRef.current.getWorldPosition(_phareWorldPos);
      groupRef.current.getWorldDirection(_bikeForward);

      // Position offset in bike-local space (no GC — reusing module-level vectors)
      const right = _bikeForward.clone().cross(_up).normalize();
      _phareWorldPos
        .addScaledVector(right, LIGHT_OFFSET_X)
        .addScaledVector(_up, LIGHT_OFFSET_Y)
        .addScaledVector(_bikeForward, LIGHT_OFFSET_Z);

      headlightRef.current.position.copy(_phareWorldPos);

      // Aim direction: rotate forward around Y by LIGHT_AIM_DEG
      _aimDir
        .copy(_bikeForward)
        .applyAxisAngle(_up, THREE.MathUtils.degToRad(LIGHT_AIM_DEG));

      headlightTarget.position
        .copy(_phareWorldPos)
        .addScaledVector(_aimDir, LIGHT_TARGET_DIST);
      headlightTarget.updateMatrixWorld();
    }
    // ──────────────────────────────────────────────────────────────────────────

    if (groupRef.current) {
      // Use the ref — not the React state — to avoid stale closure bugs in
      // R3F's frame loop (the state value may not update until the next render).
      if (movementModeRef.current === "ebike") {
        // Sound plays whenever the bike is actually moving (speedFactor > 5 %),
        // not only while the input key is held.
        updateEbikeSounds({
          mounted: true,
          driving: (window.ebikeSpeedFactor ?? 0) > 0.05,
          breakdown: window.ebikeBreakdownActive === true,
        });

        restingPositionRef.current = [
          groupRef.current.position.x,
          groupRef.current.position.y,
          groupRef.current.position.z,
        ];
        restingRotationRef.current = groupRef.current.rotation.y;

        // ── Fork steering via quaternion ──────────────────────────────────────
        // We rotate around the fork's LOCAL Y axis (steering tube) by composing
        // a fresh quaternion on top of the rest-pose snapshot taken at load time.
        // This is axis-agnostic: correct regardless of how Blender exported the node.
        // Tune FORK_ANGLE (radians) or negate it if the visual direction is wrong.
        const FORK_ANGLE = 0.12; // 10°
        const steerFactor = window.ebikeSteerFactor ?? 0;

        if (forkRef.current) {
          // Smooth the angle separately so we can apply it cleanly each frame.
          forkAngleRef.current = THREE.MathUtils.lerp(
            forkAngleRef.current,
            steerFactor * FORK_ANGLE,
            12 * delta,
          );
          // Build steer quat around LOCAL Y of the fork node.
          const steerQuat = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            forkAngleRef.current,
          );
          // Apply on top of rest-pose: Q_final = Q_rest × Q_steer
          forkRef.current.quaternion.multiplyQuaternions(
            forkInitialQuatRef.current,
            steerQuat,
          );
        }

        // Throttled GPS start position update to prevent performance loss
        const currentPos = groupRef.current.position;
        if (currentPos.distanceTo(lastGpsUpdatePos.current) > 2.0) {
          lastGpsUpdatePos.current.copy(currentPos);
          setGpsStartPos({ x: currentPos.x, y: currentPos.y, z: currentPos.z });
        }

        // Sync debug visualization state (throttled to avoid excessive re-renders)
        // Debug visualization positions are derived elsewhere when needed.
      } else {
        updateEbikeSounds({ mounted: false, driving: false, breakdown: false });
        groupRef.current.position.set(...restingPositionRef.current);
        groupRef.current.rotation.set(0, restingRotationRef.current, 0);

        // Reset fork to rest-pose when parked
        if (forkRef.current) {
          forkRef.current.quaternion.copy(forkInitialQuatRef.current);
          forkAngleRef.current = 0;
        }
      }
      window.ebikeParkedPosition = restingPositionRef.current;
      window.ebikeParkedRotation = restingRotationRef.current;
    }
  });

  const interactionLabel =
    mainState === "ebike"
      ? "Lancer le Repair Game"
      : movementMode === "walk"
        ? "Monter sur le bike"
        : "Descendre du bike";

  // Hide the interact prompt while the player is actively riding the bike
  // (driving input pressed) so the "Descendre du bike" label doesn't
  // pollute the view. The prompt comes back the moment the bike comes to
  // a stop. window.ebikeDriveInputActive is published every frame by
  // PlayerController based on whether a movement key is currently held.
  // Also hide entirely while the breakdown sequence is active — the bike
  // must read as inert and non-interactive while the panne dialogue plays
  // and during the auto-dismount that follows.
  const [isEbikeDriving, setIsEbikeDriving] = useState(false);
  const [isEbikeBreakdown, setIsEbikeBreakdown] = useState(false);
  useFrame(() => {
    const driving =
      movementMode === "ebike" && window.ebikeDriveInputActive === true;
    if (driving !== isEbikeDriving) setIsEbikeDriving(driving);
    const breakdown = window.ebikeBreakdownActive === true;
    if (breakdown !== isEbikeBreakdown) setIsEbikeBreakdown(breakdown);
  });
  const showInteractPrompt = !isEbikeDriving && !isEbikeBreakdown;

  const handleInteract = useCallback((): void => {
    if (window.ebikeBreakdownActive === true) return;

    if (movementMode === "walk") {
      if (mainState === "ebike" && ebikeStep === "waiting") {
        setMissionStep("ebike", "inspected");
        return;
      }

      // Note: inspected -> fragmented is no longer driven by press-E.
      // It auto-advances after the focus bubble's grow tween (see
      // RepairGame, gated on BUBBLE_GROW_DURATION_SECONDS), so the
      // sphere visibly engulfs the bike before the explode animation.

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

      animateCameraTransformTransition(
        targetCamPos,
        targetRotation,
        1,
        () => {
          useGameStore.getState().setPlayerMovementMode("ebike");
        },
        { lockInput: false },
      );
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

      animateCameraTransformTransition(
        targetCamPos,
        targetRotation,
        1,
        () => {
          useGameStore.getState().setPlayerMovementMode("walk");
        },
        { lockInput: false },
      );
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
          {/* radius 20 → ~7 unités monde (scale 0.35).
              Sphère omnidirectionnelle pour que le raycast fonctionne
              quelle que soit l'orientation de la caméra (montée ou à pied). */}
          {showInteractPrompt ? (
            <InteractableObject
              kind="trigger"
              label={interactionLabel}
              position={parkedPosition}
              radius={5}
              onPress={handleInteract}
            >
              <mesh>
                <sphereGeometry args={[8, 15, 12]} />
                <meshBasicMaterial
                  colorWrite={false}
                  color={"red"}
                  depthWrite={false}
                />
              </mesh>
            </InteractableObject>
          ) : null}

          {/* GPS + Speedmeter – same group so they are perfectly co-localised.
              GPS: full circle (Fresnel mask), renderOrder 10 000
              Speedmeter: upper-half arc overlay, renderOrder 10 001
              rotation: Math.PI/2 radians = 90° (NOT the number 90 which = ~116.6°) */}
          <group position={[2, 6, 0]} rotation={[0, -80, 0]}>
            <EbikeSpeedmeter
              width={3}
              height={1.5}
              position={[0, 0.4, 0]}
              gaugeInnerR={0.33}
              gaugeOuterR={0.445}
              gaugeWidth={2.5}
              gaugeHeight={2.1}
              gaugeOffsetX={0}
              gaugeOffsetY={-0.19}
            />
            <EbikeGPSMap
              width={1.3}
              height={1}
              startPos={gpsStartPos}
              destPos={destPos}
              mapImageUrl={assetUrl("/assets/world/gps/map_background.png")}
              worldBounds={{
                minX: -166,
                maxX: 163,
                minZ: -142,
                maxZ: 138,
              }}
              zoom={4}
            />
          </group>
        </group>
      ) : null}

      {/* SpotLight headlight — cone aimed forward, position & target via useFrame */}
      {!repairGameOwnsEbikeModel && (
        <spotLight
          ref={headlightRef}
          intensity={100}
          color="#ffca60"
          angle={Math.PI / 5} // 22.5° demi-angle — cone étroit comme une torche
          penumbra={0.5} // bord doux (0 = dur, 1 = très doux)
          distance={50}
          decay={2.5}
          castShadow={false}
        />
      )}

      {showCameraPoints && !repairGameOwnsEbikeModel && (
        <>
          {/* <mesh position={camPointPos}>
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
          </mesh> */}
        </>
      )}
    </>
  );
}
