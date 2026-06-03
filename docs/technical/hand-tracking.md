# Hand Tracking Technical Notes

This document describes the hand tracking system that exists in the current codebase.

## Purpose

Hand tracking started as a debug-stage interaction system used to test direct 3D object manipulation with a webcam. It allows a user to close their fist to grab a nearby object and move it in 3D space without relying on the center crosshair.

It is now also available to the production repair flow when a mission reaches a hand-driven step.

## Runtime Flow

The frontend can run hand tracking with two interchangeable sources, selected from the debug source controller:

- **Browser JS** (`src/hooks/handTracking/useBrowserHandTracking.ts`) runs MediaPipe `hand_landmarker.task` directly in the browser via `@mediapipe/tasks-vision`. Default for debug.
- **Backend** (`src/hooks/handTracking/useRemoteHandTracking.ts`) sends webcam frames as JPEG over WebSocket to a local Python process that runs MediaPipe and returns landmarks.

Both sources funnel into the same `HandTrackingContext` so all consumers see one shared snapshot:

1. The active source captures or receives landmarks.
2. The hook applies an EMA smoothing pass on the landmarks before publishing the snapshot.
3. `HandTrackingProvider` exposes that snapshot through React context.
4. `GrabbableObject` reads the snapshot each frame and uses `hand.isFist` plus raycasting to grab objects.
5. `HandTrackingVisualizer` paints the SVG hand silhouette overlay on top of the canvas — the primary visualization.
6. `HandTrackingGlove` (opt-in, see UI And Debug) places a rigged 3D glove on each detected hand when enabled via the debug toggle.

All consumers — fist detection, grab raycasting, SVG silhouette, optional 3D glove — read the **same** landmarks from the snapshot. None of them depend on the others.

## Activation Rules

Hand tracking is gated so the webcam and runtime are only spun up when actually needed.

The debug activation conditions are:

- debug mode is active with `?debug`
- scene mode is `physics`
- the player is near an interaction, is holding an object, or is hand-holding an object

The production repair activation conditions are:

- active `mainState` is `ebike`, `pylon`, or `farm`
- the active mission step is `inspected`, `repairing`, `reassembling`, or `done`

This keeps the webcam off during `waiting`, `fragmented`, and `scanning`.

### Linger

Once activation turns off (player walks back out of a trigger zone, or a mission step transitions away), the runtime stays alive for `HAND_TRACKING_LINGER_MS` (2000 ms) before being torn down. This gives MediaPipe enough time to finish initializing the webcam and load the model on a fresh entry — without the linger, a quick walk-through of a trigger zone never produces a detected hand.

## Provider Stability

`HandTrackingProvider` always renders the same JSX root (`HandTrackingRuntime`) and exposes `enabled` as a prop. Returning two different element types (`<HandTrackingContext value=IDLE>` vs `<ActiveHandTrackingProvider>`) used to be the historical shape and was the root cause of WebGL context loss: every `enabled` toggle forced React to remount the entire subtree, including the `<Canvas>`, which destroyed the WebGL renderer.

The two source hooks are therefore mounted in permanence with an `enabled` flag that they early-return on. No webcam or MediaPipe resources are created while `enabled` is false.

## StrictMode Resilience

In development, `<StrictMode>` mounts → unmounts → remounts each effect to surface non-idempotent code. The two source hooks delay their actual `start()` call by `HAND_TRACKING_RUNTIME_START_DELAY_MS` (80 ms) and clear the timer on cleanup, so a StrictMode double-mount or a rapid `nearby` flicker never reaches `getUserMedia` twice.

## Backend

The backend lives in `backend/` and exposes:

- `GET /health` for health checks
- `WS /ws` for frame input and hand tracking output

The Python process uses MediaPipe and the local model file:

```txt
backend/hand_landmarker.task
```

The frontend sends JPEG frames at `HAND_TRACKING_FRAME_WIDTH × HAND_TRACKING_FRAME_HEIGHT` (320×240) to keep WebSocket bandwidth low. The backend sends normalized hand coordinates and landmarks.

## Browser MediaPipe

The browser path uses `hand_landmarker.task` (float16) downloaded from Google's MediaPipe model storage. The requested webcam resolution is **640×480** (`HAND_TRACKING_BROWSER_CAMERA_WIDTH/HEIGHT`), independent from the backend's 320×240. The float16 model is more sensitive than the backend Python model and needs the higher-resolution frame to detect hands reliably.

The MediaPipe delegate is currently `"GPU"`. CPU works too but is significantly slower; on a loaded scene the inference drops to ~5fps and the user feels noticeable lag during grab. MediaPipe creates its own WebGL context separate from Three.js, so there is no direct contention.

A singleton instance of `HandLandmarker` is cached in `src/lib/handTracking/browserHandTracking.ts`. `releaseBrowserHandLandmarker()` is called on cleanup and on WebGL context lost.

## Smoothing

MediaPipe at ~10 fps produces noticeable landmark jitter that, when fed raw into the scene, makes both the glove rig and any grabbed object tremble.

A simple exponential moving average is applied to every landmark before the snapshot is published:

```ts
smoothed.x = previous.x * (1 - factor) + next.x * factor;
```

The factor is `HAND_TRACKING_LANDMARK_SMOOTHING` (0.4). Hands are matched across frames by `handedness` so left/right don't bleed into each other.

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

