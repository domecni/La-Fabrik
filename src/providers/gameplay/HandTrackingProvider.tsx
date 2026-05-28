import type { ReactNode } from "react";
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
  const enabled =
    repairNeedsHands ||
    (sceneMode === "physics" && (nearby || holding || handHolding));

  if (!enabled) {
    return (
      <HandTrackingContext value={HAND_TRACKING_IDLE_SNAPSHOT}>
        {children}
      </HandTrackingContext>
    );
  }

  return <ActiveHandTrackingProvider>{children}</ActiveHandTrackingProvider>;
}

function ActiveHandTrackingProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const handTrackingSource = useDebugStore((debug) =>
    debug.getHandTrackingSource(),
  );
  const backendSnapshot = useRemoteHandTracking({
    enabled: handTrackingSource === "backend",
  });
  const browserSnapshot = useBrowserHandTracking({
    enabled: handTrackingSource === "browser",
  });
  const snapshot =
    handTrackingSource === "browser" ? browserSnapshot : backendSnapshot;

  return <HandTrackingContext value={snapshot}>{children}</HandTrackingContext>;
}
