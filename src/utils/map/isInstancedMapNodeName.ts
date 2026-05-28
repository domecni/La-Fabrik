import { MAP_INSTANCING_ASSETS } from "@/data/world/mapInstancingConfig";

const MAP_INSTANCED_NODE_NAMES: ReadonlySet<string> = new Set(
  Object.values(MAP_INSTANCING_ASSETS)
    .filter((config) => config.enabled)
    .map((config) => config.mapName),
);

export function isInstancedMapNodeName(name: string): boolean {
  return MAP_INSTANCED_NODE_NAMES.has(name);
}
