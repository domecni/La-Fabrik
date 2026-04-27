import { createContext, useContext } from "react";
import type { HandTrackingSnapshot } from "@/types/handTracking";

export const HAND_TRACKING_IDLE_SNAPSHOT: HandTrackingSnapshot = {
  hands: [],
  status: "idle",
  serverStatus: null,
  error: null,
};

export const HandTrackingContext = createContext<HandTrackingSnapshot>(
  HAND_TRACKING_IDLE_SNAPSHOT,
);

export function useHandTrackingSnapshot(): HandTrackingSnapshot {
  return useContext(HandTrackingContext);
}
