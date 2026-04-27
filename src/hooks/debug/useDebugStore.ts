import { useSyncExternalStore } from "react";
import { Debug } from "@/utils/debug/Debug";

export function useDebugStore<T>(selector: (debug: Debug) => T): T {
  const debug = Debug.getInstance();

  return useSyncExternalStore(
    (listener) => debug.subscribe(listener),
    () => selector(debug),
    () => selector(debug),
  );
}
