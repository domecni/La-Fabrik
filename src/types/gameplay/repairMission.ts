import type {
  ModelTransformProps,
  Vector3Scale,
  Vector3Tuple,
} from "@/types/three/three";

export type RepairMissionId = "ebike" | "pylon" | "farm";

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
