export const HAND_TRACKING_LOCAL_WS_URL = "ws://localhost:8000/ws";
export const HAND_TRACKING_PROD_WS_URL = "wss://handtracking.la-fabrik.fr/ws";

export const HAND_TRACKING_FRAME_WIDTH = 320;
export const HAND_TRACKING_FRAME_HEIGHT = 240;
export const HAND_TRACKING_TARGET_FPS = 10;
export const HAND_TRACKING_JPEG_QUALITY = 0.55;
export const HAND_TRACKING_RESPONSE_TIMEOUT_MS = 1_500;

export function getHandTrackingWsUrl(): string {
  const configuredUrl = import.meta.env.VITE_HAND_TRACKING_WS_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  return import.meta.env.DEV
    ? HAND_TRACKING_LOCAL_WS_URL
    : HAND_TRACKING_PROD_WS_URL;
}
