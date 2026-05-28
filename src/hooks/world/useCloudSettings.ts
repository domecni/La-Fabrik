import { useWorldSettingsStore } from "@/managers/stores/useWorldSettingsStore";
import type { CloudState } from "@/data/world/cloudConfig";

export function useCloudSettings(): CloudState {
  return useWorldSettingsStore((state) => state.clouds);
}
