import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { TERRAIN_MODEL_PATH } from "@/data/world/terrainConfig";
import type { Vector3Tuple } from "@/types/three/three";
import { getMapNodesByName } from "@/utils/map/loadMapSceneData";

const RAYCAST_Y = 500;
const RAYCAST_FAR = 1000;
const DOWN = new THREE.Vector3(0, -1, 0);
const DEFAULT_TERRAIN_POSITION: Vector3Tuple = [0, 0, 0];
const DEFAULT_TERRAIN_ROTATION: Vector3Tuple = [0, 0, 0];
const DEFAULT_TERRAIN_SCALE: Vector3Tuple = [1, 1, 1];

interface TerrainHeightSampler {
  getHeight: (x: number, z: number) => number | null;
}

function createTerrainHeightSampler(
  scene: THREE.Object3D,
  position: Vector3Tuple,
  rotation: Vector3Tuple,
  scale: Vector3Tuple,
): TerrainHeightSampler {
  const meshes: THREE.Mesh[] = [];
  const terrainMatrix = new THREE.Matrix4().compose(
    new THREE.Vector3(...position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
    new THREE.Vector3(...scale),
  );
  const inverseTerrainMatrix = terrainMatrix.clone().invert();
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
      const localOrigin = new THREE.Vector3(x, RAYCAST_Y, z).applyMatrix4(
        inverseTerrainMatrix,
      );
      const localDirection =
        DOWN.clone().transformDirection(inverseTerrainMatrix);
      raycaster.set(localOrigin, localDirection);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      return hit?.point.applyMatrix4(terrainMatrix).y ?? null;
    },
  };
}

export function useTerrainHeightSampler(): TerrainHeightSampler {
  const { scene } = useGLTF(TERRAIN_MODEL_PATH);
  const terrainNode = getMapNodesByName("terrain")[0];
  const position = terrainNode?.position ?? DEFAULT_TERRAIN_POSITION;
  const rotation = terrainNode?.rotation ?? DEFAULT_TERRAIN_ROTATION;
  const scale = terrainNode?.scale ?? DEFAULT_TERRAIN_SCALE;

  return useMemo(
    () => createTerrainHeightSampler(scene, position, rotation, scale),
    [position, rotation, scale, scene],
  );
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
