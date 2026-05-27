import type { MapNode } from "@/types/editor/editor";
import { isInstancedMapNodeName } from "@/world/map-instancing/mapInstancingConfig";

const MAP_STRUCTURE_NODE_NAMES = new Set(["Scene", "blocking", "terrain"]);
const RUNTIME_VEGETATION_NODE_NAMES = new Set([
  "arbre",
  "buisson",
  "champdeble",
  "champdesoja",
  "champsdetournesol",
  "sapin",
]);

export function isRuntimeStructureMapNode(name: string): boolean {
  return MAP_STRUCTURE_NODE_NAMES.has(name);
}

export function isRuntimeSingleMapNode(node: MapNode): boolean {
  if (isRuntimeStructureMapNode(node.name)) {
    return false;
  }

  if (node.type === "Mesh") {
    return false;
  }

  return (
    !RUNTIME_VEGETATION_NODE_NAMES.has(node.name) &&
    !isInstancedMapNodeName(node.name)
  );
}

export function isEditorVisibleMapNode(node: MapNode): boolean {
  return !isRuntimeStructureMapNode(node.name) && node.type !== "Mesh";
}

export function getTerrainMapNode(nodes: readonly MapNode[]): MapNode | null {
  return nodes.find((node) => node.name === "terrain") ?? null;
}
