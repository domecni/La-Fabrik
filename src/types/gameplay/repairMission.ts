export type RepairMissionId = "bike" | "pylone" | "ferme";

export type MissionStep =
  | "locked"
  | "waiting"
  | "inspected"
  | "fragmented"
  | "scanning"
  | "repairing"
  | "reassembling"
  | "done";

export const REPAIR_MISSION_IDS = ["bike", "pylone", "ferme"] as const;

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

export function isRepairMissionId(value: string): value is RepairMissionId {
  return (REPAIR_MISSION_IDS as readonly string[]).includes(value);
}

export function isMissionStep(value: string): value is MissionStep {
  return (MISSION_STEPS as readonly string[]).includes(value);
}
