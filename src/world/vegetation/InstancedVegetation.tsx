import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { VegetationInstance } from "@/world/vegetation/useVegetationData";
import { disposeInstancedMesh } from "@/utils/three/dispose";

interface InstancedVegetationProps {
  modelPath: string;
  instances: VegetationInstance[];
  castShadow: boolean;
  receiveShadow: boolean;
}

interface MeshData {
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
}

function extractMeshes(scene: THREE.Group): MeshData[] {
  const meshes: MeshData[] = [];

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshes.push({
        geometry: child.geometry.clone(),
        material: Array.isArray(child.material)
          ? child.material.map((m) => m.clone())
          : child.material.clone(),
      });
    }
  });

  return meshes;
}

function createInstanceMatrices(
  instances: VegetationInstance[],
): THREE.Matrix4[] {
  const matrices: THREE.Matrix4[] = [];
  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  for (const instance of instances) {
    const matrix = new THREE.Matrix4();

    position.set(...instance.position);
    rotation.set(...instance.rotation);
    quaternion.setFromEuler(rotation);
    scale.set(...instance.scale);

    matrix.compose(position, quaternion, scale);
    matrices.push(matrix);
  }

  return matrices;
}

export function InstancedVegetation({
  modelPath,
  instances,
  castShadow,
  receiveShadow,
}: InstancedVegetationProps): React.JSX.Element | null {
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef<THREE.Group>(null);

  const meshDataList = useMemo(() => extractMeshes(scene), [scene]);
  const matrices = useMemo(
    () => createInstanceMatrices(instances),
    [instances],
  );

  const instancedMeshes = useMemo(() => {
    return meshDataList.map((meshData, index) => {
      const instancedMesh = new THREE.InstancedMesh(
        meshData.geometry,
        meshData.material,
        instances.length,
      );

      for (let i = 0; i < matrices.length; i++) {
        instancedMesh.setMatrixAt(i, matrices[i]);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.castShadow = castShadow;
      instancedMesh.receiveShadow = receiveShadow;
      instancedMesh.name = `instanced-mesh-${index}`;
      instancedMesh.frustumCulled = true;
      instancedMesh.computeBoundingSphere();

      return instancedMesh;
    });
  }, [meshDataList, matrices, instances.length, castShadow, receiveShadow]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    for (const mesh of instancedMeshes) {
      group.add(mesh);
    }

    return () => {
      for (const mesh of instancedMeshes) {
        group.remove(mesh);
        disposeInstancedMesh(mesh);
      }
    };
  }, [instancedMeshes]);

  useEffect(() => {
    return () => {
      for (const meshData of meshDataList) {
        meshData.geometry.dispose();
        if (Array.isArray(meshData.material)) {
          for (const mat of meshData.material) {
            mat.dispose();
          }
        } else {
          meshData.material.dispose();
        }
      }
    };
  }, [meshDataList]);

  if (instances.length === 0) {
    return null;
  }

  return <group ref={groupRef} />;
}
