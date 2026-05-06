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

export function HandTrackingProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const sceneMode = useSceneMode();
  const handTrackingSource = useDebugStore((debug) =>
    debug.getHandTrackingSource(),
  );
  const { nearby, holding, handHolding } = useInteraction();
  const enabled = sceneMode === "physics" && (nearby || holding || handHolding);
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
