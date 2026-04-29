# Main Feature

This document explains the main interactive feature currently being prototyped in La-Fabrik: grabbing and moving 3D objects with hand tracking.

## What It Does

In debug mode, the player can use their webcam to control object grabbing in the physics scene.

The intended user flow is:

1. Open the app with `?debug`.
2. Switch the scene to `Physics` in the debug panel.
3. Move close to a grabbable object.
4. Show a hand to the camera.
5. Close the hand into a fist near the object.
6. Move the hand to move the object.
7. Open the hand to release the object.

## Why It Matters

This prototype tests whether La-Fabrik interactions can feel more physical and embodied than a classic mouse or keyboard interaction.

For the final experience, this can support low-tech repair gestures, object manipulation, and more expressive interaction sequences.

## Current Behavior

The feature works with one or more detected hands. A hand is considered active for grabbing when the backend detects a closed fist.

When the fist starts close enough to a grabbable object, the object attaches to the hand target. The object then follows the hand center in screen space and also reacts to relative hand depth.

Moving the hand left, right, up, or down moves the object in that direction. Moving the hand closer or farther from the camera changes the object's distance from the camera.

## Debug Requirements

Hand tracking currently requires:

- Chrome or another browser that allows `getUserMedia()` reliably
- the local Python backend running
- the local MediaPipe model file available in `backend/hand_landmarker.task`
- the app opened with `?debug`
- the debug scene set to `Physics`

Backend command:

```bash
source backend/.venv/bin/activate
python -m backend.main
```

Frontend command:

```bash
npm run dev
```

Debug URL:

```txt
http://localhost:5173/?debug
```

## On-Screen Feedback

The debug build shows several helpers:

- a hand tracking status panel
- a hand landmark wireframe
- the `lil-gui` debug panel
- the `r3f-perf` performance panel
- optional interaction spheres

The wireframe turns yellow when the detected hand is a fist.

## Current Limitations

- The feature is still a prototype.
- It is enabled only in the debug physics scene.
- The SVG hand wireframe is temporary.
- Depth movement depends on relative webcam tracking and may need tuning.
- The system has not yet been integrated into final mission gameplay.

## Expected Next Improvements

- Smooth the hand position and depth signal.
- Add a better 3D hand representation.
- Add calibration controls for grab radius and depth sensitivity.
- Connect hand gestures to final repair or transformation tasks.
