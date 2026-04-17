import { useSyncExternalStore } from "react";
import type { SceneMode } from "@/types/debug";
import { Debug } from "@/utils/debug/Debug";

export function useSceneMode(): SceneMode {
  const debug = Debug.getInstance();

  return useSyncExternalStore(
    (listener) => debug.subscribe(listener),
    () => debug.getSceneMode(),
    () => debug.getSceneMode(),
  );
}
