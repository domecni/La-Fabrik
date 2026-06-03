import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { ExplodableModel } from "@/components/three/models/ExplodableModel";
import type { ExplodedNodeAnchors } from "@/components/three/models/ExplodableModel";
import type {
  RepairCasePartAnchors,
  RepairCasePlaceholder,
} from "@/components/three/gameplay/RepairCaseModel";
import { RepairCompletionStep } from "@/components/three/gameplay/RepairCompletionStep";
import { RepairEbikeRepairTrigger } from "@/components/three/gameplay/RepairEbikeRepairTrigger";
import { RepairInspectionObject } from "@/components/three/gameplay/RepairInspectionObject";
import { RepairMissionCase } from "@/components/three/gameplay/RepairMissionCase";
import { BUBBLE_GROW_DURATION_SECONDS } from "@/components/three/gameplay/RepairFocusBubble";
import { RepairRepairingStep } from "@/components/three/gameplay/RepairRepairingStep";
import { RepairReassemblyStep } from "@/components/three/gameplay/RepairReassemblyStep";
import { RepairScanSequence } from "@/components/three/gameplay/RepairScanSequence";
import { REPAIR_CASE_MODEL_PATH } from "@/data/gameplay/repairCaseConfig";
import {
  REPAIR_DONE_DIALOGUE_FALLBACK_MS,
  REPAIR_FRAGMENTATION_SEQUENCE_SECONDS,
  REPAIR_FRAGMENT_SPLIT_SPEED,
  REPAIR_REASSEMBLY_HOLD_MS,
} from "@/data/gameplay/repairGameConfig";
import { REPAIR_MISSIONS } from "@/data/gameplay/repairMissions";
import { EBIKE_REPAIRED_DIALOGUE_ID } from "@/data/ebike/ebikeConfig";
import { useRepairFragmentationInput } from "@/hooks/gameplay/useRepairFragmentationInput";
import { useRepairMissionStep } from "@/hooks/gameplay/useRepairMissionStep";
import { useTerrainSnappedPosition } from "@/hooks/three/useTerrainHeight";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";
import { useSubtitleStore } from "@/managers/stores/useSubtitleStore";
import type {
  MissionStep,
  RepairMissionConfig,
  RepairMissionId,
  RepairScannedBrokenPart,
} from "@/types/gameplay/repairMission";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useRepairFocusStore } from "@/managers/stores/useRepairFocusStore";
import type { ModelTransformProps, Vector3Tuple } from "@/types/three/three";
import type { ExplodedPart } from "@/utils/three/ExplodedModel";
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

const REPAIR_PHASES: readonly MissionStep[] = [
  "fragmented",
  "scanning",
  "repairing",
  "reassembling",
  "done",
];

