# Hand Tracking Technical Notes

This document describes the hand tracking system that exists in the current codebase.

## Purpose

Hand tracking is a debug-stage interaction system used to test direct 3D object manipulation with a webcam. It allows a user to close their fist to grab a nearby object and move it in 3D space without relying on the center crosshair.

The feature is currently scoped to the debug physics scene and is not yet a production gameplay input system.

## Runtime Flow

1. The browser captures webcam frames in `src/hooks/handTracking/useRemoteHandTracking.ts`.
2. Frames are sent to the local Python backend over WebSocket.
3. The backend runs MediaPipe hand landmark detection.
4. The backend returns hand data including landmarks, handedness, score, center point, and `isFist`.
5. React stores the latest snapshot in the hand tracking provider.
6. `GrabbableObject` reads that snapshot each frame and uses fist state plus raycasting to grab objects.

## Activation Rules

Hand tracking is intentionally gated so the webcam and backend are not used all the time.

The current activation conditions are:

- debug mode is active with `?debug`
- scene mode is `physics`
- the player is near an interaction, is holding an object, or is hand-holding an object

This prevents the previous issue where hand tracking depended on crosshair focus. The system now remains active while the player is inside an interaction zone, even if the camera is not aimed directly at the object.

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

Because MediaPipe `z` is relative, the frontend captures the starting depth when the grab begins:

```txt
initialHandZ = hand.z
initialHoldDistance = hit.distance
```

While holding, the object distance from the camera is adjusted by the change in hand depth:

```txt
holdDistance = initialHoldDistance + (hand.z - initialHandZ) * sensitivity
```

The final hold distance is clamped between the configured grab minimum and maximum distances to avoid unstable movement.

## UI And Debug

The current debug UI includes:

- `HandTrackingOverlay` for status, usage, server state, hand count, and fist state
- `HandTrackingVisualizer` for the SVG landmark wireframe
- `r3f-perf` for render performance
- `lil-gui` for scene, camera, lighting, interaction, and grab controls

The hand tracking overlay is an HTML overlay outside the canvas. The hand wireframe is also HTML/SVG, not a 3D hand model.

## Known Limitations

- The feature is debug-only and currently focused on the physics test scene.
- MediaPipe depth is relative and can be noisy.
- The virtual hit zone is an approximation based on multiple raycasts, not a real 3D collider.
- There is no smoothing layer for hand position or depth yet.
- The hand visualization is a temporary SVG wireframe.
