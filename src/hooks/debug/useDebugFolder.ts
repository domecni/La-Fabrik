import { useEffect } from "react";
import type GUI from "lil-gui";
import { Debug } from "@/utils/debug/Debug";

export function useDebugFolder(
  name: string,
  setup: (folder: GUI) => void,
): void {
  useEffect(() => {
    const debug = Debug.getInstance();
    if (!debug.active) return;
    const folder = debug.createFolder(name);
    if (!folder) return;
    setup(folder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
