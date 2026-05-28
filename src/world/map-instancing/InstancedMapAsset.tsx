import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { mergeBufferGeometries } from "three-stdlib";
import {
  normalizeMapScale,
  useTerrainHeightSampler,
} from "@/hooks/three/useTerrainHeight";
import type { MapAssetInstance } from "@/types/map/mapScene";
import { optimizeGLTFSceneTextures } from "@/utils/three/optimizeGLTFScene";

interface InstancedMapAssetProps {
  modelPath: string;
  instances: MapAssetInstance[];
  scaleMultiplier: number;
  castShadow: boolean;
  receiveShadow: boolean;
}

interface MeshData {
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
}

interface MeshMergeGroup {
  geometries: THREE.BufferGeometry[];
  material: THREE.Material | THREE.Material[];
}

const meshDataCache = new Map<string, MeshData[]>();

function cloneMaterial(
  material: THREE.Material | THREE.Material[],
): THREE.Material | THREE.Material[] {
  return Array.isArray(material)
    ? material.map((item) => item.clone())
    : material.clone();
}

function disposeMaterialOnly(
  material: THREE.Material | THREE.Material[],
): void {
  if (Array.isArray(material)) {
    for (const item of material) {
      item.dispose();
    }
    return;
  }

  material.dispose();
}

function disposeInstancedMapMesh(mesh: THREE.InstancedMesh): void {
  mesh.dispose();
}

function createGeometrySignature(geometry: THREE.BufferGeometry): string {
  const attributes = Object.entries(geometry.attributes)
    .map(([name, attribute]) => {
      return `${name}:${attribute.itemSize}:${attribute.normalized}`;
    })
    .sort()
    .join("|");

  return `${geometry.index ? "indexed" : "non-indexed"}:${attributes}`;
}

function createMaterialKey(
  material: THREE.Material | THREE.Material[],
): string {
  if (Array.isArray(material)) {
    return material.map((item) => item.uuid).join("|");
  }

  return material.uuid;
}

function extractMeshes(scene: THREE.Group): MeshData[] {
  const groups = new Map<string, MeshMergeGroup>();

  scene.updateMatrixWorld(true);
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const geometry = child.geometry.clone();
    geometry.applyMatrix4(child.matrixWorld);
    const material = child.material;
    const key = `${createMaterialKey(material)}:${createGeometrySignature(geometry)}`;
    const group = groups.get(key);

    if (group) {
      group.geometries.push(geometry);
      return;
    }

    groups.set(key, {
      geometries: [geometry],
      material: cloneMaterial(material),
    });
  });

  return [...groups.values()]
    .map((group) => {
      if (group.geometries.length === 1) {
        const [geometry] = group.geometries;
        if (!geometry) return null;

        return {
          geometry,
          material: group.material,
        };
      }

      const mergedGeometry = mergeBufferGeometries(group.geometries, false);

      for (const geometry of group.geometries) {
        geometry.dispose();
      }

      if (!mergedGeometry) {
        disposeMaterialOnly(group.material);
        return null;
      }

      return {
        geometry: mergedGeometry,
        material: group.material,
      };
    })
    .filter((meshData): meshData is MeshData => meshData !== null);
}

function setInstanceMatrices(
  instancedMesh: THREE.InstancedMesh,
  instances: MapAssetInstance[],
  scaleMultiplier: number,
  geometryBottomY: number,
): void {
  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const matrix = new THREE.Matrix4();

  for (let i = 0; i < instances.length; i++) {
    const instance = instances[i];
    if (!instance) continue;

    position.set(...instance.position);
    rotation.set(...instance.rotation);
    quaternion.setFromEuler(rotation);
    scale.set(
      instance.scale[0] * scaleMultiplier,
      instance.scale[1] * scaleMultiplier,
      instance.scale[2] * scaleMultiplier,
    );
    position.y += -geometryBottomY * scale.y;
    matrix.compose(position, quaternion, scale);
    instancedMesh.setMatrixAt(i, matrix);
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
}

function getMeshBottomY(meshDataList: MeshData[]): number {
  let bottomY = Number.POSITIVE_INFINITY;

  for (const meshData of meshDataList) {
    meshData.geometry.computeBoundingBox();
    const minY = meshData.geometry.boundingBox?.min.y;
    if (minY !== undefined) {
      bottomY = Math.min(bottomY, minY);
    }
  }

  return Number.isFinite(bottomY) ? bottomY : 0;
}

export function InstancedMapAsset({
  modelPath,
  instances,
  scaleMultiplier,
  castShadow,
  receiveShadow,
}: InstancedMapAssetProps): React.JSX.Element | null {
  const { scene } = useGLTF(modelPath);
  const terrainHeight = useTerrainHeightSampler();
  const maxAnisotropy = useThree((state) =>
    state.gl.capabilities.getMaxAnisotropy(),
  );
  const groupRef = useRef<THREE.Group>(null);
  const meshDataList = useMemo(() => {
    const cached = meshDataCache.get(modelPath);
    if (cached) return cached;

    optimizeGLTFSceneTextures(scene, maxAnisotropy);
    const extracted = extractMeshes(scene);
    meshDataCache.set(modelPath, extracted);
    return extracted;
  }, [maxAnisotropy, modelPath, scene]);
  const groundedInstances = useMemo(
    () =>
      instances.map((instance) => {
        const [x, y, z] = instance.position;
        const height = terrainHeight.getHeight(x, z);

        return {
          ...instance,
          position: [x, height ?? y, z] as MapAssetInstance["position"],
          scale: normalizeMapScale(instance.scale),
        };
      }),
    [instances, terrainHeight],
  );

  useEffect(() => {
    const group = groupRef.current;
    if (!group || groundedInstances.length === 0) return;

    const geometryBottomY = getMeshBottomY(meshDataList);
    const instancedMeshes = meshDataList.map((meshData, index) => {
      const instancedMesh = new THREE.InstancedMesh(
        meshData.geometry,
        meshData.material,
        groundedInstances.length,
      );

      setInstanceMatrices(
        instancedMesh,
        groundedInstances,
        scaleMultiplier,
        geometryBottomY,
      );
      instancedMesh.castShadow = castShadow;
      instancedMesh.receiveShadow = receiveShadow;
      instancedMesh.name = `instanced-map-asset-${index}`;
      instancedMesh.frustumCulled = true;
      instancedMesh.computeBoundingSphere();

      return instancedMesh;
    });

    for (const mesh of instancedMeshes) {
      group.add(mesh);
    }

    return () => {
      for (const mesh of instancedMeshes) {
        group.remove(mesh);
        disposeInstancedMapMesh(mesh);
      }
    };
  }, [
    castShadow,
    groundedInstances,
    meshDataList,
    receiveShadow,
    scaleMultiplier,
  ]);

  if (instances.length === 0) {
    return null;
  }

  return <group ref={groupRef} />;
}
