import { REPAIR_MISSION_POSITION_ENTRIES } from "@/data/gameplay/repairMissionAnchors";
import type { RepairMissionId } from "@/types/gameplay/repairMission";
import type { Vector3Tuple } from "@/types/three/three";

const FALLBACK_REPAIR_MISSION_POSITIONS = new Map(
  REPAIR_MISSION_POSITION_ENTRIES.map(({ mission, position }) => [
    mission,
    position,
  ]),
);

export function getRepairMissionPosition(
  mission: RepairMissionId,
  anchors: Partial<Record<RepairMissionId, Vector3Tuple>>,
): Vector3Tuple | undefined {
  return anchors[mission] ?? FALLBACK_REPAIR_MISSION_POSITIONS.get(mission);
}
