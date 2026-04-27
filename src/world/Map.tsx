import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { MAP_DEBUG_BOX_HELPER_COLOR } from "@/data/debugConfig";
import { useOctreeGraphNode } from "@/hooks/useOctreeGraphNode";
import type { OctreeReadyHandler } from "@/types/3d";
import { Debug } from "@/utils/debug/Debug";

const MAP_PATH = "/models/map/model.gltf";

interface MapProps {
  onOctreeReady: OctreeReadyHandler;
}

export function Map({ onOctreeReady }: MapProps): React.JSX.Element {
  const { scene: gltfScene } = useGLTF(MAP_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const boxHelpersRef = useRef<THREE.BoxHelper[]>([]);
  const { scene } = useThree();

  useOctreeGraphNode(groupRef, onOctreeReady);

  useEffect(() => {
    const debug = Debug.getInstance();
    if (!debug.active || !groupRef.current) return;

    const helpers: THREE.BoxHelper[] = [];

    groupRef.current.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const helper = new THREE.BoxHelper(child, MAP_DEBUG_BOX_HELPER_COLOR);
      scene.add(helper);
      helpers.push(helper);
    });

    boxHelpersRef.current = helpers;

    return () => {
      helpers.forEach((h) => {
        scene.remove(h);
        h.dispose();
      });
      boxHelpersRef.current = [];
    };
  }, [scene]);

  return (
    <group ref={groupRef}>
      <primitive object={gltfScene} />
    </group>
  );
}

useGLTF.preload(MAP_PATH);
