export const HAND_TRACKING_FRAME_WIDTH = 320;
export const HAND_TRACKING_FRAME_HEIGHT = 240;
export const HAND_TRACKING_TARGET_FPS = 10;
export const HAND_TRACKING_JPEG_QUALITY = 0.55;
export const HAND_TRACKING_CAMERA_TIMEOUT_MS = 8_000;
export const HAND_TRACKING_RESPONSE_TIMEOUT_MS = 1_500;
export const HAND_TRACKING_BROWSER_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
export const HAND_TRACKING_BROWSER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
export const HAND_TRACKING_BROWSER_DELEGATE: "CPU" | "GPU" = "CPU";

// Delay before the runtime actually starts after `enabled` flips to true.
// Absorbs React StrictMode's mount/unmount/mount cycle in dev and rapid
// `nearby` toggles at trigger borders. Invisible to the user (~5 frames).
export const HAND_TRACKING_RUNTIME_START_DELAY_MS = 80;
