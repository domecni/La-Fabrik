# Hand Tracking Technical Notes

This document describes the hand tracking system that exists in the current codebase.

## Purpose

Hand tracking started as a debug-stage interaction system used to test direct 3D object manipulation with a webcam. It allows a user to close their fist to grab a nearby object and move it in 3D space without relying on the center crosshair.

It is now also available to the production repair flow when a mission reaches a hand-driven step.

## Runtime Flow

1. The browser captures webcam frames in `src/hooks/handTracking/useRemoteHandTracking.ts`.
2. Frames are sent to the local Python backend over WebSocket.
3. The backend runs MediaPipe hand landmark detection.
4. The backend returns hand data including landmarks, handedness, score, center point, and `isFist`.
5. React stores the latest snapshot in the hand tracking provider.
6. `GrabbableObject` reads that snapshot each frame and uses fist state plus raycasting to grab objects.
7. `HandTrackingGlove` reads the same snapshot and places the rigged `gant_l` and `gant_r` models on the detected hands when hand tracking is active.

## Activation Rules

Hand tracking is intentionally gated so the webcam and backend are not used all the time.

The debug activation conditions are:

- debug mode is active with `?debug`
- scene mode is `physics`
- the player is near an interaction, is holding an object, or is hand-holding an object

This keeps hand tracking active while the player is inside an interaction zone, even if the camera is not aimed directly at the object.

The production repair activation conditions are:

- active `mainState` is `bike`, `pylone`, or `ferme`
- the active mission step is `inspected`, `repairing`, `reassembling`, or `done`

This keeps the webcam off during `waiting`, `fragmented`, and `scanning`, then enables hand input only when the repair flow is expected to use hands.

In the current production repair flow, `inspected` uses a two-fists hold gesture to advance to `fragmented`. The hold must last one second and is independent from local object interaction distance once the mission is in the correct state. Keyboard input for the same transition is handled separately by the repair case trigger, so pressing `E` requires the case to be focused through the shared interaction system.

## Backend

The backend lives in `backend/` and exposes:

- `GET /health` for health checks
- `WS /ws` for frame input and hand tracking output

The Python process uses MediaPipe and the local model file:

```txt
backend/hand_landmarker.task
```

The backend sends normalized hand coordinates and landmarks. The frontend treats the values as screen-space inputs, then maps them into world space with the active Three.js camera.

## Frontend Data Shape

The shared types live in `src/types/handTracking/handTracking.ts`.

```ts
interface HandTrackingHand {
  x: number;
  y: number;
  z: number;
  landmarks: HandTrackingLandmark[];
  handedness: string;
  isFist: boolean;
  score: number;
}
```

`x` and `y` are normalized camera coordinates. `z` is a relative depth value from MediaPipe, not an absolute world-space distance.

## Grab Targeting

The hand grab logic lives in `src/components/three/interaction/GrabbableObject.tsx`.

The object is moved toward the visual center of the hand. That center is computed from the bounding box of all landmarks:

```txt
centerX = (minX + maxX) / 2
centerY = (minY + maxY) / 2
```

Starting a grab uses a slightly wider virtual hit zone. Instead of raycasting only from one point, the code casts several rays around the hand center:

- center
- left
- right
- up
- down

If any ray hits the object while the object is within `INTERACTION_RADIUS`, the object enters hand-holding mode.

## Depth Handling

Because MediaPipe `z` is relative and noisy, the current frontend does not use it as a direct world-depth controller for object grabbing.

Instead, `GrabbableObject` computes a ray from the 2D hand center and moves the object toward a configurable hold distance in front of the active camera. That hold distance is shared with the mouse grab path and can be tuned in the debug GUI.

This is less expressive than true depth-aware hand movement, but it is more stable for the current first-person prototype.

## UI And Debug

The current debug UI includes:

- `HandTrackingDebugPanel` inside `DebugOverlayLayout` for status, usage, loaded glove model, server state, hand count, and fist state
- `HandTrackingVisualizer` for the SVG landmark wireframe fallback
- `HandTrackingGlove` for the left-hand `gant_l` and right-hand `gant_r` models in the R3F scene
- `r3f-perf` for render performance
- `lil-gui` for scene, camera, lighting, interaction, and grab controls

The hand tracking debug panel is a compact HTML grid outside the canvas. `Model loaded` displays the successfully loaded glove models. The SVG hand wireframe is only a fallback while models are loading or if a glove model fails to load.

## Glove Models

The current glove MVP uses `public/models/gant_l/model.gltf` and `public/models/gant_r/model.gltf`, which contain GLTF skins and armatures. Each model is positioned, oriented, and scaled from palm landmarks, then each finger bone chain is rotated toward the matching MediaPipe landmark chain.

The glove models are intentionally smaller than the raw SVG overlay so they do not dominate the camera view.

## Known Limitations

- Production usage is currently limited to repair mission steps that explicitly need hands.
- MediaPipe depth is relative and currently not used for stable object depth control.
- The virtual hit zone is an approximation based on multiple raycasts, not a real 3D collider.
- There is no smoothing layer for hand position or depth yet.
- The SVG hand visualization is a fallback, not the primary display when glove models load correctly.
- Finger bone animation is an approximate landmark-to-bone mapping; it still needs calibration for per-model twist, offsets, and smoothing.
