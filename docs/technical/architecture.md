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
- `src/hooks/world/useWorldSceneLoading.ts` owns the production scene loading state shared by `World`, `GameMap`, and the player octree readiness.
- `src/world/GameMap.tsx` loads map nodes from `public/map.json`, resolves available models, renders them progressively, and shows fallback cubes for missing models.
- `src/world/GameMapCollision.tsx` builds the player collision octree from dedicated collision nodes only.
- `src/world/GameStageContent.tsx` is wrapped in Rapier `Physics` in the production game scene so stage gameplay objects can use physics without moving the map or player to Rapier. It now mounts reusable `RepairGame` instances for `bike`, `pylone`, and `ferme` mission states.
- `src/world/debug/TestMap.tsx` provides a debug-oriented interaction and physics map with the existing grab/trigger/model-preview objects plus separate `Bike`, `Pylone`, and `Farm` repair playground zones.
- `src/world/player/Player.tsx` mounts the camera and controller.
- `src/world/player/PlayerController.tsx` owns pointer lock movement, jump handling, repair-step movement locking, and interaction input.

## Physics Boundaries

The project currently uses two collision layers with separate responsibilities:

- `GameMapCollision` builds an octree used by the player controller for map collision.
- The player octree must be built from a small collision-only subset of map nodes. It currently uses the `terrain` node only instead of traversing the full visible map, because building an octree from all rendered props can overload the browser renderer.
- `GameStageContent` is wrapped in Rapier `Physics` for gameplay objects such as repair triggers, cases, grabbables, and future mission-specific objects.
- `TestMap` owns its own Rapier `Physics` playground so repair gameplay can be tuned per mission state without depending on the production map layout.

Keep the player and map octree outside the Rapier provider until there is a deliberate migration plan. This avoids mixing player movement rules with object physics before the gameplay systems need it.

## Interaction Model

- `src/managers/InteractionManager.ts` is the current interaction state source.
- `src/components/three/interaction/InteractableObject.tsx` handles focus detection through distance and raycasting.
- `src/components/three/interaction/TriggerObject.tsx` implements trigger-style interactions.
- `src/components/three/interaction/GrabbableObject.tsx` implements hold-and-release interactions.
- `src/hooks/interaction/useInteraction.ts` exposes the interaction snapshot to React UI.
- `src/components/ui/InteractPrompt.tsx` shows the `E` prompt for trigger interactions.

## Audio

- `src/managers/AudioManager.ts` provides pooled one-shot playback, looped music playback, category volumes, and optional stereo pan for one-shot sounds.
- Supported audio categories are `music`, `sfx`, and `dialogue`.
- Trigger interactions may play SFX directly through `AudioManager`.

## Settings Menu

- `src/managers/stores/useSettingsStore.ts` stores settings for music volume, SFX volume, dialogue volume, subtitle visibility, subtitle language, repair runtime, and menu visibility.
- `src/components/ui/GameSettingsMenu.tsx` renders the in-game options menu.
- `src/components/ui/GameUI.tsx` mounts the settings menu as an HTML overlay outside the canvas.
- `Esc` opens and closes the menu, and `src/world/player/PlayerController.tsx` ignores player input while the menu is open.
- Volume changes are forwarded to `AudioManager` by category.

## Dialogues And Subtitles

- `public/sounds/dialogue/dialogues.json` is the runtime dialogue manifest.
- Dialogue audio files live under `public/sounds/dialogue/`.
- Subtitle files live under `public/sounds/dialogue/subtitles/{fr|en}/`.
- The current subtitle model is one SRT file per voice and language.
- `src/types/dialogues/dialogues.ts` contains the dialogue manifest types.
- `src/utils/dialogues/dialogueManifestValidation.ts` validates manifest shape at runtime.
- `src/utils/dialogues/loadDialogueManifest.ts` loads the manifest and SRT cues, with French fallback when the selected language is missing.
- `src/utils/subtitles/parseSrt.ts` parses SRT blocks and timecodes.
- `src/utils/dialogues/playDialogue.ts` plays dialogue audio and synchronizes the active subtitle against the audio element time.
- `src/managers/stores/useSubtitleStore.ts` stores the currently displayed subtitle cue.
- `src/components/ui/Subtitles.tsx` renders the subtitle overlay.
- `src/world/GameDialogues.tsx` currently triggers dialogue entries that define a `timecode`.
- Dialogue playback is queued so multiple dialogue requests do not overlap.

## Cinematics

- `public/cinematics.json` is the runtime cinematic manifest.
- `src/types/cinematics/cinematics.ts` contains cinematic manifest types.
- `src/utils/cinematics/cinematicManifestValidation.ts` validates manifest shape at runtime.
- `src/utils/cinematics/loadCinematicManifest.ts` loads `/cinematics.json`.
- `src/world/GameCinematics.tsx` triggers cinematics that define a global `timecode`.
- Cinematics use GSAP timelines to animate the active camera position and look target.
- `dialogueCues` on a cinematic trigger dialogue IDs at times relative to the cinematic start.
- `src/managers/stores/useGameStore.ts` exposes `isCinematicPlaying`, used to lock player input during cinematics.

## Debug System

- Debug mode is enabled with `?debug`.
- `src/utils/debug/Debug.ts` owns the `lil-gui` instance and debug controls.
- `src/hooks/debug/useCameraMode.ts` and `src/hooks/debug/useSceneMode.ts` subscribe to debug state.
- `src/components/debug/DebugPerf.tsx` lazily mounts `r3f-perf` in debug mode.
- `src/components/ui/debug/DebugOverlayLayout.tsx` mounts the compact HTML debug overlay when enabled from `lil-gui`.
- `src/components/ui/debug/GameStateDebugPanel.tsx` exposes current game state, main/sub-state switching, previous/next step controls, and reset.
- `src/components/ui/debug/HandTrackingDebugPanel.tsx` shows hand tracking status, usage, loaded glove model, hand count, and fist state while hand tracking is active.
- `src/components/ui/SceneLoadingOverlay.tsx` displays the fullscreen loading state for 3D scenes, including the production game scene, debug physics scene, and editor scene.
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
- `src/components/editor/EditorDialogueManifestPanel.tsx` edits `public/sounds/dialogue/dialogues.json`.
- `src/components/editor/EditorCinematicManifestPanel.tsx` edits `public/cinematics.json`.
- `src/components/editor/EditorSrtPanel.tsx` renders the dialogue SRT editor inside the editor control panel.
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
- The game scene renders fallback cubes for nodes whose model cannot be resolved.
- The game scene currently uses `terrain` as the collision source for the player octree. Additional collision nodes should be explicit lightweight collision assets, not arbitrary visible decoration models.

## Current Limitations

- The repository is a prototype, not the full intended game runtime.
- `src/world/debug/TestMap.tsx` is part of the active scene composition.
- There is no central gameplay orchestrator such as `GameManager`.
- Mission state exists in Zustand and the repair flow is implemented as a prototype for the current repair missions.
- Cinematics and dialogues exist as prototype timecode-driven systems; dialogue branching and broader gameplay orchestration are still limited.
- The player uses octree collision and simple movement rules, not a complete gameplay physics stack.
- Editor save-to-server is implemented as a Vite dev-server plugin, not a production backend API.
