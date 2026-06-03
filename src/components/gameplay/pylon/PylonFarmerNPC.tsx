import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useAnimations } from "@react-three/drei";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useGameStore } from "@/managers/stores/useGameStore";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import {
  PYLON_FARMER_NPC_AFTER_POSITION,
  PYLON_FARMER_NPC_AFTER_POSITION_pylone_straight,
  PYLON_FARMER_NPC_AFTER_SCALE,
  PYLON_FARMER_NPC_POSITION,
  PYLON_FARMER_NPC_WALK_LOOK_AT,
  PYLON_FARMER_NPC_WALK_SPEED,
  PYLON_NARRATIVE_DIALOGUES,
  PYLON_NARRATIVE_INTERACT_RADIUS,
  PYLON_WORLD_POSITION,
} from "@/data/gameplay/pylonConfig";
import { pylonStraighteningSignal } from "@/components/gameplay/pylon/pylonSignals";

const ELECTRICIENNE_MODEL_PATH = "/models/electricienne-animated/model.gltf";
const ANIM_FADE = 0.3;
const ARRIVE_THRESHOLD = 0.12;

type NPCAnimation = "idle" | "walk" | "push";

const _target = new THREE.Vector3();

/**
 * Compute the Y rotation (radians) for a model whose default forward
 * direction is +Z, so that it faces from `from` toward `to`.
 */
function faceToward(
  from: THREE.Vector3,
  to: readonly [number, number, number],
): number {
  const dx = to[0] - from.x;
  const dz = to[2] - from.z;
  return Math.atan2(dx, dz);
}

/**
 * Outer shell — only checks visibility conditions.
 * Rendering is delegated to PylonFarmerNPCContent so that the heavy hooks
 * (useFrame, useAnimations) are only active while the NPC is actually shown.
 */
export function PylonFarmerNPC(): React.JSX.Element | null {
  const mainState = useGameStore((state) => state.mainState);
  const step = useGameStore((state) => state.pylon.currentStep);

  if (mainState !== "pylon") return null;
  // Visible during narrative + at repair completion (hides during repair steps)
  if (
    step !== "arrived" &&
    step !== "npc-return" &&
    step !== "inspected" &&
    step !== "done"
  ) {
    return null;
  }

  return <PylonFarmerNPCContent />;
}

