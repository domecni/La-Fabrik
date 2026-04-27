import { useSyncExternalStore } from "react";
import { InteractionManager } from "@/stateManager/InteractionManager";
import type { InteractionSnapshot } from "@/types/interaction";

const manager = InteractionManager.getInstance();

export function useInteraction(): InteractionSnapshot {
  return useSyncExternalStore(
    manager.subscribe.bind(manager),
    manager.getState.bind(manager),
  );
}
