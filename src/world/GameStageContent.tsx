import { Ebike } from "@/components/ebike/Ebike";
import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { RepairGame } from "@/components/three/gameplay/RepairGame";
import {
  REPAIR_MISSION_POSITION_ENTRIES,
  REPAIR_MISSION_TRIGGERS,
} from "@/data/gameplay/repairMissionAnchors";
import {
  INTRO_STAGE_ANCHOR,
  OUTRO_STAGE_ANCHOR,
} from "@/data/gameplay/gameStageAnchors";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useRepairMissionAnchorStore } from "@/managers/stores/useRepairMissionAnchorStore";
import type { RepairMissionTriggerConfig } from "@/types/gameplay/repairMission";
import type { Vector3Tuple } from "@/types/three/three";
import { getRepairMissionPosition } from "@/utils/gameplay/repairMissionPosition";
import { EBIKE_WORLD_POSITION } from "@/data/ebike/ebikeConfig";

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
  const anchors = useRepairMissionAnchorStore((state) => state.anchors);
  const setMissionStep = useGameStore((state) => state.setMissionStep);
  const position = getRepairMissionPosition(config.mission, anchors);

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
  const anchors = useRepairMissionAnchorStore((state) => state.anchors);

  return (
    <>
      {mainState === "intro" ? <StageAnchor {...INTRO_STAGE_ANCHOR} /> : null}
      <Ebike position={EBIKE_WORLD_POSITION} />
      {REPAIR_MISSION_POSITION_ENTRIES.map(({ mission }) => {
        const position = getRepairMissionPosition(mission, anchors);
        if (!position) return null;
        return (
          <RepairGame key={mission} mission={mission} position={position} />
        );
      })}
      {REPAIR_MISSION_TRIGGERS.map((config) => (
        <RepairMissionTrigger key={config.mission} config={config} />
      ))}
      {mainState === "outro" ? <StageAnchor {...OUTRO_STAGE_ANCHOR} /> : null}
    </>
  );
}
