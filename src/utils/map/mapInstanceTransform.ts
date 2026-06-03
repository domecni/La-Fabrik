import type { MapNode, MapNodeInstanceTransform } from "@/types/map/mapScene";

export function mapNodeToInstanceTransform(
  node: MapNode,
): MapNodeInstanceTransform {
  const transform: MapNodeInstanceTransform = {
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
  };

  if (node.id !== undefined) {
    transform.id = node.id;
  }

  return transform;
}
