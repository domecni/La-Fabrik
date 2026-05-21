import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { MapAssetInstance } from "@/world/map-instancing/useMapInstancingData";

interface InstancedMapAssetProps {
  modelPath: string;
  instances: MapAssetInstance[];
  castShadow: boolean;
  receiveShadow: boolean;
}

interface MeshData {
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
}

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
  mesh.geometry.dispose();
  disposeMaterialOnly(mesh.material);
  mesh.dispose();
}

function extractMeshes(scene: THREE.Group): MeshData[] {
  const meshes: MeshData[] = [];

  scene.updateMatrixWorld(true);
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const geometry = child.geometry.clone();
    geometry.applyMatrix4(child.matrixWorld);

    meshes.push({
      geometry,
      material: cloneMaterial(child.material),
    });
  });

  return meshes;
}

function setInstanceMatrices(
  instancedMesh: THREE.InstancedMesh,
  instances: MapAssetInstance[],
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
    scale.set(...instance.scale);
    matrix.compose(position, quaternion, scale);
    instancedMesh.setMatrixAt(i, matrix);
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
}

export function InstancedMapAsset({
  modelPath,
  instances,
  castShadow,
  receiveShadow,
}: InstancedMapAssetProps): React.JSX.Element | null {
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const group = groupRef.current;
    if (!group || instances.length === 0) return;

    const meshDataList = extractMeshes(scene);
    const instancedMeshes = meshDataList.map((meshData, index) => {
      const instancedMesh = new THREE.InstancedMesh(
        meshData.geometry,
        meshData.material,
        instances.length,
      );

      setInstanceMatrices(instancedMesh, instances);
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
  }, [castShadow, instances, receiveShadow, scene]);

  if (instances.length === 0) {
    return null;
  }

  return <group ref={groupRef} />;
}
