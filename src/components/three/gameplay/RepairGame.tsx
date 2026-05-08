import { useEffect } from "react";
import { ExplodableModel } from "@/components/three/models/ExplodableModel";
import { RepairInspectionObject } from "@/components/three/gameplay/RepairInspectionObject";
import { RepairMissionCase } from "@/components/three/gameplay/RepairMissionCase";
import { RepairScanVisual } from "@/components/three/gameplay/RepairScanVisual";
import {
  REPAIR_FRAGMENTATION_SEQUENCE_SECONDS,
  REPAIR_SCAN_SEQUENCE_SECONDS,
} from "@/data/gameplay/repairGameConfig";
import { REPAIR_MISSIONS } from "@/data/gameplay/repairMissions";
import { useRepairFragmentationInput } from "@/hooks/gameplay/useRepairFragmentationInput";
import { useRepairMissionStep } from "@/hooks/gameplay/useRepairMissionStep";
import type { RepairMissionId } from "@/managers/stores/useGameStore";
import { useGameStore } from "@/managers/stores/useGameStore";
import type { ModelTransformProps, Vector3Tuple } from "@/types/three/three";
import { toVector3Scale } from "@/utils/three/scale";

interface RepairGameProps extends Required<
  Pick<ModelTransformProps, "position">
> {
  mission: RepairMissionId;
  rotation?: Vector3Tuple;
  scale?: ModelTransformProps["scale"];
}

export function RepairGame({
  mission,
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: RepairGameProps): React.JSX.Element | null {
  const config = REPAIR_MISSIONS[mission];
  const mainState = useGameStore((state) => state.mainState);
  const setMissionStep = useGameStore((state) => state.setMissionStep);
  const step = useRepairMissionStep(mission);
  const parsedScale = toVector3Scale(scale);
  const readyForFragmentation = step === "inspected";

  useRepairFragmentationInput({
    enabled: mainState === mission && readyForFragmentation,
    onFragment: () => setMissionStep(mission, "fragmented"),
  });

  useEffect(() => {
    if (mainState !== mission) return undefined;

    if (step !== "fragmented" && step !== "scanning") return undefined;

    const nextStep = step === "fragmented" ? "scanning" : "repairing";
    const sequenceSeconds =
      step === "fragmented"
        ? REPAIR_FRAGMENTATION_SEQUENCE_SECONDS
        : REPAIR_SCAN_SEQUENCE_SECONDS;

    const timeoutId = window.setTimeout(() => {
      setMissionStep(mission, nextStep);
    }, sequenceSeconds * 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mainState, mission, setMissionStep, step]);

  if (mainState !== mission) return null;
  if (step === "locked") return null;

  return (
    <group position={position} rotation={rotation} scale={parsedScale}>
      {step === "waiting" ? (
        <RepairInspectionObject
          config={config}
          worldPosition={position}
          onInspect={() => setMissionStep(mission, "inspected")}
        />
      ) : null}
      {step === "fragmented" ? (
        <ExplodableModel modelPath={config.modelPath} split />
      ) : null}
      {step === "scanning" ? <RepairScanVisual config={config} /> : null}
      {step !== "waiting" ? (
        <RepairMissionCase
          config={config}
          showFragmentationPrompt={readyForFragmentation}
        />
      ) : null}
    </group>
  );
}
