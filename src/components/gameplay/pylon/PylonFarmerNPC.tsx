import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useGameStore } from "@/managers/stores/useGameStore";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";
import {
  PYLON_FARMER_NPC_AFTER_POSITION,
  PYLON_FARMER_NPC_AFTER_POSITION_pylone_straight,
  PYLON_FARMER_NPC_AFTER_ROTATION,
  PYLON_FARMER_NPC_AFTER_SCALE,
  PYLON_FARMER_NPC_POSITION,
  PYLON_FARMER_NPC_WALK_SPEED,
  PYLON_NARRATIVE_DIALOGUES,
  PYLON_NARRATIVE_INTERACT_RADIUS,
} from "@/data/gameplay/pylonConfig";
import { pylonStraighteningSignal } from "@/components/gameplay/pylon/pylonSignals";

const _target = new THREE.Vector3();

export function PylonFarmerNPC(): React.JSX.Element | null {
  const mainState = useGameStore((state) => state.mainState);
  const step = useGameStore((state) => state.pylon.currentStep);
  const setMissionStep = useGameStore((state) => state.setMissionStep);
  const groupRef = useRef<THREE.Group>(null);
  const currentPosRef = useRef(new THREE.Vector3(...PYLON_FARMER_NPC_POSITION));

  // Reset position when entering arrived, set target when entering npc-return
  useEffect(() => {
    if (step === "arrived") {
      currentPosRef.current.set(...PYLON_FARMER_NPC_POSITION);
    }
  }, [step]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (step === "npc-return") {
      const targetPos = pylonStraighteningSignal.started
        ? PYLON_FARMER_NPC_AFTER_POSITION_pylone_straight
        : PYLON_FARMER_NPC_AFTER_POSITION;
      _target.set(...targetPos);
      currentPosRef.current.lerp(
        _target,
        Math.min(PYLON_FARMER_NPC_WALK_SPEED * delta, 1),
      );
      group.position.copy(currentPosRef.current);
      group.rotation.set(...PYLON_FARMER_NPC_AFTER_ROTATION);
      group.scale.setScalar(PYLON_FARMER_NPC_AFTER_SCALE);
    } else if (step === "inspected") {
      group.position.set(...PYLON_FARMER_NPC_AFTER_POSITION_pylone_straight);
      group.rotation.set(...PYLON_FARMER_NPC_AFTER_ROTATION);
      group.scale.setScalar(PYLON_FARMER_NPC_AFTER_SCALE);
    } else {
      group.position.set(...PYLON_FARMER_NPC_POSITION);
    }
  });

  if (mainState !== "pylon") return null;
  if (step !== "arrived" && step !== "npc-return" && step !== "inspected")
    return null;

  return (
    <group ref={groupRef} position={PYLON_FARMER_NPC_POSITION}>
      <mesh position={[0, 1, 0]}>
        <capsuleGeometry args={[0.4, 1.2, 6, 12]} />
        <meshStandardMaterial color="#a16207" />
      </mesh>
      <mesh position={[0, 1.95, 0]}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>

      {step === "arrived" ? (
        <InteractableObject
          kind="trigger"
          label="Parler au fermier"
          position={PYLON_FARMER_NPC_POSITION}
          radius={PYLON_NARRATIVE_INTERACT_RADIUS}
          onPress={() => {
            void (async () => {
              const manifest = await loadDialogueManifest();
              if (!manifest) {
                setMissionStep("pylon", "npc-return");
                return;
              }
              const audio = await playDialogueById(
                manifest,
                PYLON_NARRATIVE_DIALOGUES.farmerHelp,
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
