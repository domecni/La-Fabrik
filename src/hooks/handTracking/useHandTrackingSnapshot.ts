import { createContext, useContext } from "react";
import type { HandTrackingSnapshot } from "@/types/handTracking/handTracking";

export const HAND_TRACKING_IDLE_SNAPSHOT: HandTrackingSnapshot = {
  hands: [],
  status: "idle",
  usageStatus: "inactive",
  serverStatus: null,
  error: null,
};

export const HandTrackingContext = createContext<HandTrackingSnapshot>(
  HAND_TRACKING_IDLE_SNAPSHOT,
);

export function useHandTrackingSnapshot(): HandTrackingSnapshot {
  return useContext(HandTrackingContext);
}
