import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { disposeObject3D } from "@/utils/three/dispose";

function cloneObjectWithOwnedResources<T extends THREE.Object3D>(object: T): T {
  const clone = object.clone(true) as T;

  clone.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.geometry = child.geometry.clone();
    child.material = Array.isArray(child.material)
      ? child.material.map((material) => material.clone())
      : child.material.clone();
  });

  return clone;
}

export function useClonedObject<T extends THREE.Object3D>(object: T): T {
  const clone = useMemo(() => cloneObjectWithOwnedResources(object), [object]);

  useEffect(() => {
    return () => {
      disposeObject3D(clone);
    };
  }, [clone]);

  return clone;
}
