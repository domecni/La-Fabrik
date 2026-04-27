# Current Architecture

This document describes the code that exists today in the repository.

## Runtime Structure

- `src/App.tsx` mounts the `Canvas`, the 3D `World`, the debug perf overlay, and the HTML overlays.
- `src/world/World.tsx` composes the active scene, including:
  - environment and lighting
  - debug helpers and debug camera mode
  - either the map scene or the debug physics test scene
  - the player rig when the active camera mode is `player`
- `src/world/Map.tsx` loads the main map model and builds the collision octree.
- `src/world/debug/TestScene.tsx` provides a debug-oriented interaction and physics scene.
- `src/world/player/PlayerComponent.tsx` mounts the camera and controller.
- `src/world/player/PlayerController.tsx` owns pointer lock movement, jump handling, and interaction input.

## Interaction Model

- `src/stateManager/InteractionManager.ts` is the current interaction state source.
- `src/components/3d/InteractableObject.tsx` handles focus detection through distance and raycasting.
- `src/components/3d/TriggerObject.tsx` implements trigger-style interactions.
- `src/components/3d/GrabbableObject.tsx` implements hold-and-release interactions.
- `src/hooks/useInteraction.ts` exposes the interaction snapshot to React UI.
- `src/components/ui/InteractPrompt.tsx` shows the `E` prompt for trigger interactions.

## Audio

- `src/stateManager/AudioManager.ts` currently provides pooled one-shot sound playback.
- Trigger interactions may play audio directly through `AudioManager`.

## Debug System

- Debug mode is enabled with `?debug`.
- `src/utils/debug/Debug.ts` owns the `lil-gui` instance and debug controls.
- `src/hooks/debug/useCameraMode.ts` and `src/hooks/debug/useSceneMode.ts` subscribe to debug state.
- `src/utils/debug/DebugPerf.tsx` lazily mounts `r3f-perf` in debug mode.
- `src/utils/debug/scene/DebugHelpers.tsx` mounts debug helpers.
- `src/utils/debug/scene/DebugCameraControls.tsx` mounts the free debug camera.

## Current Limitations

- The repository is still a prototype, not the full intended game runtime.
- `src/world/debug/TestScene.tsx` is still part of the active scene composition.
- There is no central gameplay orchestrator such as `GameManager` yet.
- Missions, zones, cinematics, and dialogue systems are not implemented.
- The player uses octree collision and simple movement rules, not a complete gameplay physics stack.
