import type { MapNode } from "@/types/map/mapScene";

export const POTAGER_MAP_NAME = "potager";
const POTAGER_DEFAULT_ROTATION_OFFSET = [0, 0, 0] as const;

const POTAGER_SOURCE_MAP_NAMES = new Set([
  "champdeble",
  "champdesoja",
  "champsdetournesol",
]);

export function isPotagerSourceMapNode(node: MapNode): boolean {
  const role = "role" in node ? node.role : undefined;

  return (
    node.type === "Object3D" &&
    role !== "group" &&
    POTAGER_SOURCE_MAP_NAMES.has(node.name) &&
    !node.position.every((value) => Math.abs(value) < 0.0001)
  );
}

export function createPotagerMapNode(sourceNode: MapNode): MapNode {
  return {
    name: POTAGER_MAP_NAME,
    type: sourceNode.type,
    position: sourceNode.position,
    rotation: [
      sourceNode.rotation[0] + POTAGER_DEFAULT_ROTATION_OFFSET[0],
      sourceNode.rotation[1] + POTAGER_DEFAULT_ROTATION_OFFSET[1],
      sourceNode.rotation[2] + POTAGER_DEFAULT_ROTATION_OFFSET[2],
    ],
    scale: sourceNode.scale,
  };
}
