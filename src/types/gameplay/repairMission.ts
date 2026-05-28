import type {
  ModelTransformProps,
  Vector3Scale,
  Vector3Tuple,
} from "@/types/three/three";

export type RepairMissionId = "bike" | "pylone" | "ferme";

export interface RepairMissionCaseConfig {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Scale;
}

export interface RepairMissionPartConfig {
  id: string;
  label: string;
  nodeName?: string;
  caseSlotName?: string;
  modelPath?: string;
}

export interface RepairScannedBrokenPart {
  id: string;
  label: string;
  modelPath: string;
  caseSlotName?: string;
}

export interface RepairMissionConfig {
  id: RepairMissionId;
  label: string;
  description: string;
  modelPath: string;
  modelScale?: ModelTransformProps["scale"];
  stageUiPath: string;
  interactUiPath: string;
  brokenUiPath: string;
  case: RepairMissionCaseConfig;
  reassemblySeconds?: number;
  requiredReplacementPartId: string;
  scanPartSeconds?: number;
  brokenParts: readonly RepairMissionPartConfig[];
  replacementParts: readonly RepairMissionPartConfig[];
}

export type MissionStep =
  | "locked"
  | "waiting"
  | "inspected"
  | "fragmented"
  | "scanning"
  | "repairing"
  | "reassembling"
  | "done";

const REPAIR_MISSION_IDS = ["bike", "pylone", "ferme"] as const;
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
