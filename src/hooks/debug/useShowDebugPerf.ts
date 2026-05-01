import { useDebugStore } from "@/hooks/debug/useDebugStore";

export function useShowDebugPerf(): boolean {
  return useDebugStore((debug) => debug.getShowPerf());
}
