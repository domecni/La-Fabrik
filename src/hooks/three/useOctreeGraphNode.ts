import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { Mesh, type Object3D } from "three";
import { Octree } from "three-stdlib";
import type { OctreeReadyHandler } from "@/types/three/three";

// [diag] temporary — count meshes/triangles captured in the octree graph node
function snapshotGraphNode(node: Object3D): {
  meshCount: number;
  triCount: number;
} {
  let meshCount = 0;
  let triCount = 0;
  node.traverse((obj) => {
    if (obj instanceof Mesh) {
      meshCount += 1;
      const geom = obj.geometry;
      const idx = geom.index;
      triCount += idx
        ? idx.count / 3
        : (geom.attributes.position?.count ?? 0) / 3;
    }
  });
  return { meshCount, triCount };
}

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

    // [diag] temporary — log octree contents to detect partial builds
    const snapshot = snapshotGraphNode(graphNode);
    console.log("[octree:build]", {
      rebuildKey,
      meshCount: snapshot.meshCount,
      triCount: Math.round(snapshot.triCount),
      timestamp: performance.now().toFixed(0),
    });

    onOctreeReady(octree);
  }, [enabled, graphNodeRef, onOctreeReady, rebuildKey]);
}
