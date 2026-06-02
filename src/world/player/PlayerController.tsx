import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Capsule, type Octree } from "three-stdlib";
import {
  INTERACT_KEY,
  JUMP_KEY,
  MOVE_BACKWARD_KEY,
  MOVE_FORWARD_KEY,
  MOVE_LEFT_KEY,
  MOVE_RIGHT_KEY,
  PRIMARY_INTERACT_MOUSE_BUTTON,
} from "@/data/input/keybindings";
import {
  PLAYER_ACCELERATION_MULTIPLIER,
  PLAYER_AIR_CONTROL_FACTOR,
  PLAYER_CAPSULE_RADIUS,
  PLAYER_EYE_HEIGHT,
  PLAYER_FALL_RESPAWN_DELAY,
  PLAYER_FALL_RESPAWN_Y,
  PLAYER_GRAVITY,
  PLAYER_JUMP_SPEED,
  PLAYER_MAX_DELTA,
  PLAYER_XZ_DAMPING_FACTOR,
} from "@/data/player/playerConfig";
import { useTerrainHeightSampler } from "@/hooks/three/useTerrainHeight";
import { InteractionManager } from "@/managers/InteractionManager";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useSettingsStore } from "@/managers/stores/useSettingsStore";
import type { Vector3Tuple } from "@/types/three/three";
import {
  EBIKE_ACCELERATION_DURATION_MS,
  EBIKE_CAMERA_TRANSFORM,
  EBIKE_DECELERATION_DURATION_MS,
} from "@/data/ebike/ebikeConfig";
import { useSceneMode } from "@/hooks/debug/useSceneMode";

/** Global window properties used for ebike communication */
interface EbikeGlobalState {
  ebikeParkedPosition?: Vector3Tuple;
  ebikeParkedRotation?: number;
  ebikeSteerFactor?: number;
  ebikeVisualGroup?: React.RefObject<THREE.Group>;
  playerPos?: Vector3Tuple;
  ebikeAngle?: number;
  ebikeBreakdownActive?: boolean;
  ebikeDriveInputActive?: boolean;
  ebikeSpeedFactor?: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Extending Window with EbikeGlobalState properties
  interface Window extends EbikeGlobalState {}
}

type Keys = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
};

const DEFAULT_KEYS: Keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
};

const PLAYER_COLLISION_ITERATIONS = 3;
const PLAYER_FLOOR_NORMAL_MIN = 0.15;
const PLAYER_GROUND_SNAP_DISTANCE = 0.22;

interface PlayerControllerProps {
  initialLookAt?: Vector3Tuple | undefined;
  octree: Octree | null;
  spawnPosition: Vector3Tuple;
}

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _wishDir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _translateVec = new THREE.Vector3();
const _collisionCorrection = new THREE.Vector3();

function resetPlayerCapsule(
  capsule: Capsule,
  spawnPosition: Vector3Tuple,
  initialLookAt: Vector3Tuple | undefined,
  camera: THREE.Camera,
  velocity: THREE.Vector3,
): void {
  capsule.start.set(
    spawnPosition[0],
    spawnPosition[1] - PLAYER_EYE_HEIGHT + PLAYER_CAPSULE_RADIUS,
    spawnPosition[2],
  );
  capsule.end.set(...spawnPosition);
  velocity.set(0, 0, 0);
  camera.position.copy(capsule.end);
  if (initialLookAt) camera.lookAt(...initialLookAt);
}

function createSpawnCapsule(spawnPosition: Vector3Tuple): Capsule {
  return new Capsule(
    new THREE.Vector3(
      spawnPosition[0],
      spawnPosition[1] - PLAYER_EYE_HEIGHT + PLAYER_CAPSULE_RADIUS,
      spawnPosition[2],
    ),
    new THREE.Vector3(...spawnPosition),
    PLAYER_CAPSULE_RADIUS,
  );
}

function isPlayerInputLocked(): boolean {
  return (
    useSettingsStore.getState().isSettingsMenuOpen ||
    useGameStore.getState().isCinematicPlaying
  );
}

