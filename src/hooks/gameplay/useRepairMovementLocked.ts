import { useGameStore } from "@/managers/stores/useGameStore";
import type { MissionStep } from "@/types/gameplay/repairMission";

export function useRepairMovementLocked(): boolean {
  return useGameStore((state) => {
    switch (state.mainState) {
      case "ebike":
        return isRepairMovementLocked(state.ebike.currentStep);
      case "pylon":
        return isRepairMovementLocked(state.pylon.currentStep);
      case "farm":
        return isRepairMovementLocked(state.farm.currentStep);
      case "intro":
      case "outro":
        return false;
    }
  });
}

function isRepairMovementLocked(step: MissionStep): boolean {
  return (
    step === "inspected" ||
    step === "fragmented" ||
    step === "scanning" ||
    step === "repairing" ||
    step === "reassembling" ||
    step === "done"
  );
}
