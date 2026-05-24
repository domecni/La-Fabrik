import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Vector3Tuple } from "@/types/three/three";

const TERRAIN_MODEL_PATH = "/models/terrain/model.gltf";
const RAYCAST_Y = 500;
const RAYCAST_FAR = 1000;
const DOWN = new THREE.Vector3(0, -1, 0);

interface TerrainHeightSampler {
  getHeight: (x: number, z: number) => number | null;
}

function createTerrainHeightSampler(
  scene: THREE.Object3D,
): TerrainHeightSampler {
  const meshes: THREE.Mesh[] = [];
  const raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    DOWN,
    0,
    RAYCAST_FAR,
  );

  scene.updateMatrixWorld(true);
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshes.push(child);
    }
  });

  return {
    getHeight: (x, z) => {
      raycaster.set(new THREE.Vector3(x, RAYCAST_Y, z), DOWN);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      return hit?.point.y ?? null;
    },
  };
}

export function useTerrainHeightSampler(): TerrainHeightSampler {
  const { scene } = useGLTF(TERRAIN_MODEL_PATH);

  return useMemo(() => createTerrainHeightSampler(scene), [scene]);
}

export function useTerrainSnappedPosition(
  position: Vector3Tuple,
): Vector3Tuple {
  const terrainHeight = useTerrainHeightSampler();

  return useMemo(() => {
    const [x, y, z] = position;
    const height = terrainHeight.getHeight(x, z);
    return [x, height ?? y, z];
  }, [position, terrainHeight]);
}

export function normalizeMapScale(scale: Vector3Tuple): Vector3Tuple {
  const [x, y, z] = scale;
  const isUniform = Math.abs(x - y) < 0.001 && Math.abs(x - z) < 0.001;
  return isUniform ? scale : [x, x, x];
}
