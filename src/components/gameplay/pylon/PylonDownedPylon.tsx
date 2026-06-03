import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useRepairMissionAnchorStore } from "@/managers/stores/useRepairMissionAnchorStore";
import { useTerrainSnappedPosition } from "@/hooks/three/useTerrainHeight";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";
import {
  PYLON_DOWNED_ROTATION,
  PYLON_NARRATIVE_INTERACT_RADIUS,
  PYLON_NARRATIVE_DIALOGUES,
  PYLON_STRAIGHTEN_ANIMATION_DURATION_MS,
  PYLON_UPRIGHT_ROTATION,
  PYLON_WORLD_POSITION,
} from "@/data/gameplay/pylonConfig";
import { isRepairGameStep } from "@/types/gameplay/repairMission";
import { pylonStraighteningSignal } from "@/components/gameplay/pylon/pylonSignals";

const PYLON_MODEL_PATH = "/models/pylone/model.glb";

export function PylonDownedPylon(): React.JSX.Element | null {
  const mainState = useGameStore((state) => state.mainState);
  const step = useGameStore((state) => state.pylon.currentStep);
  const setCanMove = useGameStore((state) => state.setCanMove);
  // Use the repair:pylon anchor from the store so the downed pylon is always
  // co-located with the instanced mesh it replaces. Falls back to the
  // hard-coded constant while the map is loading or unavailable.
  const pylonAnchor = useRepairMissionAnchorStore(
    (state) => state.anchors.pylon,
  );
  // Snap to terrain so the downed/upright model sits flush on the ground,
  // matching the Y adjustment that InstancedMapAsset applies to the same node.
  const position = useTerrainSnappedPosition(
    pylonAnchor ?? PYLON_WORLD_POSITION,
  );
  const [isStraightening, setIsStraightening] = useState(false);
  // Keeps the pylon upright after the animation completes while
  // PylonFarmerNPC plays the post-raise audio sequence.
  const [isRaised, setIsRaised] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const straightenStartRef = useRef<number | null>(null);
  const hasPlayedFirstAudioRef = useRef(false);

  // Hidden outside the pylon mission and once the pylon has been raised
  // (repair-game steps take over from there).
  const shouldRender = mainState === "pylon" && !isRepairGameStep(step);

  useEffect(() => {
    if (step === "arrived") {
      hasPlayedFirstAudioRef.current = false;
      // Reset the "raised" latch when a new run begins. This is derived
      // resync from the step prop and runs once per step transition.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRaised(false);
    }
  }, [step]);

  const { scene } = useGLTF(PYLON_MODEL_PATH);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    if (!isStraightening || straightenStartRef.current === null) {
      group.rotation.set(
        ...(isRaised ? PYLON_UPRIGHT_ROTATION : PYLON_DOWNED_ROTATION),
      );
      return;
    }

    const elapsed = performance.now() - straightenStartRef.current;
    const t = Math.min(elapsed / PYLON_STRAIGHTEN_ANIMATION_DURATION_MS, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const startEuler = new THREE.Euler(...PYLON_DOWNED_ROTATION);

    group.rotation.set(
      THREE.MathUtils.lerp(startEuler.x, 0, eased),
      startEuler.y,
      THREE.MathUtils.lerp(startEuler.z, 0, eased),
    );
  });

  const isPylonInteractive = step === "arrived" || step === "npc-return";

  const beginStraighten = (): void => {
    setIsStraightening(true);
    pylonStraighteningSignal.started = true;
    pylonStraighteningSignal.completed = false;
    straightenStartRef.current = performance.now();
    setCanMove(false);
    if (groupRef.current) {
      groupRef.current.rotation.set(...PYLON_DOWNED_ROTATION);
    }
    window.setTimeout(() => {
      setIsStraightening(false);
      pylonStraighteningSignal.started = false;
      // Keep pylon upright while PylonFarmerNPC plays the audio sequence.
      // PylonFarmerNPC will call setMissionStep("pylon", "inspected") once done.
      setIsRaised(true);
      setCanMove(true);
      pylonStraighteningSignal.completed = true;
    }, PYLON_STRAIGHTEN_ANIMATION_DURATION_MS);
  };

  if (!shouldRender) return null;

  return (
    <group ref={groupRef} position={position} rotation={PYLON_DOWNED_ROTATION}>
      <primitive object={scene.clone(true)} />
      {isPylonInteractive ? (
        <InteractableObject
          kind="trigger"
          label={
            step === "arrived" ? "Inspecter le pylône" : "Redresser le pylône"
          }
          position={position}
          radius={PYLON_NARRATIVE_INTERACT_RADIUS}
          onPress={() => {
            if (step === "arrived") {
              if (!hasPlayedFirstAudioRef.current) {
                hasPlayedFirstAudioRef.current = true;
                void (async () => {
                  const manifest = await loadDialogueManifest();
                  if (!manifest) return;
                  const audio = await playDialogueById(
                    manifest,
                    PYLON_NARRATIVE_DIALOGUES.brokenPylon,
                  );
                  if (!audio) return;
                  audio.addEventListener(
                    "ended",
                    () => {
                      void (async () => {
                        const m = await loadDialogueManifest();
                        if (!m) return;
                        await playDialogueById(
                          m,
                          PYLON_NARRATIVE_DIALOGUES.demandeAide,
                        );
                      })();
                    },
                    { once: true },
                  );
                })();
              } else {
                void (async () => {
                  const manifest = await loadDialogueManifest();
                  if (!manifest) return;
                  await playDialogueById(
                    manifest,
                    PYLON_NARRATIVE_DIALOGUES.demandeAide,
                  );
                })();
              }
            } else if (step === "npc-return" && !isStraightening) {
              beginStraighten();
            }
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

useGLTF.preload(PYLON_MODEL_PATH);
