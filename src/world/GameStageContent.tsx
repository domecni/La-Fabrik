import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { RepairGame } from "@/components/three/gameplay/RepairGame";
import {
  BIKE_REPAIR_POSITION,
  REPAIR_MISSION_POSITION_ENTRIES,
} from "@/data/gameplay/repairMissionAnchors";
import { useGameStore } from "@/managers/stores/useGameStore";
import type { Vector3Tuple } from "@/types/three/three";

interface StageAnchorProps {
  color: string;
  position: Vector3Tuple;
  scale?: number;
}

function StageAnchor({
  color,
  position,
  scale = 1,
}: StageAnchorProps): React.JSX.Element {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.25}
        />
      </mesh>
    </group>
  );
}

function EbikeMissionTrigger(): React.JSX.Element | null {
  const mainState = useGameStore((state) => state.mainState);
  const bikeStep = useGameStore((state) => state.bike.currentStep);
  const setMissionStep = useGameStore((state) => state.setMissionStep);

  if (mainState !== "bike" || bikeStep !== "locked") return null;

  return (
    <group position={BIKE_REPAIR_POSITION}>
      <InteractableObject
        kind="trigger"
        label="Réparer l'e-bike"
        position={BIKE_REPAIR_POSITION}
        radius={4}
        onPress={() => setMissionStep("bike", "waiting")}
      >
        <mesh>
          <sphereGeometry args={[1.3, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </InteractableObject>
    </group>
  );
}

export function GameStageContent(): React.JSX.Element {
  const mainState = useGameStore((state) => state.mainState);

  return (
    <>
      {mainState === "intro" ? (
        <StageAnchor color="#7dd3fc" position={[0, 4, 0]} />
      ) : null}
      {REPAIR_MISSION_POSITION_ENTRIES.map(({ mission, position }) => (
        <RepairGame key={mission} mission={mission} position={position} />
      ))}
      <EbikeMissionTrigger />
      {mainState === "outro" ? (
        <StageAnchor color="#fb7185" position={[0, 6, 10]} scale={1.25} />
      ) : null}
    </>
  );
}
