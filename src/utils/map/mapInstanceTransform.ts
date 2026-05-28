import type { MapNode } from "@/types/map/mapScene";
import type { Vector3Tuple } from "@/types/three/three";

export interface MapNodeInstanceTransform {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
}

export function mapNodeToInstanceTransform(
  node: MapNode,
): MapNodeInstanceTransform {
  return {
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
  };
}
