import type { MapNode } from "@/types/editor/editor";

function isVector3Tuple(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

export function isMapNode(value: unknown): value is MapNode {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const node = value as Record<string, unknown>;
  return (
    typeof node.name === "string" &&
    typeof node.type === "string" &&
    isVector3Tuple(node.position) &&
    isVector3Tuple(node.rotation) &&
    isVector3Tuple(node.scale)
  );
}

export function parseMapNodes(value: unknown): MapNode[] {
  if (!Array.isArray(value) || !value.every(isMapNode)) {
    throw new Error("Invalid map node data");
  }

  return value;
}
