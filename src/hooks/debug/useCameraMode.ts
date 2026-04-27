import type { CameraMode } from "@/types/debug";
import { useDebugStore } from "@/hooks/debug/useDebugStore";

export function useCameraMode(): CameraMode {
  return useDebugStore((debug) => debug.getCameraMode());
}
