import { useDebugStore } from "@/hooks/debug/useDebugStore";

export function useShowDebugOverlay(): boolean {
  return useDebugStore((debug) => debug.getShowDebugOverlay());
}