const SPLIT_PHASES: readonly MissionStep[] = [
  "fragmented",
  "scanning",
  "repairing",
];

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
  const [explodedParts, setExplodedParts] = useState<readonly ExplodedPart[]>(
    [],
  );
  const reassemblyDoneTimeoutRef = useRef<number | null>(null);
  // Ebike-specific: once the repair starts, keep the entire repair flow
  // exactly where the bike currently is. `Ebike` owns the live parked
  // position while inspected is showing; RepairGame takes over the model
  // from fragmented onward and must reuse that same world transform.
  const livePosition = useMemo<Vector3Tuple>(() => {
    if (mission !== "ebike" || step === "waiting") return position;

    const parked = window.ebikeParkedPosition;
    if (!parked) return position;

    return [parked[0], parked[1], parked[2]];
  }, [mission, position, step]);
  const usesLiveEbikePosition = mission === "ebike" && step !== "waiting";
  const parsedScale = toVector3Scale(scale);
  const terrainSnappedPosition = useTerrainSnappedPosition(livePosition);
  const snappedPosition = usesLiveEbikePosition
    ? livePosition
    : terrainSnappedPosition;
  const readyForFragmentation = step === "inspected";
  const brokenNodeNames = useMemo(() => getBrokenNodeNames(config), [config]);
  const isRepairPhase = (REPAIR_PHASES as readonly MissionStep[]).includes(
    step,
  );
  const isSplitPhase = (SPLIT_PHASES as readonly MissionStep[]).includes(step);
  const isRepairing = step === "repairing";

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
      mainState === mission && shouldFocusBubbleBeActive(step, mission);
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

  // Ebike-only: auto-advance inspected -> fragmented once the focus
  // bubble's grow tween has finished isolating the bike inside the dark
  // cocoon. The 2.5s delay matches BUBBLE_GROW_DURATION_SECONDS so the
  // fragmentation visual coincides with the fully-formed shroud.
  useEffect(() => {
    if (mainState !== mission) return undefined;
    if (mission !== "ebike") return undefined;
    if (step !== "inspected") return undefined;

    const timeoutId = window.setTimeout(() => {
      setMissionStep(mission, "fragmented");
    }, BUBBLE_GROW_DURATION_SECONDS * 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mainState, mission, setMissionStep, step]);

  // fragmented -> scanning is now driven by `onSplitSettled` from the
  // shared ExplodableModel below (fires once the lerp actually
  // converges on progress=1). The legacy
  // REPAIR_FRAGMENTATION_SEQUENCE_SECONDS timer is kept as a safety-net
  // fallback in case the model fails to load (no settled event) so the
  // flow can never get stuck on the fragmented step.
  useEffect(() => {
    if (mainState !== mission) return undefined;
    if (step !== "fragmented") return undefined;

    const timeoutId = window.setTimeout(
      () => {
        setMissionStep(mission, "scanning");
      },
      (REPAIR_FRAGMENTATION_SEQUENCE_SECONDS + 2) * 1000,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mainState, mission, setMissionStep, step]);

  useEffect(() => {
    if (mainState !== mission) return undefined;
    if (step !== "reassembling") return undefined;

    const timeoutId = window.setTimeout(() => {
      setMissionStep(mission, "done");
    }, REPAIR_REASSEMBLY_HOLD_MS + 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mainState, mission, setMissionStep, step]);

  // Ebike-only: at `done`, play the success narrator line and complete
  // the mission when the audio ends (handing off to pylon). A fallback
  // timer guarantees the transition even if the audio fails.
  useEffect(() => {
    if (mainState !== mission) return undefined;
    if (mission !== "ebike") return undefined;
    if (step !== "done") return undefined;

    let cancelled = false;
    let activeAudio: HTMLAudioElement | null = null;
    let fallbackTimeoutId: number | null = null;

    const finish = (): void => {
      if (cancelled) return;
      cancelled = true;
      completeMission(mission);
    };

    void (async () => {
      const manifest = await loadDialogueManifest();
      if (cancelled) return;
      const audio = manifest
        ? await playDialogueById(manifest, EBIKE_REPAIRED_DIALOGUE_ID)
        : null;
      if (cancelled) {
        if (audio && !audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
        useSubtitleStore.getState().clearActiveSubtitle();
        return;
      }
      activeAudio = audio;
      if (audio) {
        audio.addEventListener("ended", finish, { once: true });
        fallbackTimeoutId = window.setTimeout(
          finish,
          REPAIR_DONE_DIALOGUE_FALLBACK_MS,
        );
      } else {
        fallbackTimeoutId = window.setTimeout(
          finish,
          REPAIR_DONE_DIALOGUE_FALLBACK_MS,
        );
      }
    })();

    return () => {
      cancelled = true;
      if (activeAudio) {
        activeAudio.removeEventListener("ended", finish);
        if (!activeAudio.paused) {
          activeAudio.pause();
          activeAudio.currentTime = 0;
        }
      }
      if (fallbackTimeoutId !== null) {
        window.clearTimeout(fallbackTimeoutId);
      }
      useSubtitleStore.getState().clearActiveSubtitle();
    };
  }, [completeMission, mainState, mission, step]);

  // The shared ExplodableModel resets its parts to a fresh array each
  // time it remounts (i.e. when leaving the repair flow back to
  // waiting/inspected). The cached `explodedParts` will be overwritten
  // by `onPartsReady` on the next mount; we don't need an explicit
  // reset because no rendered code path uses the stale parts outside
  // the repair phases.

  // Settled callback: drives event-based transitions out of the
  // explode/reassemble lerp.
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  const handleSplitSettled = useMemo(
    () => (settledAt: 0 | 1) => {
      const currentStep = stepRef.current;
      if (settledAt === 1 && currentStep === "fragmented") {
        setMissionStep(mission, "scanning");
      }
      if (settledAt === 0 && currentStep === "reassembling") {
        if (reassemblyDoneTimeoutRef.current !== null) {
          window.clearTimeout(reassemblyDoneTimeoutRef.current);
        }
        reassemblyDoneTimeoutRef.current = window.setTimeout(() => {
          reassemblyDoneTimeoutRef.current = null;
          setMissionStep(mission, "done");
        }, REPAIR_REASSEMBLY_HOLD_MS);
      }
    },
    [mission, setMissionStep],
  );

  useEffect(() => {
    return () => {
      if (reassemblyDoneTimeoutRef.current !== null) {
        window.clearTimeout(reassemblyDoneTimeoutRef.current);
      }
    };
  }, []);

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
        {/*
          Single ExplodableModel mounted across the entire repair flow
          (fragmented -> done) so the model loads once, animates from
          its real original positions, never re-instantiates between
          phases, and stays at a stable transform. `split` toggles drive
          the explode/reassemble lerps in place.
        */}
        {isRepairPhase ? (
          <ExplodableModel
            modelPath={config.modelPath}
            rotation={config.modelRotation ?? [0, 0, 0]}
            scale={config.modelScale ?? 1}
            split={isSplitPhase}
            splitSpeed={REPAIR_FRAGMENT_SPLIT_SPEED}
            onPartsReady={setExplodedParts}
            onSplitSettled={handleSplitSettled}
            {...(isRepairing
              ? {
                  hideNodeNames: brokenNodeNames,
                  nodeAnchorNames: brokenNodeNames,
                  onNodeAnchorsChange: setBrokenAnchors,
                }
              : {})}
          />
        ) : null}
        {step === "scanning" ? (
          <RepairScanSequence
            config={config}
            parts={explodedParts}
            onComplete={(brokenParts) => {
              setScannedBrokenParts(brokenParts);
              setMissionStep(mission, "repairing");
            }}
          />
        ) : null}
        {step === "repairing" && mission === "ebike" ? (
          <RepairEbikeRepairTrigger
            onRepair={() => setMissionStep(mission, "reassembling")}
          />
        ) : null}
        {step === "repairing" && mission !== "ebike" ? (
          <RepairRepairingStep
            anchors={caseAnchors}
            brokenAnchors={brokenAnchors}
            brokenParts={scannedBrokenParts}
            config={config}
            placeholders={casePlaceholders}
            onRepair={() => setMissionStep(mission, "reassembling")}
          />
        ) : null}
        {step === "reassembling" ? <RepairReassemblyStep /> : null}
        {step === "done" && mission !== "pylon" && mission !== "ebike" ? (
          <RepairCompletionStep
            config={config}
            onComplete={() => completeMission(mission)}
          />
        ) : null}
        {step !== "waiting" &&
        step !== "done" &&
        step !== "reassembling" &&
        // Ebike's inspected phase is a 2.5s sphere-reveal cinematic that
        // auto-advances to fragmented; the case + "press to fragment"
        // prompt would only flash on screen, so suppress them here.
        !(mission === "ebike" && step === "inspected") ? (
          <RepairMissionCase
            config={config}
            onPlaceholdersChange={setCasePlaceholders}
            onAnchorsChange={setCaseAnchors}
            open={step === "repairing"}
            zoomed={step === "repairing"}
            showFragmentationPrompt={
              readyForFragmentation && mission !== "ebike"
            }
            onInteract={
              readyForFragmentation && mission !== "ebike"
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

function shouldFocusBubbleBeActive(
  step: MissionStep,
  mission: RepairMissionId,
): boolean {
  // Ebike opens the focus bubble one phase earlier (inspected) so the
  // sphere visibly engulfs the bike during the inspect-then-explode
  // build-up. Pylon/farm keep their original behaviour where the bubble
  // appears once the model has fragmented.
  if (mission === "ebike" && step === "inspected") return true;
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
