import { useEffect } from "react";
import * as THREE from "three";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import type { ModelTransformProps, Vector3Tuple } from "@/types/three/three";

function applyShadowSettings(
  object: THREE.Object3D,
  castShadow: boolean,
  receiveShadow: boolean,
): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.castShadow = castShadow;
    child.receiveShadow = receiveShadow;
  });
}

function applyOpacity(object: THREE.Object3D, opacity: number): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    materials.forEach((material) => {
      if (!(material instanceof THREE.Material)) return;
      material.transparent = opacity < 1;
      material.opacity = opacity;
      material.depthWrite = opacity >= 1;
      material.needsUpdate = true;
    });
  });
}

interface SimpleModelConfig extends ModelTransformProps {
  modelPath: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  opacity?: number;
}

interface SimpleModelProps extends SimpleModelConfig {
  children?: React.ReactNode;
}

export function SimpleModel({
  modelPath,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  castShadow = true,
  receiveShadow = true,
  opacity = 1,
  children,
}: SimpleModelProps): React.JSX.Element {
  const { scene } = useLoggedGLTF(modelPath, {
    scope: "SimpleModel",
    position,
    rotation,
    scale,
  });
  const model = useClonedObject(scene, { cloneResources: true });

  useEffect(() => {
    applyShadowSettings(model, castShadow, receiveShadow);
  }, [castShadow, model, receiveShadow]);

  useEffect(() => {
    applyOpacity(model, opacity);
  }, [model, opacity]);

  const parsedScale =
    typeof scale === "number" ? ([scale, scale, scale] as Vector3Tuple) : scale;

  return (
    <group position={position} rotation={rotation} scale={parsedScale}>
      {children ?? <primitive object={model} />}
    </group>
  );
}
