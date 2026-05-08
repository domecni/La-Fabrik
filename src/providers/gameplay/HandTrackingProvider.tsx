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
import type { MissionStep } from "@/managers/stores/useGameStore";

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
  const handTrackingSource = useDebugStore((debug) =>
    debug.getHandTrackingSource(),
  );
  const repairNeedsHands = useGameStore((state) => {
    switch (state.mainState) {
      case "bike":
        return REPAIR_HAND_TRACKING_STEPS.has(state.bike.currentStep);
      case "pylone":
        return REPAIR_HAND_TRACKING_STEPS.has(state.pylone.currentStep);
      case "ferme":
        return REPAIR_HAND_TRACKING_STEPS.has(state.ferme.currentStep);
      case "intro":
      case "outro":
        return false;
    }
  });
  const { nearby, holding, handHolding } = useInteraction();
  const enabled =
    repairNeedsHands ||
    (sceneMode === "physics" && (nearby || holding || handHolding));
  const backendSnapshot = useRemoteHandTracking({
    enabled: enabled && handTrackingSource === "backend",
  });
  const browserSnapshot = useBrowserHandTracking({
    enabled: enabled && handTrackingSource === "browser",
  });
  const snapshot =
    handTrackingSource === "browser" ? browserSnapshot : backendSnapshot;

  return (
    <HandTrackingContext
      value={enabled ? snapshot : HAND_TRACKING_IDLE_SNAPSHOT}
    >
      {children}
    </HandTrackingContext>
  );
}
