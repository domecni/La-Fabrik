import { useEffect, useState } from "react";
import {
  InteractionManager,
  type InteractionSnapshot,
} from "@/stateManager/InteractionManager";

export function useInteraction(): InteractionSnapshot {
  const manager = InteractionManager.getInstance();
  const [state, setState] = useState<InteractionSnapshot>(manager.getState());

  useEffect(() => {
    return manager.subscribe(() => {
      setState({ ...manager.getState() });
    });
  }, [manager]);

  return state;
}
