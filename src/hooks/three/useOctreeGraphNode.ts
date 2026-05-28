import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Object3D } from "three";
import { Octree } from "three-stdlib";
import type { OctreeReadyHandler } from "@/types/three/three";

export function useOctreeGraphNode(
  graphNodeRef: RefObject<Object3D | null>,
  onOctreeReady: OctreeReadyHandler,
  rebuildKey: string | number = 0,
  enabled = true,
): void {
  const octreeBuilt = useRef(false);

  useEffect(() => {
    octreeBuilt.current = false;
  }, [rebuildKey]);

  useEffect(() => {
    if (!enabled) return;

    const graphNode = graphNodeRef.current;
    if (!enabled || octreeBuilt.current || !graphNode) return;
    octreeBuilt.current = true;

    graphNode.updateMatrixWorld(true);

    const octree = new Octree();
    octree.fromGraphNode(graphNode);
    onOctreeReady(octree);
  }, [enabled, graphNodeRef, onOctreeReady, rebuildKey]);
}
