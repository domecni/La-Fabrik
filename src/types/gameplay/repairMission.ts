import type {
  ModelTransformProps,
  Vector3Scale,
  Vector3Tuple,
} from "@/types/three/three";
import type { RepairCasePartAnchorName } from "@/data/gameplay/repairCaseConfig";

export const REPAIR_MISSION_IDS = ["ebike", "pylon", "farm"] as const;

export type RepairMissionId = (typeof REPAIR_MISSION_IDS)[number];

export interface RepairMissionTriggerConfig {
  mission: RepairMissionId;
  label: string;
  radius: number;
}

export interface RepairMissionCaseConfig {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Scale;
}

export interface RepairMissionPartConfig {
  id: string;
  label: string;
  nodeName?: string;
  /**
   * Name of a node inside the broken model where this part should snap on
   * install. Used by replacement parts that target a slot in the broken
   * model itself (e.g. pylon cable installs at the world-position of the
   * pylon's `cable2` node), and by broken parts that should spawn at their
   * original location on the broken model rather than a static offset.
   */
  targetNodeName?: string;
  caseSlotName?: string;
  /**
   * Anchor name in the packderelance case where this replacement part is
   * visually injected. When set, the part spawns at the world-position of
   * that anchor instead of a generic placeholder slot.
   */
  caseAnchor?: RepairCasePartAnchorName;
  /**
   * Group identifier for mutually exclusive replacement parts (e.g. pylon
   * cables: only one cable can be held/installed at a time). When one part
   * of the group is held, others in the same group are visually ghosted
   * and non-interactive.
   */
  caseLockGroup?: string;
  modelPath?: string;
  /**
   * Optional dialogue id to play when the scan sequence lands on this
   * part. The scan sequence will pause on this part for the duration
   * of the audio (instead of the default `scanPartSeconds` timer) and
   * advance to the next part on the audio's `ended` event. Use this to
   * deliver a node-specific diagnostic line (e.g. ebike refroidisseur
   * -> "narrateur_refroidisseur_diagnostic").
   */
  voiceLineId?: string;
}

export interface RepairScannedBrokenPart {
  id: string;
  label: string;
  modelPath: string;
  caseSlotName?: string;
  targetNodeName?: string;
}

export interface RepairMissionConfig {
  id: RepairMissionId;
  label: string;
  description: string;
  modelPath: string;
  modelScale?: ModelTransformProps["scale"];
  /**
   * World-space rotation applied to the model when mounted by RepairGame
   * (fragmented + repairing steps). Should match the rotation used by the
   * source object in the world (e.g. parked Ebike) so the fragmented model
   * lines up visually with the inspection model.
   */
  modelRotation?: Vector3Tuple;
  stageUiPath: string;
  interactUiPath: string;
  brokenUiPath: string;
  case: RepairMissionCaseConfig;
  reassemblySeconds?: number;
  /**
   * Replacement part IDs accepted as the correct install. Multiple values
   * are used when several alternatives are valid (e.g. pylon accepts either
   * cable model). Install validation succeeds when any one of these parts
   * is snapped into a placeholder slot.
   */
  requiredReplacementPartIds: readonly string[];
  scanPartSeconds?: number;
  brokenParts: readonly RepairMissionPartConfig[];
  replacementParts: readonly RepairMissionPartConfig[];
}

export type MissionStep =
  | "locked"
  | "approaching"
  | "arrived"
  | "npc-return"
  | "waiting"
  | "inspected"
  | "fragmented"
  | "scanning"
  | "repairing"
  | "reassembling"
  | "done"
  | "narrator-outro"
  | "electricienne_history";

export const PYLON_NARRATIVE_STEPS = [
  "approaching",
  "arrived",
  "npc-return",
  "narrator-outro",
] as const;

/** Farm-specific steps that bypass the repair-game flow. */
export const FARM_NARRATIVE_STEPS = [
  "locked",
  "electricienne_history",
] as const;

export const REPAIR_GAME_STEPS = [
  "waiting",
  "inspected",
  "fragmented",
  "scanning",
  "repairing",
  "reassembling",
  "done",
] as const;

export function isPylonNarrativeStep(step: MissionStep): boolean {
  return (PYLON_NARRATIVE_STEPS as readonly MissionStep[]).includes(step);
}

export function isFarmNarrativeStep(step: MissionStep): boolean {
  return (FARM_NARRATIVE_STEPS as readonly MissionStep[]).includes(step);
}

export function isRepairGameStep(step: MissionStep): boolean {
  return (REPAIR_GAME_STEPS as readonly MissionStep[]).includes(step);
}
