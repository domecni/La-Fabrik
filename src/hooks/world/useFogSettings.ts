import { useWorldSettingsStore } from "@/managers/stores/useWorldSettingsStore";
import type { FogState } from "@/data/world/fogConfig";

export function useFogSettings(): FogState {
  return useWorldSettingsStore((state) => state.fog);
}
