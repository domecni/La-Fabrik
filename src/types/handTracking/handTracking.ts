export interface HandTrackingLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandTrackingHand {
  x: number;
  y: number;
  z: number;
  landmarks: HandTrackingLandmark[];
  handedness: string;
  isFist: boolean;
  score: number;
}

export type HandTrackingUsageStatus = "inactive" | "available" | "active";

export type HandTrackingStatus =
  | "idle"
  | "requesting_camera"
  | "starting_camera"
  | "connecting_server"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface HandTrackingSnapshot {
  hands: HandTrackingHand[];
  status: HandTrackingStatus;
  usageStatus: HandTrackingUsageStatus;
  serverStatus: string | null;
  error: string | null;
}

export interface HandTrackingFrameMessage {
  type: "frame";
  timestamp: number;
  width: number;
  height: number;
  image: string;
}

export interface HandTrackingHandsMessage {
  type: "hands";
  timestamp: number;
  hands: HandTrackingHand[];
}

export interface HandTrackingStatusMessage {
  type: "status";
  timestamp: number;
  status: string;
}

export interface HandTrackingErrorMessage {
  type: "error";
  timestamp: number;
  hands: HandTrackingHand[];
  message: string;
}

export type HandTrackingServerMessage =
  | HandTrackingHandsMessage
  | HandTrackingStatusMessage
  | HandTrackingErrorMessage;
