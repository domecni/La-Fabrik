import type { ReactNode } from "react";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import {
  HAND_TRACKING_IDLE_SNAPSHOT,
  HandTrackingContext,
} from "@/hooks/useHandTrackingSnapshot";
import { useRemoteHandTracking } from "@/hooks/useRemoteHandTracking";
import { isDebugEnabled } from "@/utils/debug/isDebugEnabled";

export function HandTrackingProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const sceneMode = useSceneMode();
  const enabled = isDebugEnabled() && sceneMode === "physics";
  const snapshot = useRemoteHandTracking({ enabled });

  return (
    <HandTrackingContext
      value={enabled ? snapshot : HAND_TRACKING_IDLE_SNAPSHOT}
    >
      {children}
    </HandTrackingContext>
  );
}
