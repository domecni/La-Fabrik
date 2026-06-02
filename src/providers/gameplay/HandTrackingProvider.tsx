import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { HAND_TRACKING_LINGER_MS } from "@/data/handTrackingConfig";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { useDebugStore } from "@/hooks/debug/useDebugStore";
import { useInteraction } from "@/hooks/interaction/useInteraction";
import {
  HAND_TRACKING_IDLE_SNAPSHOT,
  HandTrackingContext,
} from "@/hooks/handTracking/useHandTrackingSnapshot";
import { useBrowserHandTracking } from "@/hooks/handTracking/useBrowserHandTracking";
import { useRemoteHandTracking } from "@/hooks/handTracking/useRemoteHandTracking";
import { useGameStore } from "@/managers/stores/useGameStore";
import type { MissionStep } from "@/types/gameplay/repairMission";

const REPAIR_HAND_TRACKING_STEPS = new Set<MissionStep>([
  "inspected",
  "repairing",
  "reassembling",
  "done",
]);

export function HandTrackingProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const sceneMode = useSceneMode();
  const repairNeedsHands = useGameStore((state) => {
    switch (state.mainState) {
      case "ebike":
        return REPAIR_HAND_TRACKING_STEPS.has(state.ebike.currentStep);
      case "pylon":
        return REPAIR_HAND_TRACKING_STEPS.has(state.pylon.currentStep);
      case "farm":
        return REPAIR_HAND_TRACKING_STEPS.has(state.farm.currentStep);
      case "intro":
      case "outro":
        return false;
    }
  });
  const { nearby, holding, handHolding } = useInteraction();
  const requested =
    repairNeedsHands ||
    (sceneMode === "physics" && (nearby || holding || handHolding));

  // Keep the runtime active a little after `requested` turns off so
  // MediaPipe has time to initialize the webcam + model + first frame
  // before being torn down. Without this, a quick walk-through of a
  // trigger zone never produces a detected hand and the user sees
  // nothing.
  const enabled = useLingeredFlag(requested, HAND_TRACKING_LINGER_MS);

  // Always render the same JSX root (HandTrackingRuntime). Returning
  // different element types from this provider would force React to
  // remount its entire subtree — including the <Canvas> below — every
  // time `enabled` toggles, which destroys the WebGL context.
  return (
    <HandTrackingRuntime enabled={enabled}>{children}</HandTrackingRuntime>
  );
}

function useLingeredFlag(value: boolean, lingerMs: number): boolean {
  const [latched, setLatched] = useState(value);

  // Asymmetric sync: snap up immediately when `value` becomes true,
  // debounce the down transition by `lingerMs`. The setLatched(true)
  // call below is intentionally a direct setState inside an effect
  // because that is exactly the pattern we want (mirror upward edge,
  // delay downward edge), and there is no equivalent without it.
  useEffect(() => {
    if (value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional upward edge sync, see hook comment
      setLatched(true);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setLatched(false);
    }, lingerMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, lingerMs]);

  return latched;
}

function HandTrackingRuntime({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}): React.JSX.Element {
  const handTrackingSource = useDebugStore((debug) =>
    debug.getHandTrackingSource(),
  );
  const backendSnapshot = useRemoteHandTracking({
    enabled: enabled && handTrackingSource === "backend",
  });
  const browserSnapshot = useBrowserHandTracking({
    enabled: enabled && handTrackingSource === "browser",
  });
  const snapshot = !enabled
    ? HAND_TRACKING_IDLE_SNAPSHOT
    : handTrackingSource === "browser"
      ? browserSnapshot
      : backendSnapshot;

  return <HandTrackingContext value={snapshot}>{children}</HandTrackingContext>;
}
