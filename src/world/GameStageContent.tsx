import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { RepairGame } from "@/components/three/gameplay/RepairGame";
import {
  REPAIR_MISSION_POSITION_ENTRIES,
  REPAIR_MISSION_TRIGGERS,
  type RepairMissionTriggerConfig,
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

function RepairMissionTrigger({
  config,
}: {
  config: RepairMissionTriggerConfig;
}): React.JSX.Element | null {
  const mainState = useGameStore((state) => state.mainState);
  const missionStep = useGameStore(
    (state) => state[config.mission].currentStep,
  );
  const setMissionStep = useGameStore((state) => state.setMissionStep);
  const position = REPAIR_MISSION_POSITION_ENTRIES.find(
    (entry) => entry.mission === config.mission,
  )?.position;

  if (!position) return null;
  if (mainState !== config.mission || missionStep !== "locked") return null;

  return (
    <group position={position}>
      <InteractableObject
        kind="trigger"
        label={config.label}
        position={position}
        radius={config.radius}
        onPress={() => setMissionStep(config.mission, "waiting")}
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
      {REPAIR_MISSION_TRIGGERS.map((config) => (
        <RepairMissionTrigger key={config.mission} config={config} />
      ))}
      {mainState === "outro" ? (
        <StageAnchor color="#fb7185" position={[0, 6, 10]} scale={1.25} />
      ) : null}
    </>
  );
}
