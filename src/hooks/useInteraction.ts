import { useSyncExternalStore } from "react";
import {
  InteractionManager,
  type InteractionSnapshot,
} from "@/stateManager/InteractionManager";

const manager = InteractionManager.getInstance();

export function useInteraction(): InteractionSnapshot {
  return useSyncExternalStore(
    manager.subscribe.bind(manager),
    manager.getState.bind(manager),
  );
}

export function useInteractionSelector<T>(
  selector: (state: InteractionSnapshot) => T,
): T {
  return useSyncExternalStore(manager.subscribe.bind(manager), () =>
    selector(manager.getState()),
  );
}
