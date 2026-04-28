# Current Architecture

This document describes the code that exists today in the repository.

## Runtime Structure

- `src/main.tsx` mounts React and wraps the app in `BrowserRouter`.
- `src/App.tsx` declares the top-level routes:
  - `/` mounts the playable 3D scene, debug perf overlay, and HTML overlays.
  - `/editor` mounts the map editor page.
- `src/world/World.tsx` composes the active scene, including:
  - environment and lighting
  - debug helpers and debug camera mode
  - either the map scene or the debug physics test scene
  - the player rig when the active camera mode is `player`
- `src/components/game/GameMap.tsx` loads map nodes from `public/map.json`, resolves available models, and builds the collision octree.
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

## Editor System

- `src/pages/editor/EditorPage.tsx` is the route-level editor page for `/editor`.
- `src/features/editor/components/EditorControls.tsx` renders the HTML editor control panel.
- `src/features/editor/scene/EditorScene.tsx` composes the editor canvas scene, camera controls, lights, shortcuts, and map rendering.
- `src/features/editor/scene/EditorMap.tsx` renders map nodes, fallback cubes, selection highlighting, and transform controls.
- `src/features/editor/controls/FlyController.tsx` provides player-style editor navigation.
- `src/features/editor/hooks/useEditorSceneData.ts` loads scene data and handles folder upload fallback.
- `src/features/editor/hooks/useEditorHistory.ts` owns editor undo and redo state.
- `src/features/editor/utils/loadEditorScene.ts` handles editor-only folder upload parsing.
- `src/utils/loadMapSceneData.ts` is shared by the game scene and editor to load `public/map.json` and resolve model URLs.
- `src/types/editor.ts` contains the shared `MapNode`, `SceneData`, and `TransformMode` types.

## Map Data

- `public/map.json` is expected to be a `MapNode[]`.
- Each map node `name` maps to `public/models/{name}/model.gltf`.
- The editor renders a fallback cube for missing models.
- The game scene filters out nodes whose model cannot be resolved.

## Current Limitations

- The repository is still a prototype, not the full intended game runtime.
- `src/world/debug/TestScene.tsx` is still part of the active scene composition.
- There is no central gameplay orchestrator such as `GameManager` yet.
- Missions, zones, cinematics, and dialogue systems are not implemented.
- The player uses octree collision and simple movement rules, not a complete gameplay physics stack.
- Editor save-to-server is implemented as a Vite dev-server plugin, not a production backend API.
