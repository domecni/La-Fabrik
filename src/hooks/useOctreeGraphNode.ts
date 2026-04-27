import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Object3D } from "three";
import { Octree } from "three/addons/math/Octree.js";
import type { OctreeReadyHandler } from "@/types/3d";

export function useOctreeGraphNode(
  graphNodeRef: RefObject<Object3D | null>,
  onOctreeReady: OctreeReadyHandler,
): void {
  const octreeBuilt = useRef(false);

  useEffect(() => {
    const graphNode = graphNodeRef.current;
    if (octreeBuilt.current || !graphNode) return;
    octreeBuilt.current = true;

    graphNode.updateMatrixWorld(true);

    const octree = new Octree();
    octree.fromGraphNode(graphNode);
    onOctreeReady(octree);
  }, [graphNodeRef, onOctreeReady]);
}
