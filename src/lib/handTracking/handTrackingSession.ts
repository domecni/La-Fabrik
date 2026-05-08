import { HAND_TRACKING_CAMERA_TIMEOUT_MS } from "@/data/handTrackingConfig";
import type { HandTrackingSnapshot } from "@/types/handTracking/handTracking";

export const INITIAL_HAND_TRACKING_SNAPSHOT: HandTrackingSnapshot = {
  hands: [],
  status: "idle",
  usageStatus: "inactive",
  serverStatus: null,
  error: null,
};

export function getCameraStreamWithTimeout(
  constraints: MediaStreamConstraints,
): Promise<MediaStream> {
  let didTimeout = false;
  const streamPromise = navigator.mediaDevices.getUserMedia(constraints);

  const timeoutPromise = new Promise<never>((_, reject) => {
    window.setTimeout(() => {
      didTimeout = true;
      reject(
        new Error(
          "Camera request timed out. Restart Arc or check camera permissions for localhost:5173.",
        ),
      );
    }, HAND_TRACKING_CAMERA_TIMEOUT_MS);
  });

  streamPromise.then((stream) => {
    if (didTimeout) {
      stream.getTracks().forEach((track) => track.stop());
    }
  });

  return Promise.race([streamPromise, timeoutPromise]);
}
