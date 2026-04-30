import type { SceneMode } from "@/types/debug/debug";
import { useDebugStore } from "@/hooks/debug/useDebugStore";

export function useSceneMode(): SceneMode {
  return useDebugStore((debug) => debug.getSceneMode());
}
