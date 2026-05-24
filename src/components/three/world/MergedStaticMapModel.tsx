import { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Vector3Tuple } from "@/types/three/three";
import { optimizeGLTFSceneTextures } from "@/utils/three/optimizeGLTFScene";

interface MergedStaticMapModelProps {
  modelPath: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  castShadow?: boolean;
  receiveShadow?: boolean;
  onLoaded?: () => void;
}

interface MergedMeshData {
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
}

interface GeometryGroup {
  geometries: THREE.BufferGeometry[];
  material: THREE.Material | THREE.Material[];
}

function cloneMaterial(
  material: THREE.Material | THREE.Material[],
): THREE.Material | THREE.Material[] {
  return Array.isArray(material)
    ? material.map((item) => item.clone())
    : material.clone();
}

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    for (const item of material) {
      item.dispose();
    }
    return;
  }

  material.dispose();
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

function createMergedMeshes(scene: THREE.Group): MergedMeshData[] {
  const groups = new Map<string, GeometryGroup>();

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
        return {
          geometry: group.geometries[0] as THREE.BufferGeometry,
          material: group.material,
        };
      }

      const geometry = mergeGeometries(group.geometries, false);

      for (const sourceGeometry of group.geometries) {
        sourceGeometry.dispose();
      }

      if (!geometry) {
        disposeMaterial(group.material);
        return null;
      }

      return {
        geometry,
        material: group.material,
      };
    })
    .filter((meshData): meshData is MergedMeshData => meshData !== null);
}

export function MergedStaticMapModel({
  modelPath,
  position,
  rotation,
  scale,
  castShadow = true,
  receiveShadow = true,
  onLoaded,
}: MergedStaticMapModelProps): React.JSX.Element {
  const { scene } = useGLTF(modelPath);
  const maxAnisotropy = useThree((state) =>
    state.gl.capabilities.getMaxAnisotropy(),
  );
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    optimizeGLTFSceneTextures(scene, maxAnisotropy);
    const mergedMeshes = createMergedMeshes(scene);
    const meshes = mergedMeshes.map((meshData) => {
      const mesh = new THREE.Mesh(meshData.geometry, meshData.material);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      return mesh;
    });

    for (const mesh of meshes) {
      group.add(mesh);
    }

    onLoaded?.();

    return () => {
      for (const mesh of meshes) {
        group.remove(mesh);
        mesh.geometry.dispose();
        disposeMaterial(mesh.material);
      }
    };
  }, [castShadow, maxAnisotropy, modelPath, onLoaded, receiveShadow, scene]);

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}
