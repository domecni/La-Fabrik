import {
  REPAIR_MISSION_ANCHOR_IDS,
  REPAIR_MISSION_POSITION_ENTRIES,
} from "@/data/gameplay/repairMissionAnchors";
import type { RepairMissionId } from "@/types/gameplay/repairMission";
import type { MapNode } from "@/types/map/mapScene";
import type { Vector3Tuple } from "@/types/three/three";

const REPAIR_MISSION_MAP_NODE_NAMES = {
  ebike: "ebike",
  pylon: "pylone",
  farm: "fermeverticale",
} as const satisfies Record<RepairMissionId, string>;

const REPAIR_MISSION_FALLBACK_POSITIONS = new Map(
  REPAIR_MISSION_POSITION_ENTRIES.map(({ mission, position }) => [
    mission,
    position,
  ]),
);

function isOriginPosition(position: Vector3Tuple): boolean {
  return position.every((value) => Math.abs(value) < 0.0001);
}

function hasDistinctTransform(node: MapNode): boolean {
  return (
    node.rotation.some((value) => Math.abs(value) > 0.0001) ||
    node.scale.some((value) => Math.abs(value - 1) > 0.0001)
  );
}

function distanceToPosition(node: MapNode, position: Vector3Tuple): number {
  return Math.hypot(
    node.position[0] - position[0],
    node.position[2] - position[2],
  );
}

function getAnchorNode(
  mapNodes: readonly MapNode[],
  mission: RepairMissionId,
  mapName: string,
): MapNode | null {
  const anchorId = REPAIR_MISSION_ANCHOR_IDS[mission];
  if (anchorId) {
    const nodeById = mapNodes.find((candidate) => candidate.id === anchorId);
    if (nodeById) return nodeById;
  }

  const candidates = mapNodes.filter(
    (candidate) =>
      candidate.name === mapName &&
      candidate.type === "Object3D" &&
      !isOriginPosition(candidate.position),
  );

  if (mission !== "pylon") return candidates[0] ?? null;

  const distinctCandidates = candidates.filter(hasDistinctTransform);
  const pylonCandidates =
    distinctCandidates.length > 0 ? distinctCandidates : candidates;
  const fallbackPosition = REPAIR_MISSION_FALLBACK_POSITIONS.get(mission);

  if (!fallbackPosition) return pylonCandidates[0] ?? null;

  return (
    [...pylonCandidates].sort(
      (a, b) =>
        distanceToPosition(a, fallbackPosition) -
        distanceToPosition(b, fallbackPosition),
    )[0] ?? null
  );
}

export function getRepairMissionMapAnchors(
  mapNodes: readonly MapNode[],
): Partial<Record<RepairMissionId, Vector3Tuple>> {
  const anchors: Partial<Record<RepairMissionId, Vector3Tuple>> = {};

  for (const [mission, mapName] of Object.entries(
    REPAIR_MISSION_MAP_NODE_NAMES,
  ) as [RepairMissionId, string][]) {
    const node = getAnchorNode(mapNodes, mission, mapName);

    if (node) {
      anchors[mission] = node.position;
    }
  }

  return anchors;
}
