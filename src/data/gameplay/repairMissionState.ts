import type {
  MissionStep,
  RepairMissionId,
} from "@/types/gameplay/repairMission";

const REPAIR_MISSION_IDS = ["ebike", "pylon", "farm"] as const;
const REPAIR_MISSION_ID_VALUES: ReadonlySet<string> = new Set(
  REPAIR_MISSION_IDS,
);

export const MISSION_STEPS = [
  "locked",
  "waiting",
  "inspected",
  "fragmented",
  "scanning",
  "repairing",
  "reassembling",
  "done",
] as const satisfies readonly MissionStep[];
const MISSION_STEP_VALUES: ReadonlySet<string> = new Set(MISSION_STEPS);

export function isRepairMissionId(value: string): value is RepairMissionId {
  return REPAIR_MISSION_ID_VALUES.has(value);
}

export function isMissionStep(value: string): value is MissionStep {
  return MISSION_STEP_VALUES.has(value);
}

export function getNextMissionStep(step: MissionStep): MissionStep {
  switch (step) {
    case "locked":
      return "waiting";
    case "waiting":
      return "inspected";
    case "inspected":
      return "fragmented";
    case "fragmented":
      return "scanning";
    case "scanning":
      return "repairing";
    case "repairing":
      return "reassembling";
    case "reassembling":
    case "done":
      return "done";
  }
}

export function getPreviousMissionStep(step: MissionStep): MissionStep {
  switch (step) {
    case "locked":
    case "waiting":
      return "locked";
    case "inspected":
      return "waiting";
    case "fragmented":
      return "inspected";
    case "scanning":
      return "fragmented";
    case "repairing":
      return "scanning";
    case "reassembling":
      return "repairing";
    case "done":
      return "reassembling";
  }
}
