import { useEffect, useRef } from "react";
import type GUI from "lil-gui";
import { Debug } from "@/utils/debug/Debug";

export function useDebugFolder(
  name: string,
  setup: (folder: GUI) => void,
): void {
  const setupRef = useRef(setup);

  useEffect(() => {
    setupRef.current = setup;
  }, [setup]);

  useEffect(() => {
    const debug = Debug.getInstance();
    if (!debug.active) return;

    const folder = debug.createFolder(name);
    if (folder) {
      setupRef.current(folder);
    }

    return () => {
      debug.destroyFolder(name);
    };
  }, [name]);
}
