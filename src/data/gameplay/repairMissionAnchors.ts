import type { Vector3Tuple } from "@/types/three/three";
import type {
  RepairMissionId,
  RepairMissionTriggerConfig,
} from "@/types/gameplay/repairMission";

export const REPAIR_MISSION_ANCHOR_IDS: Partial<
  Record<RepairMissionId, string>
> = {
  pylon: "repair:pylon",
};

const EBIKE_REPAIR_POSITION = [
  42.2399, 4.5484, 34.6468,
] as const satisfies Vector3Tuple;

const REPAIR_MISSION_POSITIONS = {
  ebike: EBIKE_REPAIR_POSITION,
  pylon: [64, 0, -66],
  farm: [-24, 0, 42],
} as const satisfies Record<RepairMissionId, Vector3Tuple>;

export const REPAIR_MISSION_TRIGGERS = [
  {
    mission: "ebike",
    label: "Réparer l'e-bike",
    radius: 4,
  },
] as const satisfies readonly RepairMissionTriggerConfig[];

export const REPAIR_MISSION_POSITION_ENTRIES = Object.entries(
  REPAIR_MISSION_POSITIONS,
).map(([mission, position]) => ({
  mission: mission as RepairMissionId,
  position,
})) satisfies readonly {
  mission: RepairMissionId;
  position: Vector3Tuple;
}[];
