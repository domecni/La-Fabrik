import type {
  MissionStep,
  RepairMissionId,
} from "@/types/gameplay/repairMission";
import { REPAIR_MISSION_IDS } from "@/types/gameplay/repairMission";

const REPAIR_MISSION_ID_VALUES: ReadonlySet<string> = new Set(
  REPAIR_MISSION_IDS,
);

export const MISSION_STEPS = [
  "locked",
  "electricienne_history",
  "approaching",
  "arrived",
  "npc-return",
  "waiting",
  "inspected",
  "fragmented",
  "scanning",
  "repairing",
  "reassembling",
  "done",
  "narrator-outro",
] as const satisfies readonly MissionStep[];
const MISSION_STEP_VALUES: ReadonlySet<string> = new Set(MISSION_STEPS);

const PYLON_ONLY_MISSION_STEPS = new Set<MissionStep>([
  "approaching",
  "arrived",
  "npc-return",
  "narrator-outro",
]);
const FARM_ONLY_MISSION_STEPS = new Set<MissionStep>(["electricienne_history"]);

export function getMissionStepsFor(
  mission: RepairMissionId,
): readonly MissionStep[] {
  return MISSION_STEPS.filter((step) => {
    if (mission !== "pylon" && PYLON_ONLY_MISSION_STEPS.has(step)) {
      return false;
    }
    if (mission !== "farm" && FARM_ONLY_MISSION_STEPS.has(step)) {
      return false;
    }
    return true;
  });
}

export function isRepairMissionId(value: string): value is RepairMissionId {
  return REPAIR_MISSION_ID_VALUES.has(value);
}

export function isMissionStep(value: string): value is MissionStep {
  return MISSION_STEP_VALUES.has(value);
}

export function getNextMissionStep(
  step: MissionStep,
  mission?: RepairMissionId,
): MissionStep {
  switch (step) {
    case "locked":
      return mission === "pylon" ? "approaching" : "waiting";
    case "electricienne_history":
      return "done";
    case "approaching":
      return "arrived";
    case "arrived":
      return "npc-return";
    case "npc-return":
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
      return "done";
    case "done":
      return mission === "pylon" ? "narrator-outro" : "done";
    case "narrator-outro":
      return "narrator-outro";
  }
}

export function getPreviousMissionStep(
  step: MissionStep,
  mission?: RepairMissionId,
): MissionStep {
  switch (step) {
    case "locked":
      return "locked";
    case "electricienne_history":
      return "locked";
    case "approaching":
      return "locked";
    case "arrived":
      return "approaching";
    case "npc-return":
      return "arrived";
    case "waiting":
      return mission === "pylon" ? "npc-return" : "locked";
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
    case "narrator-outro":
      return "done";
  }
}
