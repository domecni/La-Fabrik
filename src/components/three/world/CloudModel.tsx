import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { CLOUD_CONFIG } from "@/data/world/cloudConfig";
import { optimizeGLTFSceneTextures } from "@/utils/three/optimizeGLTFScene";

interface CloudModelProps {
  castShadow?: boolean;
  receiveShadow?: boolean;
}

function applyCloudSettings(
  scene: THREE.Object3D,
  castShadow: boolean,
  receiveShadow: boolean,
): void {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = castShadow;
      child.receiveShadow = receiveShadow;

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      for (const material of materials) {
        material.fog = false;
      }
    }
  });
}

export function CloudModel({
  castShadow = false,
  receiveShadow = false,
}: CloudModelProps): React.JSX.Element {
  const { scene } = useGLTF(CLOUD_CONFIG.modelPath);
  const maxAnisotropy = useThree((state) =>
    state.gl.capabilities.getMaxAnisotropy(),
  );

  const cloud = useMemo(() => {
    optimizeGLTFSceneTextures(scene, maxAnisotropy);
    const model = scene.clone(true);
    applyCloudSettings(model, castShadow, receiveShadow);
    return model;
  }, [castShadow, maxAnisotropy, receiveShadow, scene]);

  return <primitive object={cloud} />;
}

useGLTF.preload(CLOUD_CONFIG.modelPath);
