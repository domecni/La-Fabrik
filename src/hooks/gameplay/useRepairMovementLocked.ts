import { useGameStore } from "@/managers/stores/useGameStore";
import type { MissionStep } from "@/types/gameplay/repairMission";

export function useRepairMovementLocked(): boolean {
  return useGameStore((state) => {
    switch (state.mainState) {
      case "bike":
        return isRepairMovementLocked(state.bike.currentStep);
      case "pylone":
        return isRepairMovementLocked(state.pylone.currentStep);
      case "ferme":
        return isRepairMovementLocked(state.ferme.currentStep);
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
    step === "reassembling"
  );
}
