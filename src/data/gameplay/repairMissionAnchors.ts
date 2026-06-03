import type { Vector3Tuple } from "@/types/three/three";
import type {
  RepairMissionId,
  RepairMissionTriggerConfig,
} from "@/types/gameplay/repairMission";
import { EBIKE_WORLD_POSITION } from "@/data/ebike/ebikeConfig";
import { PYLON_WORLD_POSITION } from "@/data/gameplay/pylonConfig";

export const REPAIR_MISSION_ANCHOR_IDS: Partial<
  Record<RepairMissionId, string>
> = {
  pylon: "repair:pylon",
};

const EBIKE_REPAIR_POSITION = EBIKE_WORLD_POSITION satisfies Vector3Tuple;

const REPAIR_MISSION_POSITIONS = {
  ebike: EBIKE_REPAIR_POSITION,
  pylon: PYLON_WORLD_POSITION,
  farm: [-24, 0, 42],
} as const satisfies Record<RepairMissionId, Vector3Tuple>;

// Currently empty: the ebike mission entry point is handled directly by
// `Ebike.tsx`'s own InteractableObject ("Lancer le Repair Game"), and the
// pylon/farm missions transition through their narrative flows
// (PylonNarrativeFlow / FarmNarrativeFlow). Keep the array typed so we
// can re-introduce a generic anchor trigger in the future without
// touching the consumer in `GameStageContent.tsx`.
export const REPAIR_MISSION_TRIGGERS: readonly RepairMissionTriggerConfig[] =
  [];

export const REPAIR_MISSION_POSITION_ENTRIES = Object.entries(
  REPAIR_MISSION_POSITIONS,
).map(([mission, position]) => ({
  mission: mission as RepairMissionId,
  position,
})) satisfies readonly {
  mission: RepairMissionId;
  position: Vector3Tuple;
}[];
