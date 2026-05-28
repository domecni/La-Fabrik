import { useMemo } from "react";
import * as THREE from "three";

export function useClonedObject<T extends THREE.Object3D>(object: T): T {
  return useMemo(() => object.clone(true) as T, [object]);
}
