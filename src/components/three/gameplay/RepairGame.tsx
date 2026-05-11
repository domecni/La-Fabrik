import { Suspense, useEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { ExplodableModel } from "@/components/three/models/ExplodableModel";
import type { RepairCasePlaceholder } from "@/components/three/gameplay/RepairCaseModel";
import { RepairCompletionStep } from "@/components/three/gameplay/RepairCompletionStep";
import { RepairInspectionObject } from "@/components/three/gameplay/RepairInspectionObject";
import { RepairMissionCase } from "@/components/three/gameplay/RepairMissionCase";
import { RepairRepairingStep } from "@/components/three/gameplay/RepairRepairingStep";
import { RepairReassemblyStep } from "@/components/three/gameplay/RepairReassemblyStep";
import {
  RepairScanSequence,
  type RepairScannedBrokenPart,
} from "@/components/three/gameplay/RepairScanSequence";
import { REPAIR_CASE_MODEL_PATH } from "@/data/gameplay/repairCaseConfig";
import { REPAIR_FRAGMENTATION_SEQUENCE_SECONDS } from "@/data/gameplay/repairGameConfig";
import {
  REPAIR_MISSIONS,
  type RepairMissionConfig,
} from "@/data/gameplay/repairMissions";
import { useRepairFragmentationInput } from "@/hooks/gameplay/useRepairFragmentationInput";
import { useRepairMissionStep } from "@/hooks/gameplay/useRepairMissionStep";
import type {
  MissionStep,
  RepairMissionId,
} from "@/types/gameplay/repairMission";
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

interface RepairMissionAssetPreloaderProps {
  config: RepairMissionConfig;
}

function RepairMissionAssetPreloader({
  config,
}: RepairMissionAssetPreloaderProps): null {
  const modelPaths = useMemo(
    () => getRepairMissionModelPaths(config),
    [config],
  );

  useGLTF(modelPaths);

  return null;
}

export function RepairGame({
  mission,
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: RepairGameProps): React.JSX.Element | null {
  const config = REPAIR_MISSIONS[mission];
  const mainState = useGameStore((state) => state.mainState);
  const completeMission = useGameStore((state) => state.completeMission);
  const setMissionStep = useGameStore((state) => state.setMissionStep);
  const step = useRepairMissionStep(mission);
  const [casePlaceholders, setCasePlaceholders] = useState<
    readonly RepairCasePlaceholder[]
  >([]);
  const [scannedBrokenParts, setScannedBrokenParts] = useState<
    readonly RepairScannedBrokenPart[]
  >([]);
  const parsedScale = toVector3Scale(scale);
  const readyForFragmentation = step === "inspected";

  useRepairFragmentationInput({
    enabled: mainState === mission && readyForFragmentation,
    keyboardEnabled: false,
    onFragment: () => setMissionStep(mission, "fragmented"),
  });

  useEffect(() => {
    if (mainState === mission && shouldKeepRepairRuntimeState(step)) return;

    const timeoutId = window.setTimeout(() => {
      setCasePlaceholders([]);
      setScannedBrokenParts([]);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mainState, mission, step]);

  useEffect(() => {
    if (mainState !== mission) return undefined;

    if (step !== "fragmented") return undefined;

    const timeoutId = window.setTimeout(() => {
      setMissionStep(mission, "scanning");
    }, REPAIR_FRAGMENTATION_SEQUENCE_SECONDS * 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mainState, mission, setMissionStep, step]);

  if (mainState !== mission) return null;
  if (step === "locked") return null;

  return (
    <group position={position} rotation={rotation} scale={parsedScale}>
      <Suspense fallback={null}>
        <RepairMissionAssetPreloader config={config} />
      </Suspense>
      <Suspense fallback={null}>
        {step === "waiting" ? (
          <RepairInspectionObject
            config={config}
            worldPosition={position}
            onInspect={() => setMissionStep(mission, "inspected")}
          />
        ) : null}
        {step === "fragmented" ? (
          <ExplodableModel
            modelPath={config.modelPath}
            scale={config.modelScale ?? 1}
            split
          />
        ) : null}
        {step === "scanning" ? (
          <RepairScanSequence
            config={config}
            onComplete={(brokenParts) => {
              setScannedBrokenParts(brokenParts);
              setMissionStep(mission, "repairing");
            }}
          />
        ) : null}
        {step === "repairing" ? (
          <RepairRepairingStep
            brokenParts={scannedBrokenParts}
            config={config}
            placeholders={casePlaceholders}
            onRepair={() => setMissionStep(mission, "reassembling")}
          />
        ) : null}
        {step === "reassembling" ? (
          <RepairReassemblyStep
            config={config}
            onComplete={() => setMissionStep(mission, "done")}
          />
        ) : null}
        {step === "done" ? (
          <RepairCompletionStep
            config={config}
            onComplete={() => completeMission(mission)}
          />
        ) : null}
        {step !== "waiting" && step !== "done" && step !== "reassembling" ? (
          <RepairMissionCase
            config={config}
            onPlaceholdersChange={setCasePlaceholders}
            open={step === "repairing"}
            zoomed={step === "repairing"}
            showFragmentationPrompt={readyForFragmentation}
            onInteract={
              readyForFragmentation
                ? () => setMissionStep(mission, "fragmented")
                : undefined
            }
          />
        ) : null}
      </Suspense>
    </group>
  );
}

function shouldKeepRepairRuntimeState(step: MissionStep): boolean {
  return step === "repairing" || step === "reassembling" || step === "done";
}

function getRepairMissionModelPaths(config: RepairMissionConfig): string[] {
  return [
    ...new Set([
      REPAIR_CASE_MODEL_PATH,
      config.modelPath,
      ...config.brokenParts.flatMap((part) => part.modelPath ?? []),
      ...config.replacementParts.flatMap((part) => part.modelPath ?? []),
    ]),
  ];
}
