import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { TERRAIN_MODEL_PATH } from "@/data/world/terrainConfig";
import type {
  TerrainSurfaceBounds,
  TerrainSurfaceData,
} from "@/types/world/terrainSurface";
import { createTerrainSurfaceImageData } from "@/utils/world/terrainSurfaceSampler";

function findTerrainBaseColorTexture(
  scene: THREE.Object3D,
): THREE.Texture | null {
  let texture: THREE.Texture | null = null;

  scene.traverse((child) => {
    if (texture || !(child instanceof THREE.Mesh)) return;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    for (const material of materials) {
      if (material instanceof THREE.MeshStandardMaterial && material.map) {
        texture = material.map;
        return;
      }
    }
  });

  return texture;
}

function createTerrainSurfaceBounds(
  scene: THREE.Object3D,
): TerrainSurfaceBounds {
  scene.updateWorldMatrix(true, true);

  const box = new THREE.Box3().setFromObject(scene);
  return {
    minX: box.min.x,
    maxX: box.max.x,
    minZ: box.min.z,
    maxZ: box.max.z,
  };
}

export function useTerrainSurfaceData(): TerrainSurfaceData | null {
  const { scene } = useGLTF(TERRAIN_MODEL_PATH);

  return useMemo(() => {
    const texture = findTerrainBaseColorTexture(scene);
    if (!texture) return null;

    const imageData = createTerrainSurfaceImageData(texture);
    if (!imageData) return null;

    return {
      bounds: createTerrainSurfaceBounds(scene),
      imageData,
      raycastTarget: scene,
    };
  }, [scene]);
}
