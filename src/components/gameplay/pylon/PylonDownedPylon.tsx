import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useGameStore } from "@/managers/stores/useGameStore";
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
import { pylonStraighteningSignal } from "@/components/gameplay/pylon/pylonSignals";

const PYLON_MODEL_PATH = "/models/pylone/model.glb";

export function PylonDownedPylon(): React.JSX.Element | null {
  const mainState = useGameStore((state) => state.mainState);
  const step = useGameStore((state) => state.pylon.currentStep);
  const setCanMove = useGameStore((state) => state.setCanMove);
  const [isStraightening, setIsStraightening] = useState(false);
  // Keeps the pylon upright after the animation completes while
  // PylonFarmerNPC plays the post-raise audio sequence.
  const [isRaised, setIsRaised] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const straightenStartRef = useRef<number | null>(null);
  const hasPlayedFirstAudioRef = useRef(false);

  useEffect(() => {
    if (step === "arrived") {
      hasPlayedFirstAudioRef.current = false;
      setIsRaised(false);
    }
  }, [step]);

  const { scene } = useGLTF(PYLON_MODEL_PATH);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    if (!isStraightening || straightenStartRef.current === null) {
      group.rotation.set(
        ...(showUpright ? PYLON_UPRIGHT_ROTATION : PYLON_DOWNED_ROTATION),
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

  const showUpright =
    isRaised ||
    mainState !== "pylon" ||
    step === "waiting" ||
    step === "inspected" ||
    step === "fragmented" ||
    step === "scanning" ||
    step === "repairing" ||
    step === "reassembling" ||
    step === "done" ||
    step === "narrator-outro";

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

  return (
    <group
      ref={groupRef}
      position={PYLON_WORLD_POSITION}
      rotation={PYLON_DOWNED_ROTATION}
    >
      <primitive object={scene.clone(true)} />
      {isPylonInteractive ? (
        <InteractableObject
          kind="trigger"
          label={
            step === "arrived" ? "Inspecter le pylône" : "Redresser le pylône"
          }
          position={PYLON_WORLD_POSITION}
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
