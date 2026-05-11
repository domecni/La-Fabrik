import { useGameStore } from "@/managers/stores/useGameStore";
import type {
  MissionStep,
  RepairMissionId,
} from "@/types/gameplay/repairMission";

export function useRepairMissionStep(mission: RepairMissionId): MissionStep {
  return useGameStore((state) => state[mission].currentStep);
}
