# Current Architecture

This document describes the code that exists today in the repository.

## Runtime Structure

- `src/main.tsx` mounts React.
- `src/App.tsx` mounts the TanStack `RouterProvider`.
- `src/router.tsx` declares the top-level routes:
  - `/` mounts the playable 3D scene, debug perf overlay, and HTML overlays.
  - `/editor` mounts the map editor page.
- `src/world/World.tsx` composes the active scene, including:
  - environment and lighting
  - debug helpers and debug camera mode
  - either the map scene or the debug physics test scene
  - the player rig when the active camera mode is `player`
- `src/world/GameMap.tsx` loads map nodes from `public/map.json`, resolves available models, and builds the collision octree.
- `src/world/GameStageContent.tsx` is wrapped in Rapier `Physics` in the production game scene so stage gameplay objects can use physics without moving the map or player to Rapier. It now mounts reusable `RepairGame` instances for `bike`, `pylone`, and `ferme` mission states.
- `src/world/debug/TestMap.tsx` provides a debug-oriented interaction and physics map.
- `src/world/player/Player.tsx` mounts the camera and controller.
- `src/world/player/PlayerController.tsx` owns pointer lock movement, jump handling, and interaction input.

## Physics Boundaries

The project currently uses two collision layers with separate responsibilities:

- `GameMap` builds an octree used by the player controller for map collision.
- `GameStageContent` is wrapped in Rapier `Physics` for gameplay objects such as repair triggers, cases, grabbables, and future mission-specific objects.

Keep the player and map octree outside the Rapier provider until there is a deliberate migration plan. This avoids mixing player movement rules with object physics before the gameplay systems need it.

## Interaction Model

- `src/managers/InteractionManager.ts` is the current interaction state source.
- `src/components/three/interaction/InteractableObject.tsx` handles focus detection through distance and raycasting.
- `src/components/three/interaction/TriggerObject.tsx` implements trigger-style interactions.
- `src/components/three/interaction/GrabbableObject.tsx` implements hold-and-release interactions.
- `src/hooks/interaction/useInteraction.ts` exposes the interaction snapshot to React UI.
- `src/components/ui/InteractPrompt.tsx` shows the `E` prompt for trigger interactions.

## Audio

- `src/managers/AudioManager.ts` currently provides pooled one-shot sound playback and looped music playback.
- Trigger interactions may play audio directly through `AudioManager`.

## Debug System

- Debug mode is enabled with `?debug`.
- `src/utils/debug/Debug.ts` owns the `lil-gui` instance and debug controls.
- `src/hooks/debug/useCameraMode.ts` and `src/hooks/debug/useSceneMode.ts` subscribe to debug state.
- `src/components/debug/DebugPerf.tsx` lazily mounts `r3f-perf` in debug mode.
- `src/components/ui/debug/DebugOverlayLayout.tsx` mounts the compact HTML debug overlay when enabled from `lil-gui`.
- `src/components/ui/debug/GameStateDebugPanel.tsx` exposes current game state, main/sub-state switching, previous/next step controls, and reset.
- `src/components/ui/debug/HandTrackingDebugPanel.tsx` shows hand tracking status, usage, loaded glove model, hand count, and fist state while hand tracking is active.
- `src/components/three/handTracking/HandTrackingGlove.tsx` places the rigged `gant_l` and `gant_r` models on detected hands in the debug physics scene.
- `src/components/debug/scene/DebugHelpers.tsx` mounts debug helpers.
- `src/components/debug/scene/DebugCameraControls.tsx` mounts the free debug camera.
- `lil-gui` global debug controls include camera mode, scene mode, `R3F Perf`, and `Debug Overlay`; interaction-specific controls live in the `Interaction` folder.

## 3D Component Domains

- `src/components/three/models/` contains reusable model helpers such as `ExplodableModel`.
- `src/components/three/interaction/` contains reusable interaction wrappers such as `InteractableObject`, `TriggerObject`, and `GrabbableObject`.
- `src/components/three/handTracking/` contains R3F hand tracking debug models such as the glove overlays.
- `src/components/three/gameplay/` contains the reusable production `RepairGame` flow, repair case, repair steps, and repair prompt components.
- `src/components/three/world/` contains reusable world/environment objects such as `SkyModel`.

## Editor System

- `src/pages/editor/page.tsx` is the route-level editor page for `/editor`.
- `src/components/editor/EditorControls.tsx` renders the HTML editor control panel.
- `src/components/editor/scene/EditorScene.tsx` composes the editor canvas scene, camera controls, lights, shortcuts, and map rendering.
- `src/components/editor/scene/EditorMap.tsx` renders map nodes, fallback cubes, selection highlighting, and transform controls.
- `src/controls/editor/FlyController.tsx` provides player-style editor navigation.
- `src/hooks/editor/useEditorSceneData.ts` loads scene data and handles folder upload fallback.
- `src/hooks/editor/useEditorHistory.ts` owns editor undo and redo state.
- `src/utils/editor/loadEditorScene.ts` handles editor-only folder upload parsing.
- `src/utils/map/loadMapSceneData.ts` is shared by the game scene and editor to load `public/map.json` and resolve model URLs.
- `src/types/editor/editor.ts` contains the shared `MapNode`, `SceneData`, and `TransformMode` types.
- `src/types/gameplay/repairMission.ts` contains shared repair mission ids, mission steps, and guards used across store, config, debug UI, and gameplay components.

## Map Data

- `public/map.json` is expected to be a `MapNode[]`.
- Each map node `name` maps to `public/models/{name}/model.glb` when available, with `public/models/{name}/model.gltf` kept as fallback.
- The editor renders a fallback cube for missing models.
- The game scene filters out nodes whose model cannot be resolved.

## Current Limitations

- The repository is a prototype, not the full intended game runtime.
- `src/world/debug/TestMap.tsx` is part of the active scene composition.
- There is no central gameplay orchestrator such as `GameManager`.
- The mission state exists in Zustand, but zones, cinematics, dialogue, and the full repair sequence are not implemented.
- The player uses octree collision and simple movement rules, not a complete gameplay physics stack.
- Editor save-to-server is implemented as a Vite dev-server plugin, not a production backend API.
