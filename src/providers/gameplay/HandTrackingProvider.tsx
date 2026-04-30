import type { ReactNode } from "react";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { useInteraction } from "@/hooks/interaction/useInteraction";
import {
  HAND_TRACKING_IDLE_SNAPSHOT,
  HandTrackingContext,
} from "@/hooks/handTracking/useHandTrackingSnapshot";
import { useRemoteHandTracking } from "@/hooks/handTracking/useRemoteHandTracking";

export function HandTrackingProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const sceneMode = useSceneMode();
  const { nearby, holding, handHolding } = useInteraction();
  const enabled = sceneMode === "physics" && (nearby || holding || handHolding);
  const snapshot = useRemoteHandTracking({ enabled });

  return (
    <HandTrackingContext
      value={enabled ? snapshot : HAND_TRACKING_IDLE_SNAPSHOT}
    >
      {children}
    </HandTrackingContext>
  );
}
