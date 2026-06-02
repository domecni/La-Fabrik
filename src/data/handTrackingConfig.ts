export const HAND_TRACKING_FRAME_WIDTH = 320;
export const HAND_TRACKING_FRAME_HEIGHT = 240;
// The browser MediaPipe model (hand_landmarker.task float16) is more
// sensitive than the backend Python model and needs a higher-resolution
// frame to detect hands reliably. The backend keeps 320x240 because that
// is the JPEG payload size sent over the WebSocket.
export const HAND_TRACKING_BROWSER_CAMERA_WIDTH = 640;
export const HAND_TRACKING_BROWSER_CAMERA_HEIGHT = 480;
export const HAND_TRACKING_TARGET_FPS = 10;
export const HAND_TRACKING_JPEG_QUALITY = 0.55;
export const HAND_TRACKING_CAMERA_TIMEOUT_MS = 8_000;
export const HAND_TRACKING_RESPONSE_TIMEOUT_MS = 1_500;
export const HAND_TRACKING_BROWSER_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
export const HAND_TRACKING_BROWSER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
export const HAND_TRACKING_BROWSER_DELEGATE: "CPU" | "GPU" = "GPU";

// Delay before the runtime actually starts after `enabled` flips to true.
// Absorbs React StrictMode's mount/unmount/mount cycle in dev and rapid
// `nearby` toggles at trigger borders. Invisible to the user (~5 frames).
export const HAND_TRACKING_RUNTIME_START_DELAY_MS = 80;

// How long the hand tracking stays active after the trigger condition
// (nearby / holding / repair step) turns off. Gives MediaPipe enough time
// to initialize webcam + model + first frame inference before we cleanup,
// so the user actually sees their hands when entering a zone briefly.
export const HAND_TRACKING_LINGER_MS = 2000;

// EMA weight applied to the latest landmark frame. Lower = smoother but
// laggier; higher = more responsive but more jitter from raw MediaPipe
// noise. 0.4 keeps the glove and grabbed objects from trembling without
// feeling sluggish.
export const HAND_TRACKING_LANDMARK_SMOOTHING = 0.4;
