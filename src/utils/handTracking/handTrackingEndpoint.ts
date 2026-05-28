const HAND_TRACKING_LOCAL_WS_URL = "ws://localhost:8000/ws";
const HAND_TRACKING_PROD_WS_URL = "wss://handtracking.la-fabrik.fr/ws";

export function getHandTrackingWsUrl(): string {
  const configuredUrl = import.meta.env.VITE_HAND_TRACKING_WS_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  return import.meta.env.DEV
    ? HAND_TRACKING_LOCAL_WS_URL
    : HAND_TRACKING_PROD_WS_URL;
}
