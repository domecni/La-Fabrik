import { useWorldSettingsStore } from "@/managers/stores/useWorldSettingsStore";
import type { WindState } from "@/data/world/windConfig";

export function useWind(): WindState {
  return useWorldSettingsStore((state) => state.wind);
}
