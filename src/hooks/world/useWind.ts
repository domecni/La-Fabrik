import { useWorldSettingsStore } from "@/managers/stores/useWorldSettingsStore";
import type { WindState } from "@/data/world/windConfig";

export function useWind(): WindState {
  return useWorldSettingsStore((state) => state.wind);
}

export function useSetWind(): (wind: Partial<WindState>) => void {
  return useWorldSettingsStore((state) => state.setWind);
}

export function useWindSpeed(): number {
  return useWorldSettingsStore((state) => state.wind.speed);
}

export function useWindDirection(): number {
  return useWorldSettingsStore((state) => state.wind.direction);
}

export function useWindStrength(): number {
  return useWorldSettingsStore((state) => state.wind.strength);
}
