import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { Vector3Tuple } from "@/types/three/three";
import { optimizeGLTFSceneTextures } from "@/utils/three/optimizeGLTFScene";

const TERRAIN_MODEL_PATH = "/models/terrain/model.gltf";
const TERRAIN_DEFAULT_POSITION: Vector3Tuple = [0, 0, 0];

interface TerrainModelProps {
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple;
  receiveShadow?: boolean;
  visible?: boolean;
  groupRef?: React.RefObject<THREE.Group>;
  onLoaded?: () => void;
}

function applyTerrainMaterialSettings(
  scene: THREE.Object3D,
  receiveShadow: boolean,
): void {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.receiveShadow = receiveShadow;
    }
  });
}

export function TerrainModel({
  position = TERRAIN_DEFAULT_POSITION,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  receiveShadow = true,
  visible = true,
  groupRef,
  onLoaded,
}: TerrainModelProps): React.JSX.Element {
  const internalRef = useRef<THREE.Group>(null);
  const ref = groupRef ?? internalRef;
  const { scene } = useGLTF(TERRAIN_MODEL_PATH);
  const maxAnisotropy = useThree((state) =>
    state.gl.capabilities.getMaxAnisotropy(),
  );

  const terrainModel = useMemo(() => {
    optimizeGLTFSceneTextures(scene, maxAnisotropy);
    const model = scene.clone(true);
    applyTerrainMaterialSettings(model, receiveShadow);
    return model;
  }, [maxAnisotropy, scene, receiveShadow]);

  useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);

  return (
    <group
      ref={ref}
      position={position}
      rotation={rotation}
      scale={scale}
      visible={visible}
    >
      <primitive object={terrainModel} />
    </group>
  );
}

useGLTF.preload(TERRAIN_MODEL_PATH);
