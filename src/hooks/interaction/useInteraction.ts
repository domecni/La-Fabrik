import { useSyncExternalStore } from "react";
import { InteractionManager } from "@/managers/InteractionManager";
import type { InteractionSnapshot } from "@/types/interaction/interaction";

const manager = InteractionManager.getInstance();

export function useInteraction(): InteractionSnapshot {
  return useSyncExternalStore(
    manager.subscribe.bind(manager),
    manager.getState.bind(manager),
  );
}
