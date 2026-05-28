import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { disposeObject3D } from "@/utils/three/dispose";

interface UseClonedObjectOptions {
  cloneResources?: boolean;
}

function cloneMaterial(
  material: THREE.Material | THREE.Material[],
): THREE.Material | THREE.Material[] {
  return Array.isArray(material)
    ? material.map((item) => item.clone())
    : material.clone();
}

function cloneObject<T extends THREE.Object3D>(
  object: T,
  cloneResources: boolean,
): T {
  const clone = object.clone(true) as T;

  if (!cloneResources) return clone;

  clone.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.geometry = child.geometry.clone();
    child.material = cloneMaterial(child.material);
  });

  return clone;
}

export function useClonedObject<T extends THREE.Object3D>(
  object: T,
  options: UseClonedObjectOptions = {},
): T {
  const cloneResources = options.cloneResources ?? false;
  const clone = useMemo(
    () => cloneObject(object, cloneResources),
    [cloneResources, object],
  );

  useEffect(() => {
    if (!cloneResources) return undefined;

    return () => {
      disposeObject3D(clone);
    };
  }, [clone, cloneResources]);

  return clone;
}
