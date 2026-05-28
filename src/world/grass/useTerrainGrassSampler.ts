import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { TERRAIN_MODEL_PATH } from "@/data/world/terrainConfig";
import type { TerrainSurfaceBounds } from "@/types/world/terrainSurface";
import type { Vector3Tuple } from "@/types/three/three";
import { logger } from "@/utils/core/Logger";
import { getMapNodesByName } from "@/utils/map/loadMapSceneData";
import { GRASS_CONFIG } from "@/world/grass/grassConfig";

const RAYCAST_Y = 500;
const RAYCAST_FAR = 1000;
const DOWN = new THREE.Vector3(0, -1, 0);
const DEFAULT_TERRAIN_POSITION: Vector3Tuple = [0, 0, 0];
const DEFAULT_TERRAIN_ROTATION: Vector3Tuple = [0, 0, 0];
const DEFAULT_TERRAIN_SCALE: Vector3Tuple = [1, 1, 1];
let hasWarnedFallbackBounds = false;

interface TerrainGrassSample {
  normal: THREE.Vector3;
  position: THREE.Vector3;
}

export interface TerrainGrassSampler {
  bounds: TerrainSurfaceBounds;
  heightTexture: THREE.DataTexture;
  maxHeight: number;
  minHeight: number;
  sample: (x: number, z: number) => TerrainGrassSample | null;
}

function createFallbackTerrainBounds(): TerrainSurfaceBounds {
  if (!hasWarnedFallbackBounds) {
    hasWarnedFallbackBounds = true;
    logger.warn("Grass", "Terrain bounds missing, using fallback grass bounds");
  }

  return {
    minX: -120,
    maxX: 120,
    minZ: -120,
    maxZ: 120,
  };
}

function createTerrainMatrix(
  position: Vector3Tuple,
  rotation: Vector3Tuple,
  scale: Vector3Tuple,
): THREE.Matrix4 {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
    new THREE.Vector3(...scale),
  );
}

function createTerrainGrassSampler(
  scene: THREE.Object3D,
  position: Vector3Tuple,
  rotation: Vector3Tuple,
  scale: Vector3Tuple,
): TerrainGrassSampler {
  const meshes: THREE.Mesh[] = [];
  const terrainMatrix = createTerrainMatrix(position, rotation, scale);
  const inverseTerrainMatrix = terrainMatrix.clone().invert();
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(terrainMatrix);
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

  const terrainBounds = new THREE.Box3().setFromObject(scene);
  if (!terrainBounds.isEmpty()) {
    terrainBounds.applyMatrix4(terrainMatrix);
  }

  const bounds = terrainBounds.isEmpty()
    ? createFallbackTerrainBounds()
    : {
        minX: terrainBounds.min.x,
        maxX: terrainBounds.max.x,
        minZ: terrainBounds.min.z,
        maxZ: terrainBounds.max.z,
      };

  const sample = (x: number, z: number): TerrainGrassSample | null => {
    const localOrigin = new THREE.Vector3(x, RAYCAST_Y, z).applyMatrix4(
      inverseTerrainMatrix,
    );
    const localDirection =
      DOWN.clone().transformDirection(inverseTerrainMatrix);

    raycaster.set(localOrigin, localDirection);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    if (!hit) return null;

    const normal = hit.face?.normal
      .clone()
      .transformDirection(hit.object.matrixWorld)
      .applyMatrix3(normalMatrix)
      .normalize();

    return {
      position: hit.point.clone().applyMatrix4(terrainMatrix),
      normal: normal ?? new THREE.Vector3(0, 1, 0),
    };
  };

  const { heightTexture, maxHeight, minHeight } = createTerrainHeightTexture(
    bounds,
    sample,
  );

  return {
    bounds,
    heightTexture,
    maxHeight,
    minHeight,
    sample,
  };
}

function createTerrainHeightTexture(
  bounds: TerrainSurfaceBounds,
  sample: (x: number, z: number) => TerrainGrassSample | null,
): { heightTexture: THREE.DataTexture; maxHeight: number; minHeight: number } {
  const size = GRASS_CONFIG.heightTextureSize;
  const heights = new Float32Array(size * size);
  let minHeight = Number.POSITIVE_INFINITY;
  let maxHeight = Number.NEGATIVE_INFINITY;

  for (let zIndex = 0; zIndex < size; zIndex++) {
    for (let xIndex = 0; xIndex < size; xIndex++) {
      const xRatio = size <= 1 ? 0 : xIndex / (size - 1);
      const zRatio = size <= 1 ? 0 : zIndex / (size - 1);
      const x = bounds.minX + (bounds.maxX - bounds.minX) * xRatio;
      const z = bounds.minZ + (bounds.maxZ - bounds.minZ) * zRatio;
      const terrainSample = sample(x, z);
      const height = terrainSample?.position.y ?? 0;
      const index = zIndex * size + xIndex;

      heights[index] = height;
      minHeight = Math.min(minHeight, height);
      maxHeight = Math.max(maxHeight, height);
    }
  }

  if (!Number.isFinite(minHeight) || !Number.isFinite(maxHeight)) {
    minHeight = 0;
    maxHeight = 1;
  }

  const range = Math.max(maxHeight - minHeight, 0.0001);
  const data = new Uint8Array(size * size);

  for (let index = 0; index < heights.length; index++) {
    data[index] = Math.round(
      (((heights[index] ?? minHeight) - minHeight) / range) * 255,
    );
  }

  const heightTexture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RedFormat,
    THREE.UnsignedByteType,
  );
  heightTexture.magFilter = THREE.LinearFilter;
  heightTexture.minFilter = THREE.LinearFilter;
  heightTexture.wrapS = THREE.ClampToEdgeWrapping;
  heightTexture.wrapT = THREE.ClampToEdgeWrapping;
  heightTexture.needsUpdate = true;

  return { heightTexture, maxHeight, minHeight };
}

export function useTerrainGrassSampler(): TerrainGrassSampler {
  const { scene } = useGLTF(TERRAIN_MODEL_PATH);
  const terrainNode = getMapNodesByName("terrain")[0];
  const position = terrainNode?.position ?? DEFAULT_TERRAIN_POSITION;
  const rotation = terrainNode?.rotation ?? DEFAULT_TERRAIN_ROTATION;
  const scale = terrainNode?.scale ?? DEFAULT_TERRAIN_SCALE;

  return useMemo(
    () => createTerrainGrassSampler(scene, position, rotation, scale),
    [position, rotation, scale, scene],
  );
}
