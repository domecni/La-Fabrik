import type * as THREE from "three";
import type { Vector3Tuple } from "@/types/three/three";

declare global {
  interface Window {
    ebikeVisualGroup: React.RefObject<THREE.Group | null> | null;
    ebikeParkedPosition: Vector3Tuple | null;
    ebikeParkedRotation: number | null;
    ebikeSteerFactor: number | undefined;
    ebikeBreakdownActive: boolean | undefined;
    ebikeDriveInputActive: boolean | undefined;
    ebikeSpeedFactor: number | undefined;
  }
}
