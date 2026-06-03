import { Suspense, useEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { ExplodableModel } from "@/components/three/models/ExplodableModel";
import type { ExplodedNodeAnchors } from "@/components/three/models/ExplodableModel";
import type {
  RepairCasePartAnchors,
  RepairCasePlaceholder,
} from "@/components/three/gameplay/RepairCaseModel";
import { RepairCompletionStep } from "@/components/three/gameplay/RepairCompletionStep";
import { RepairInspectionObject } from "@/components/three/gameplay/RepairInspectionObject";
import { RepairMissionCase } from "@/components/three/gameplay/RepairMissionCase";
import { RepairRepairingStep } from "@/components/three/gameplay/RepairRepairingStep";
import { RepairReassemblyStep } from "@/components/three/gameplay/RepairReassemblyStep";
import { RepairScanSequence } from "@/components/three/gameplay/RepairScanSequence";
import { REPAIR_CASE_MODEL_PATH } from "@/data/gameplay/repairCaseConfig";
import { REPAIR_FRAGMENTATION_SEQUENCE_SECONDS } from "@/data/gameplay/repairGameConfig";
import { REPAIR_MISSIONS } from "@/data/gameplay/repairMissions";
import { useRepairFragmentationInput } from "@/hooks/gameplay/useRepairFragmentationInput";
import { useRepairMissionStep } from "@/hooks/gameplay/useRepairMissionStep";
import { useTerrainSnappedPosition } from "@/hooks/three/useTerrainHeight";
import type {
  MissionStep,
  RepairMissionConfig,
  RepairMissionId,
  RepairScannedBrokenPart,
} from "@/types/gameplay/repairMission";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useRepairFocusStore } from "@/managers/stores/useRepairFocusStore";
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
  const [caseAnchors, setCaseAnchors] = useState<RepairCasePartAnchors>({});
  const [brokenAnchors, setBrokenAnchors] = useState<ExplodedNodeAnchors>({});
  const [scannedBrokenParts, setScannedBrokenParts] = useState<
    readonly RepairScannedBrokenPart[]
  >([]);
  // For the ebike mission, use the bike's live parked world position once
  // the repair flow leaves the waiting phase so the repair happens
  // wherever the player parked the bike, not at the static zone anchor.
  // window.ebikeParkedPosition is set by Ebike when the player drops the
  // bike and stays stable through the rest of the repair flow.
  const livePosition = useMemo<Vector3Tuple>(() => {
    if (mission !== "ebike" || mainState !== mission) return position;
    if (step === "waiting") return position;
    const parked = window.ebikeParkedPosition;
    if (!parked) return position;
    return [parked[0], parked[1], parked[2]];
  }, [mainState, mission, position, step]);
  const parsedScale = toVector3Scale(scale);
  const snappedPosition = useTerrainSnappedPosition(livePosition);
  const readyForFragmentation = step === "inspected";
  const brokenNodeNames = useMemo(() => getBrokenNodeNames(config), [config]);

  useRepairFragmentationInput({
    enabled: mainState === mission && readyForFragmentation,
    keyboardEnabled: false,
    onFragment: () => setMissionStep(mission, "fragmented"),
  });

  useEffect(() => {
    if (mainState === mission && shouldKeepRepairRuntimeState(step)) return;

    const timeoutId = window.setTimeout(() => {
      setCasePlaceholders([]);
      setCaseAnchors({});
      setBrokenAnchors({});
      setScannedBrokenParts([]);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mainState, mission, step]);

  // Drive the global focus bubble: active during the immersive repair
  // phases so the world dims/hides outside the dark sphere shroud.
  const focusCenterX = snappedPosition[0];
  const focusCenterY = snappedPosition[1];
  const focusCenterZ = snappedPosition[2];
  useEffect(() => {
    const inFocusPhase =
      mainState === mission && shouldFocusBubbleBeActive(step);
    if (inFocusPhase) {
      useRepairFocusStore
        .getState()
        .setFocus(true, [focusCenterX, focusCenterY, focusCenterZ]);
      return () => {
        useRepairFocusStore.getState().setFocus(false);
      };
    }
    return undefined;
  }, [mainState, mission, step, focusCenterX, focusCenterY, focusCenterZ]);

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
    <group position={snappedPosition} rotation={rotation} scale={parsedScale}>
      <Suspense fallback={null}>
        <RepairMissionAssetPreloader config={config} />
      </Suspense>
      <Suspense fallback={null}>
        {step === "waiting" && mission !== "ebike" ? (
          <RepairInspectionObject
            config={config}
            worldPosition={snappedPosition}
            onInspect={() => setMissionStep(mission, "inspected")}
          />
        ) : null}
        {step === "fragmented" ? (
          <ExplodableModel
            modelPath={config.modelPath}
            rotation={config.modelRotation ?? [0, 0, 0]}
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
          <>
            <ExplodableModel
              modelPath={config.modelPath}
              rotation={config.modelRotation ?? [0, 0, 0]}
              scale={config.modelScale ?? 1}
              split
              hideNodeNames={brokenNodeNames}
              nodeAnchorNames={brokenNodeNames}
              onNodeAnchorsChange={setBrokenAnchors}
            />
            <RepairRepairingStep
              anchors={caseAnchors}
              brokenAnchors={brokenAnchors}
              brokenParts={scannedBrokenParts}
              config={config}
              placeholders={casePlaceholders}
              onRepair={() => setMissionStep(mission, "reassembling")}
            />
          </>
        ) : null}
        {step === "reassembling" ? (
          <RepairReassemblyStep
            config={config}
            onComplete={() => setMissionStep(mission, "done")}
          />
        ) : null}
        {step === "done" && mission !== "pylon" ? (
          <RepairCompletionStep
            config={config}
            onComplete={() => completeMission(mission)}
          />
        ) : null}
        {step !== "waiting" && step !== "done" && step !== "reassembling" ? (
          <RepairMissionCase
            config={config}
            onPlaceholdersChange={setCasePlaceholders}
            onAnchorsChange={setCaseAnchors}
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

function shouldFocusBubbleBeActive(step: MissionStep): boolean {
  return (
    step === "fragmented" ||
    step === "scanning" ||
    step === "repairing" ||
    step === "reassembling"
  );
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

function getBrokenNodeNames(config: RepairMissionConfig): readonly string[] {
  const names = new Set<string>();
  config.brokenParts.forEach((part) => {
    if (part.targetNodeName) names.add(part.targetNodeName);
    else if (part.nodeName) names.add(part.nodeName);
  });
  config.replacementParts.forEach((part) => {
    if (part.targetNodeName) names.add(part.targetNodeName);
  });
  return Array.from(names);
}