## Fist Detection

`isFist` is computed in `src/lib/handTracking/browserHandTracking.ts` (`isFist()` function) from landmarks alone — no model, no glove. The check is:

1. Palm center = mean of landmarks `[0, 5, 9, 13, 17]` (wrist + 4 MCPs).
2. Palm size = distance from wrist (landmark 0) to middle MCP (landmark 9).
3. For each of the four fingertip landmarks `[8, 12, 16, 20]`, check whether its distance to the palm center is less than `1.05 × palmSize`.
4. `isFist === true` iff all four fingertips pass the check.

The flag is attached to each hand on the snapshot at the publish step (`isFist: isFist(normalizedLandmarks)`) and read directly by `GrabbableObject.tsx` — the SVG visualizer and the 3D glove never participate in the gesture decision.

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
- `HandTrackingVisualizer` for the SVG hand silhouette overlay (always on when tracking is active)
- `HandTrackingFallback` for the last-resort hand silhouette overlay (legacy, see below)
- `HandTrackingGlove` for the per-hand rigged glove models in the R3F scene, opt-in via the **Show Model** toggle
- `r3f-perf` for render performance
- `lil-gui` for scene, camera, lighting, interaction, and grab controls

### SVG Visualizer

`HandTrackingVisualizer` is the primary hand visualization. It draws a light-blue hand silhouette with a crisp dark-blue outline by:

1. Filling a palm polygon (landmarks `[1, 5, 9, 13, 17]` plus two synthetic wrist corners) and five finger tubes (thick rounded `stroke` along each finger's joint chain).
2. Wrapping the whole thing in an SVG `<filter>` that uses `feMorphology` to dilate the merged alpha by 2 px and subtract the original, producing a single continuous outline around the union — no internal seams where the palm and finger tubes overlap.
3. Shrinking every landmark toward the hand centroid by `RENDER_SCALE = 0.65` so the silhouette stays compact and doesn't dominate the screen.
4. Overlaying the 21 raw landmarks and 21 bones as faint translucent lines and dots, so the user can still see the MediaPipe data feeding the silhouette.

The SVG only displays when MediaPipe is active and the debug **Show Model** toggle is off (default). When the toggle is on, the SVG hides and `HandTrackingGlove` takes over.

### Show Model Toggle

The `Hand Tracking` debug folder exposes a single visualization switch:

- `showHandTrackingModel = false` (default): SVG visualizer renders, 3D glove is not mounted at all.
- `showHandTrackingModel = true`: SVG visualizer hides, 3D glove gets mounted for the detected hand(s).

The 3D glove is treated as opt-in legacy because it had bugs (WebGL context loss, finger rig artefacts) and its hit/grab role was never load-bearing — grab has always read landmarks directly.

### Fallback Overlay (legacy)

`HandTrackingFallback` draws a simple open-hand or fist silhouette positioned on the detected wrist landmark. It renders for any hand whose glove is in the `"error"` state in `useHandTrackingGloveStatus`. Now that the glove is opt-in and rarely mounted, the fallback effectively only fires in the rare case where the user enables `showHandTrackingModel` and the glove fails to load. It is kept on disk for that edge case but is not part of the default visual path.

## Glove Models

The 3D glove is **opt-in** via the `Show Model` debug toggle (see UI And Debug). It is not mounted by default; the SVG visualizer is the primary hand UI. The information below applies only when the toggle is enabled.

`HandTrackingGlove` loads `public/models/gant_l/model.gltf` for both hands. The right hand applies `scale.x = -1` at the group level to mirror the mesh, so the thumb ends up on the correct side. Both hands therefore share the same rig and the same material.

The historical `public/models/gant_r/model.gltf` is kept as legacy but is not loaded by the frontend — its GLB embeds three skeletons (`Hand_l`, `Hand_l_pad`, `Hand_r`) plus a `galet` mesh, which made the finger rig unreliable.

The `gant_l` material is set to `alphaMode: OPAQUE` with `doubleSided: true`. The opaque mode prevents transparency sorting issues that made folded fingers disappear behind the palm; the double-sided flag covers the back faces revealed by the mirror scale on the right hand.

Two additional glove variants exist on disk:

- `public/models/gant_l_pad/model.gltf`
- `public/models/gant_r_pad/model.gltf`

They are intended for future swap-by-state usage but are **not yet rigged**. They cannot be animated by MediaPipe landmarks in their current form — re-exporting them from Blender with the same armature structure as `gant_l` is a prerequisite.

## Known Limitations

- Production usage is currently limited to repair mission steps that explicitly need hands.
- MediaPipe depth is relative and currently not used for stable object depth control.
- The virtual hit zone is an approximation based on multiple raycasts, not a real 3D collider.
- The 3D glove is opt-in only (see `Show Model` toggle). Default visual is the SVG silhouette.
- `HandTrackingFallback` is legacy and effectively unused unless the glove toggle is enabled and the glove fails to load.
- The right glove is a mirrored copy of `gant_l` rather than its own mesh; in the future a dedicated right-hand model would give a better visual.
- The `_pad` glove variants are not rigged yet, so swap-by-state (normal ↔ pad) is not wired in.
- Finger bone animation is an approximate landmark-to-bone mapping; it still needs calibration for per-model twist, offsets, and smoothing.