function setMovementKey(keys: Keys, key: string, pressed: boolean): boolean {
  switch (key.toLowerCase()) {
    case MOVE_FORWARD_KEY:
      keys.forward = pressed;
      return true;
    case MOVE_BACKWARD_KEY:
      keys.backward = pressed;
      return true;
    case MOVE_LEFT_KEY:
      keys.left = pressed;
      return true;
    case MOVE_RIGHT_KEY:
      keys.right = pressed;
      return true;
    default:
      return false;
  }
}

function getCapsuleFootY(capsule: Capsule): number {
  return capsule.start.y - capsule.radius;
}

export function PlayerController({
  initialLookAt,
  octree,
  spawnPosition,
}: PlayerControllerProps): null {
  const camera = useThree((state) => state.camera);
  const sceneMode = useSceneMode();
  const terrainHeight = useTerrainHeightSampler();
  const keys = useRef<Keys>({ ...DEFAULT_KEYS });
  const velocity = useRef(new THREE.Vector3());
  const fallDuration = useRef(0);
  const onFloor = useRef(false);
  const wantsJump = useRef(false);
  const initializedRef = useRef(false);
  const canMove = useGameStore((state) => state.missionFlow.canMove);
  const currentSpeed = useGameStore((state) => state.player.currentSpeed);
  const movementMode = useGameStore((state) => state.player.movementMode);
  const movementModeRef = useRef(movementMode);
  const prevMovementModeRef = useRef(movementMode);
  const ebikeAngle = useRef(0);
  const ebikeSpeedFactor = useRef(0);
  const capsule = useRef(createSpawnCapsule(spawnPosition));

  useEffect(() => {
    movementModeRef.current = movementMode;
  }, [movementMode]);
  // eslint-disable-next-line react-hooks/immutability -- Three.js camera properties (position, rotation, fov) must be mutated directly; this is the standard pattern for R3F
  useEffect(() => {
    if (movementMode === "ebike") {
      const targetPos: Vector3Tuple = window.ebikeParkedPosition ?? [0, 8.2, 0];
      const targetRot: number = window.ebikeParkedRotation ?? 0;

      const headY = targetPos[1] + PLAYER_EYE_HEIGHT;
      const bottomY = targetPos[1] + PLAYER_CAPSULE_RADIUS;

      capsule.current.start.set(targetPos[0], bottomY, targetPos[2]);
      capsule.current.end.set(targetPos[0], headY, targetPos[2]);
      velocity.current.set(0, 0, 0);
      onFloor.current = false;
      wantsJump.current = false;
      ebikeSpeedFactor.current = 0;

      ebikeAngle.current = targetRot;

      const cameraOffset = new THREE.Vector3(
        ...EBIKE_CAMERA_TRANSFORM.position,
      );
      cameraOffset.applyAxisAngle(_up, targetRot);

      const camPos = new THREE.Vector3()
        .copy(capsule.current.end)
        .add(cameraOffset);
      camera.position.copy(camPos);

      const pitchRad = THREE.MathUtils.degToRad(
        EBIKE_CAMERA_TRANSFORM.rotation[0],
      );
      const yawRad =
        THREE.MathUtils.degToRad(EBIKE_CAMERA_TRANSFORM.rotation[1]) +
        targetRot;
      const rollRad = THREE.MathUtils.degToRad(
        EBIKE_CAMERA_TRANSFORM.rotation[2],
      );
      camera.rotation.set(pitchRad, yawRad, rollRad, "YXZ");
    } else if (
      movementMode === "walk" &&
      prevMovementModeRef.current === "ebike"
    ) {
      const perspectiveCam = camera as THREE.PerspectiveCamera;
      // eslint-disable-next-line react-hooks/immutability -- Three.js camera.fov must be mutated directly for dynamic FOV changes
      perspectiveCam.fov = 60;
      perspectiveCam.updateProjectionMatrix();

      const rightDir = new THREE.Vector3();
      camera.getWorldDirection(_forward);
      _forward.setY(0).normalize();
      rightDir.crossVectors(_forward, _up).normalize();

      const shift = rightDir.multiplyScalar(3);
      capsule.current.translate(shift);
      camera.position.copy(capsule.current.end);
      ebikeSpeedFactor.current = 0;
    }
    prevMovementModeRef.current = movementMode;
  }, [movementMode, camera]);

  useLayoutEffect(() => {
    resetPlayerCapsule(
      capsule.current,
      spawnPosition,
      initialLookAt,
      camera,
      velocity.current,
    );
    fallDuration.current = 0;
    onFloor.current = false;
    wantsJump.current = false;
    initializedRef.current = true;
  }, [camera, initialLookAt, spawnPosition]);

  useEffect(() => {
    const interaction = InteractionManager.getInstance();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (isPlayerInputLocked()) return;

      if (setMovementKey(keys.current, event.key, true)) {
        event.preventDefault();
        return;
      }

      if (event.key === JUMP_KEY) {
        wantsJump.current = true;
        event.preventDefault();
        return;
      }

      if (event.key.toLowerCase() === INTERACT_KEY) {
        if (interaction.getState().focused?.kind === "trigger") {
          interaction.pressInteract();
        }
        event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      if (isPlayerInputLocked()) return;

      if (setMovementKey(keys.current, event.key, false)) {
        event.preventDefault();
      }
    };

    const handleMouseDown = (event: MouseEvent): void => {
      if (isPlayerInputLocked()) return;
      if (event.button !== PRIMARY_INTERACT_MOUSE_BUTTON) return;
      if (interaction.getState().focused?.kind === "grab") {
        interaction.pressInteract();
      }
    };

    const handleMouseUp = (event: MouseEvent): void => {
      if (isPlayerInputLocked()) return;
      if (event.button !== PRIMARY_INTERACT_MOUSE_BUTTON) return;
      if (interaction.getState().holding) {
        interaction.releaseInteract();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      keys.current = { ...DEFAULT_KEYS };
    };
  }, []);

  // eslint-disable-next-line react-hooks/immutability -- Three.js camera properties (position, rotation, fov) must be mutated directly in frame loop; this is the standard pattern for R3F game loops
  useFrame((_, delta) => {
    if (!initializedRef.current) return;

    const dt = Math.min(delta, PLAYER_MAX_DELTA);

    if (capsule.current.end.y < PLAYER_FALL_RESPAWN_Y) {
      fallDuration.current += dt;

      if (fallDuration.current >= PLAYER_FALL_RESPAWN_DELAY) {
        resetPlayerCapsule(
          capsule.current,
          spawnPosition,
          initialLookAt,
          camera,
          velocity.current,
        );
        fallDuration.current = 0;
        onFloor.current = false;
        wantsJump.current = false;
        return;
      }
    } else {
      fallDuration.current = 0;
    }

    if (isPlayerInputLocked() || !canMove) {
      keys.current = { ...DEFAULT_KEYS };
      velocity.current.set(0, 0, 0);
      wantsJump.current = false;
      return;
    }

    const isEbikeMounted = movementModeRef.current === "ebike";
    const isEbikeBreakdown = window.ebikeBreakdownActive === true;

    if (isEbikeMounted && !isEbikeBreakdown) {
      const turnSpeed = 1.8;
      if (keys.current.left) {
        ebikeAngle.current += turnSpeed * dt;
      }
      if (keys.current.right) {
        ebikeAngle.current -= turnSpeed * dt;
      }
    }

    camera.getWorldDirection(_forward);
    _forward.setY(0);
    if (_forward.lengthSq() > 0) {
      _forward.normalize();
      _right.crossVectors(_forward, _up).normalize();
    }

    _wishDir.set(0, 0, 0);
    // Block drive input only when still on the bike during breakdown.
    // Once auto-dismounted (movementMode === "walk"), the player must
    // remain free to walk around even though ebikeBreakdownActive is true.
    const blockDriveInput = isEbikeMounted && isEbikeBreakdown;
    if (!blockDriveInput) {
      if (keys.current.forward) _wishDir.add(_forward);
      if (keys.current.backward) _wishDir.sub(_forward);
      if (!isEbikeMounted) {
        if (keys.current.left) _wishDir.sub(_right);
        if (keys.current.right) _wishDir.add(_right);
      }
    }
    if (_wishDir.lengthSq() > 0) _wishDir.normalize();

    if (isEbikeMounted) {
      const isDriveInputActive = _wishDir.lengthSq() > 0 && !isEbikeBreakdown;
      const durationMs = isDriveInputActive
        ? EBIKE_ACCELERATION_DURATION_MS
        : EBIKE_DECELERATION_DURATION_MS;
      const factorDelta = durationMs > 0 ? (dt * 1000) / durationMs : 1;
      ebikeSpeedFactor.current = THREE.MathUtils.clamp(
        ebikeSpeedFactor.current +
          (isDriveInputActive ? factorDelta : -factorDelta),
        0,
        1,
      );
      window.ebikeDriveInputActive = isDriveInputActive;
      window.ebikeSpeedFactor = ebikeSpeedFactor.current;
    } else {
      window.ebikeDriveInputActive = false;
      window.ebikeSpeedFactor = 0;
    }

    const movementSpeed = isEbikeMounted
      ? currentSpeed * ebikeSpeedFactor.current
      : currentSpeed;
    const accel = onFloor.current
      ? movementSpeed
      : movementSpeed * PLAYER_AIR_CONTROL_FACTOR;
    velocity.current.x +=
      _wishDir.x * accel * dt * PLAYER_ACCELERATION_MULTIPLIER;
    velocity.current.z +=
      _wishDir.z * accel * dt * PLAYER_ACCELERATION_MULTIPLIER;

    const damping = Math.exp(-PLAYER_XZ_DAMPING_FACTOR * dt);
    velocity.current.x *= damping;
    velocity.current.z *= damping;

    if (
      isEbikeMounted &&
      isEbikeBreakdown &&
      ebikeSpeedFactor.current <= 0.001 &&
      Math.hypot(velocity.current.x, velocity.current.z) <= 0.05
    ) {
      velocity.current.setX(0);
      velocity.current.setZ(0);
      useGameStore.getState().setPlayerMovementMode("walk");
      return;
    }

    if (onFloor.current) {
      velocity.current.y = Math.max(0, velocity.current.y);
      if (wantsJump.current) {
        velocity.current.y = PLAYER_JUMP_SPEED;
        onFloor.current = false;
      }
    } else {
      velocity.current.y -= PLAYER_GRAVITY * dt;
    }
    wantsJump.current = false;

    _translateVec.copy(velocity.current).multiplyScalar(dt);
    capsule.current.translate(_translateVec);

    if (octree) {
      onFloor.current = false;

      for (let index = 0; index < PLAYER_COLLISION_ITERATIONS; index++) {
        const result = octree.capsuleIntersect(capsule.current);
        if (!result) break;

        const isFloorCollision = result.normal.y > PLAYER_FLOOR_NORMAL_MIN;
        onFloor.current ||= isFloorCollision;
        const normalVelocity = result.normal.dot(velocity.current);

        if (!isFloorCollision && normalVelocity < 0) {
          velocity.current.addScaledVector(result.normal, -normalVelocity);
        }

        if (isFloorCollision) {
          velocity.current.y = Math.max(0, velocity.current.y);
          capsule.current.translate(
            _collisionCorrection.set(0, result.depth / result.normal.y, 0),
          );
          continue;
        }

        capsule.current.translate(
          _collisionCorrection.copy(result.normal).multiplyScalar(result.depth),
        );
      }
    }

    if (sceneMode === "game") {
      const groundHeight = terrainHeight.getHeight(
        capsule.current.end.x,
        capsule.current.end.z,
      );
      if (groundHeight !== null && velocity.current.y <= 0) {
        const groundOffset = getCapsuleFootY(capsule.current) - groundHeight;

        if (groundOffset <= PLAYER_GROUND_SNAP_DISTANCE) {
          capsule.current.translate(
            _collisionCorrection.set(0, -groundOffset, 0),
          );
          velocity.current.y = 0;
          onFloor.current = true;
        }
      }
    }

    if (movementModeRef.current === "ebike") {
      let targetSteer = 0;
      if (keys.current.left) targetSteer = 1;
      else if (keys.current.right) targetSteer = -1;

      const currentSteer = window.ebikeSteerFactor ?? 0;
      const steerFactor = THREE.MathUtils.lerp(
        currentSteer,
        targetSteer,
        8 * dt,
      );
      window.ebikeSteerFactor = steerFactor;

      // ── Ebike camera tuning ──────────────────────────────────────────────────
      // All motion effects in one place — set to 0 to fully disable each one.
      /** Lateral camera drift when steering (0 = no sway) */
      const CAM_SWAY_SIDE = -0.5;
      /** Vertical camera drop when steering (0 = no recoil) */
      const CAM_SWAY_VERTICAL = 0;
      /** Position lerp factor. 1 = instant snap, lower = more lag/trail */
      const CAM_POS_LERP = 1;
      /** FOV boost at full speed in degrees (0 = constant FOV) */
      const CAM_FOV_BOOST = 0.15; // speed × 0.15, capped at 3° → subtle speed sensation
      /** How fast FOV lerps toward target (lower = slower breathing) */
      const CAM_FOV_LERP = 4;
      /** Visual body lean in radians at max steer (20° = 0.349 rad) */
      const BIKE_LEAN = THREE.MathUtils.degToRad(10);
      // ─────────────────────────────────────────────────────────────────────────

      const speed = velocity.current.length();
      const perspectiveCam = camera as THREE.PerspectiveCamera;
      // eslint-disable-next-line react-hooks/immutability -- Three.js camera.fov must be mutated directly for dynamic FOV changes during frame updates
      perspectiveCam.fov = THREE.MathUtils.lerp(
        perspectiveCam.fov,
        60 + Math.min(speed * CAM_FOV_BOOST, 3),
        CAM_FOV_LERP * dt,
      );
      perspectiveCam.updateProjectionMatrix();

      const cameraOffset = new THREE.Vector3(
        ...EBIKE_CAMERA_TRANSFORM.position,
      );
      cameraOffset.applyAxisAngle(_up, ebikeAngle.current);

      const swingX = -Math.abs(steerFactor) * CAM_SWAY_VERTICAL;
      const swingZ = steerFactor * CAM_SWAY_SIDE;
      const cameraSwing = new THREE.Vector3(swingX, 0, swingZ);
      cameraSwing.applyAxisAngle(_up, ebikeAngle.current);
      cameraOffset.add(cameraSwing);

      const targetCamPos = new THREE.Vector3()
        .copy(capsule.current.end)
        .add(cameraOffset);

      camera.position.lerp(targetCamPos, CAM_POS_LERP);

      const pitchRad = THREE.MathUtils.degToRad(
        EBIKE_CAMERA_TRANSFORM.rotation[0],
      );
      const yawRad =
        THREE.MathUtils.degToRad(EBIKE_CAMERA_TRANSFORM.rotation[1]) +
        ebikeAngle.current;
      const rollRad = THREE.MathUtils.degToRad(
        EBIKE_CAMERA_TRANSFORM.rotation[2],
      );
      camera.rotation.set(pitchRad, yawRad, rollRad, "YXZ");

      const ebikeVisual = window.ebikeVisualGroup?.current;
      if (ebikeVisual) {
        ebikeVisual.position.set(
          capsule.current.end.x,
          capsule.current.end.y - PLAYER_EYE_HEIGHT,
          capsule.current.end.z,
        );
        ebikeVisual.rotation.set(
          steerFactor * -BIKE_LEAN,
          ebikeAngle.current,
          0,
          "YXZ",
        );
      }
    } else {
      camera.position.copy(capsule.current.end);
    }

    window.playerPos = [
      capsule.current.end.x,
      capsule.current.end.y,
      capsule.current.end.z,
    ];
    window.ebikeAngle = ebikeAngle.current;
  });

  return null;
}