// ─── Inner component — heavy hooks only run when NPC is mounted ──────────────
function PylonFarmerNPCContent(): React.JSX.Element {
  const step = useGameStore((state) => state.pylon.currentStep);
  const setMissionStep = useGameStore((state) => state.setMissionStep);
  const camera = useThree((state) => state.camera);

  const groupRef = useRef<THREE.Group>(null);
  const currentPosRef = useRef(new THREE.Vector3(...PYLON_FARMER_NPC_POSITION));

  // Animation state guard — null forces playAnim to always trigger
  const currentAnimRef = useRef<NPCAnimation | null>(null);

  // Signal edge tracking
  const wasStraighteningRef = useRef(false);
  const wasCompletedRef = useRef(false);

  // Saved Y rotation used whenever the NPC is stationary
  const savedRotationYRef = useRef<number>(0);

  const { scene, animations } = useLoggedGLTF(ELECTRICIENNE_MODEL_PATH, {
    scope: "PylonFarmerNPC",
  });
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // actions is in deps of playAnim: when useAnimations populates it (async useState
  // inside drei), playAnim recreates → useEffect([step, playAnim]) re-fires → animation plays.
  const { actions } = useAnimations(animations, model);

  // ─── playAnim ─────────────────────────────────────────────────────────────
  // NOTE: actions is intentionally in the dep array so this callback is
  // recreated when drei's internal state populates the actions map.
  // External THREE.AnimationAction lifecycle methods (fadeOut/fadeIn/play +
  // setLoop/clampWhenFinished mutations) are intentional side effects on
  // drei-managed objects.
  /* eslint-disable react-hooks/immutability */
  const playAnim = useCallback(
    (name: NPCAnimation, fade = ANIM_FADE): void => {
      if (currentAnimRef.current === name) return;
      currentAnimRef.current = name;

      Object.values(actions).forEach((a) => a?.fadeOut(fade));

      const action = actions[name];
      if (!action) return;

      if (name === "push") {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
      action.reset().fadeIn(fade).play();
    },
    [actions],
  );
  /* eslint-enable react-hooks/immutability */

  // ─── Async audio after pylon is raised ────────────────────────────────────
  const playPostRaiseAudioAndAdvance = useCallback(async () => {
    const manifest = await loadDialogueManifest();
    if (manifest) {
      const audio = await playDialogueById(
        manifest,
        PYLON_NARRATIVE_DIALOGUES.electricienneApresMontage,
      );
      if (audio) {
        await new Promise<void>((resolve) => {
          audio.addEventListener("ended", () => resolve(), { once: true });
          audio.addEventListener("error", () => resolve(), { once: true });
        });
      }
    }
    pylonStraighteningSignal.completed = false;
    setMissionStep("pylon", "inspected");
  }, [setMissionStep]);

  // ─── Step-driven animation ────────────────────────────────────────────────
  // Fires when step changes OR when playAnim changes (i.e. when actions load).
  // playAnim mutates drei-managed AnimationAction internals (intentional).
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    currentAnimRef.current = null;
    if (step === "arrived") {
      currentPosRef.current.set(...PYLON_FARMER_NPC_POSITION);
      wasStraighteningRef.current = false;
      wasCompletedRef.current = false;
      savedRotationYRef.current = 0;
      playAnim("idle");
    } else if (step === "npc-return") {
      playAnim("walk");
    } else if (step === "inspected") {
      playAnim("idle");
    } else if (step === "done") {
      // NPC reappears at repair completion — position at the post-raise spot,
      // facing the pylon, playing idle.
      currentPosRef.current.set(
        ...PYLON_FARMER_NPC_AFTER_POSITION_pylone_straight,
      );
      savedRotationYRef.current = faceToward(
        currentPosRef.current,
        PYLON_WORLD_POSITION,
      );
      playAnim("idle");
    }
  }, [step, playAnim]);

  // ─── Per-frame: movement + rotation + signal detection ───────────────────
  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const isStraightening = pylonStraighteningSignal.started;
    const isCompleted = pylonStraighteningSignal.completed;

    // Rising edge: pylon straightening starts → push
    if (isStraightening && !wasStraighteningRef.current) {
      wasStraighteningRef.current = true;
      currentAnimRef.current = null;
      playAnim("push");
    }

    // Rising edge: straightening completed → idle + face player + audio
    if (isCompleted && !wasCompletedRef.current) {
      wasCompletedRef.current = true;
      currentAnimRef.current = null;
      playAnim("idle");
      savedRotationYRef.current = faceToward(currentPosRef.current, [
        camera.position.x,
        camera.position.y,
        camera.position.z,
      ]);
      void playPostRaiseAudioAndAdvance();
    }

    // ── Position ──────────────────────────────────────────────────────────
    if (step === "npc-return" && !isCompleted) {
      const targetPos = isStraightening
        ? PYLON_FARMER_NPC_AFTER_POSITION_pylone_straight
        : PYLON_FARMER_NPC_AFTER_POSITION;
      _target.set(...targetPos);

      const dist = currentPosRef.current.distanceTo(_target);
      if (dist > ARRIVE_THRESHOLD) {
        const t = Math.min((PYLON_FARMER_NPC_WALK_SPEED * delta) / dist, 1);
        currentPosRef.current.lerp(_target, t);
      } else if (!isStraightening && currentAnimRef.current === "walk") {
        playAnim("idle");
        savedRotationYRef.current = faceToward(
          currentPosRef.current,
          PYLON_WORLD_POSITION,
        );
      }
      group.position.copy(currentPosRef.current);
    } else if (step === "inspected" || step === "done") {
      group.position.set(...PYLON_FARMER_NPC_AFTER_POSITION_pylone_straight);
    } else if (isCompleted) {
      group.position.copy(currentPosRef.current);
    } else {
      group.position.set(...PYLON_FARMER_NPC_POSITION);
    }

    // ── Rotation ──────────────────────────────────────────────────────────
    if (
      step === "npc-return" &&
      !isCompleted &&
      currentAnimRef.current === "walk"
    ) {
      const walkRotY = faceToward(
        currentPosRef.current,
        PYLON_FARMER_NPC_WALK_LOOK_AT,
      );
      group.rotation.set(0, walkRotY, 0);
    } else {
      group.rotation.set(0, savedRotationYRef.current, 0);
    }

    group.scale.setScalar(PYLON_FARMER_NPC_AFTER_SCALE);
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group ref={groupRef} position={PYLON_FARMER_NPC_POSITION}>
      <primitive object={model} />
      {step === "arrived" ? (
        <InteractableObject
          kind="trigger"
          label="Parler à l'électricienne"
          position={PYLON_FARMER_NPC_POSITION}
          radius={PYLON_NARRATIVE_INTERACT_RADIUS}
          onPress={() => {
            // Turn to face the player the moment they engage the NPC
            savedRotationYRef.current = faceToward(currentPosRef.current, [
              camera.position.x,
              camera.position.y,
              camera.position.z,
            ]);

            void (async () => {
              const manifest = await loadDialogueManifest();
              if (!manifest) {
                setMissionStep("pylon", "npc-return");
                return;
              }
              const audio = await playDialogueById(
                manifest,
                PYLON_NARRATIVE_DIALOGUES.electricienneWelcome,
              );
              if (!audio) {
                setMissionStep("pylon", "npc-return");
                return;
              }
              audio.addEventListener(
                "ended",
                () => setMissionStep("pylon", "npc-return"),
                { once: true },
              );
            })();
          }}
        >
          <mesh>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </InteractableObject>
      ) : null}
    </group>
  );
}

useGLTF.preload(ELECTRICIENNE_MODEL_PATH);
