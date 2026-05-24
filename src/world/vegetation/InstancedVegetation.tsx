import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { useTerrainHeightSampler } from "@/hooks/three/useTerrainHeight";
import { optimizeGLTFSceneTextures } from "@/utils/three/optimizeGLTFScene";
import type { VegetationInstance } from "@/world/vegetation/useVegetationData";

interface InstancedVegetationProps {
  modelPath: string;
  instances: VegetationInstance[];
  scaleMultiplier: number;
  castShadow: boolean;
  receiveShadow: boolean;
}

interface MeshData {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

function extractMeshes(scene: THREE.Group): MeshData[] {
  const meshesByMaterial = new Map<
    string,
    { geometries: THREE.BufferGeometry[]; material: THREE.Material }
  >();
  scene.updateMatrixWorld(true);

  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const material = Array.isArray(child.material)
      ? child.material[0]
      : child.material;
    if (!material) return;

    const geometry = child.geometry.clone();
    geometry.applyMatrix4(child.matrixWorld);

    const existing = meshesByMaterial.get(material.uuid);
    if (existing) {
      existing.geometries.push(geometry);
    } else {
      meshesByMaterial.set(material.uuid, {
        geometries: [geometry],
        material: material.clone(),
      });
    }
  });

  return [...meshesByMaterial.values()]
    .map(({ geometries, material }) => {
      const mergedGeometry = mergeGeometries(geometries, false);

      for (const geometry of geometries) {
        if (geometry !== mergedGeometry) {
          geometry.dispose();
        }
      }

      if (!mergedGeometry) {
        material.dispose();
        return null;
      }

      return {
        geometry: mergedGeometry,
        material,
      };
    })
    .filter((meshData): meshData is MeshData => meshData !== null);
}

function createInstanceMatrices(
  instances: VegetationInstance[],
  scaleMultiplier: number,
): THREE.Matrix4[] {
  const matrices: THREE.Matrix4[] = [];
  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(
    scaleMultiplier,
    scaleMultiplier,
    scaleMultiplier,
  );

  for (const instance of instances) {
    const matrix = new THREE.Matrix4();

    position.set(...instance.position);
    rotation.set(...instance.rotation);
    quaternion.setFromEuler(rotation);
    matrix.compose(position, quaternion, scale);
    matrices.push(matrix);
  }

  return matrices;
}

export function InstancedVegetation({
  modelPath,
  instances,
  scaleMultiplier,
  castShadow,
  receiveShadow,
}: InstancedVegetationProps): React.JSX.Element | null {
  const { scene } = useGLTF(modelPath);
  const terrainHeight = useTerrainHeightSampler();
  const maxAnisotropy = useThree((state) =>
    state.gl.capabilities.getMaxAnisotropy(),
  );
  const groupRef = useRef<THREE.Group>(null);

  const meshDataList = useMemo(() => {
    optimizeGLTFSceneTextures(scene, maxAnisotropy);
    return extractMeshes(scene);
  }, [maxAnisotropy, scene]);
  const groundedInstances = useMemo(
    () =>
      instances.map((instance) => {
        const [x, y, z] = instance.position;
        const height = terrainHeight.getHeight(x, z);
        return {
          ...instance,
          position: [x, height ?? y, z] as VegetationInstance["position"],
        };
      }),
    [instances, terrainHeight],
  );
  const matrices = useMemo(
    () => createInstanceMatrices(groundedInstances, scaleMultiplier),
    [groundedInstances, scaleMultiplier],
  );

  const instancedMeshes = useMemo(() => {
    return meshDataList.map((meshData, index) => {
      const instancedMesh = new THREE.InstancedMesh(
        meshData.geometry,
        meshData.material,
        groundedInstances.length,
      );

      for (let i = 0; i < matrices.length; i++) {
        const matrix = matrices[i];
        if (matrix) {
          instancedMesh.setMatrixAt(i, matrix);
        }
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.castShadow = castShadow;
      instancedMesh.receiveShadow = receiveShadow;
      instancedMesh.name = `instanced-mesh-${index}`;
      instancedMesh.frustumCulled = true;
      instancedMesh.computeBoundingSphere();

      return instancedMesh;
    });
  }, [
    meshDataList,
    matrices,
    groundedInstances.length,
    castShadow,
    receiveShadow,
  ]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    for (const mesh of instancedMeshes) {
      group.add(mesh);
    }

    return () => {
      for (const mesh of instancedMeshes) {
        group.remove(mesh);
        mesh.dispose();
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

  if (groundedInstances.length === 0) {
    return null;
  }

  return <group ref={groupRef} />;
}
