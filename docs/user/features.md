# Implemented Features

This document lists the user-visible and developer-facing features implemented in the current `develop` branch.

## Application And Routes

- React 19 application bootstrapped by Vite and TypeScript
- TanStack Router route tree
- `/` playable 3D experience
- `/editor` local content editor
- `/docs` in-app documentation browser
- Lazy-loaded docs pages rendered from repository Markdown files

## 3D World

- Fullscreen React Three Fiber canvas
- Production world composition in `src/world/World.tsx`
- Environment model/background through `Environment` and `SkyModel`
- Shared lighting setup
- Production map loaded from `public/map.json`
- Model resolution from `public/models/{name}/model.glb`, then `model.gltf`
- Fallback cubes when a map node has no available model
- Progressive scene loading overlay for game, debug physics scene, and editor
- Stabilized game scene loading gates for map, model, collision, octree, and gameplay stage readiness
- Game stage content mounted only after the map has loaded
- Player, music, dialogues, and gameplay-dependent systems mounted only after gameplay is ready

## Player

- Player camera mode
- Pointer-lock mouse look
- `ZQSD` movement
- Jump with `Space`
- Trigger interaction with `E`
- Grab interaction with primary mouse button
- Spawn reset based on scene mode
- Input lock while the settings menu is open
- Input lock while a cinematic is playing
- Octree collision against dedicated map collision nodes, currently scoped to the `terrain` node
- Repair movement-lock hook and indicator exist, but the hook currently returns `false`, so movement is not locked during repair on the current branch

## Physics And Collision

- Separate collision responsibility between player and gameplay objects
- Player collision uses a Three.js capsule plus octree
- Gameplay objects use Rapier rigid bodies and colliders
- Production `GameStageContent` is mounted inside a Rapier `Physics` provider
- Debug physics scene owns its own Rapier playground
- Map collision octree is built from explicit collision nodes instead of the full visible map

## Interaction System

- Shared `InteractionManager` singleton for focused object, nearby object, holding state, and hand-holding state
- React subscription through `useSyncExternalStore`
- Distance and camera-ray focus detection in `InteractableObject`
- Trigger interactions through `TriggerObject`
- Grab interactions through `GrabbableObject`
- Trigger prompt shown by `InteractPrompt`
- Optional trigger SFX and optional spawned model support
- Debug interaction sphere visibility through the `Interaction` lil-gui folder
- Hand-controlled grab support for grabbable objects
- Snap-to-target behavior after releasing grabbable objects

## Repair Gameplay

- Reusable `RepairGame` mounted for `bike`, `pylone`, and `ferme`
- Mission progression driven by Zustand and shared `MissionStep` types
- Production repair positions:
  - `bike` at `[8, 0, -6]`
  - `pylone` at `[64, 0, -66]`
  - `ferme` at `[-24, 0, 42]`
- Debug physics repair playground zones for all three missions
- Data-driven mission config in `src/data/gameplay/repairMissions.ts`
- Mission flow: `locked -> waiting -> inspected -> fragmented -> scanning -> repairing -> reassembling -> done`
- `.webm` 3D prompts for mission object, interaction, and broken parts
- Repair object inspection
- Repair case spawn, pop animation, proximity float, wobble, open/close lid animation, exit animation, and open/close sounds
- Repair case placeholder traversal from GLTF nodes named `placeholder_*`
- Fallback placeholder positions when a case asset has no placeholder nodes
- Fragmentation through repair-case trigger or two-fists hand gesture
- Exploded model visualization through `ExplodableModel`
- Scan visual that steps through exploded parts
- Broken-part detection by configured `nodeName`, with fallback to first scanned parts
- Persistent broken-part highlight and broken-part prompt after discovery
- Grabbable replacement part choices, including decoys
- Grabbable broken parts that must be deposited back into the case
- Snap-to-placeholder placement
- Correct-part, wrong-part, and stored-part visual feedback
- Blocked install feedback when validation is attempted too early
- Install target that validates only when the correct replacement is placed and all broken parts are stored
- Inverse reassembly animation
- Completion particles
- Completion target that closes/exits the repair case before calling `completeMission`

## Game Progression Store

- Zustand `useGameStore` for durable gameplay progression
- Main states: `intro`, `bike`, `pylone`, `ferme`, `outro`
- Per-mission repair step state
- Per-mission completion flags
- Generic mission helpers: `setMissionStep`, `completeMission`, `advanceGameState`, `rewindGameState`, `resetGame`
- `isCinematicPlaying` flag used by the player input lock
- Debug game-state panel that can jump between main states and sub-states

## Settings And UI Overlays

- `Esc` opens and closes the settings menu
- Music, SFX, and dialogue volume sliders
- Subtitle visibility toggle
- Subtitle language choice between French and English
- Repair-runtime choice between JavaScript and Python modes stored in settings
- Quit action that clears browser-accessible cookies and returns to `/`
- Crosshair overlay
- Interaction prompt
- Subtitle overlay
- Repair movement-lock indicator component, currently inactive because the lock hook returns `false`
- Debug overlay layout
- Scene loading overlay

## Audio

- Singleton `AudioManager`
- Looped music playback
- One-shot SFX/dialogue playback
- Per-path one-shot audio pools
- Category volumes for `music`, `sfx`, and `dialogue`
- Optional stereo panning for one-shot sounds
- Playback-rate option for one-shot sounds
- Browser autoplay fallback for music: retry after user `pointerdown` or `keydown`
- Game music mounted through `GameMusic`
- Current game music path: `/sounds/musique/test.mp3`
- Current base music volume: `0.33`
- Repair case open/close sounds
- Trigger-object SFX support

## Dialogue And Subtitles

- Runtime dialogue manifest in `public/sounds/dialogue/dialogues.json`
- Dialogue audio under `public/sounds/dialogue/`
- One SRT file per voice and language
- French and English subtitle folders
- Runtime SRT parsing
- Subtitle cue lookup by voice, selected language, and `subtitleCueIndex`
- French fallback when the selected language file is unavailable
- Dialogue playback through the `dialogue` audio category
- Runtime subtitle synchronization from audio `timeupdate`
- Speaker-aware subtitle overlay
- Dialogue queueing to avoid overlapping dialogue playback
- Global timecode dialogue triggering through `GameDialogues`

## Cinematics

- Runtime cinematic manifest in `public/cinematics.json`
- Cinematic manifest validation
- GSAP camera keyframe playback
- Camera position and look target interpolation
- Optional dialogue cues relative to cinematic start time
- Player input lock while a cinematic is active
- Current world integration only mounts `GameCinematics` during `mainState === "outro"`

## Hand Tracking

- Optional webcam hand tracking provider around the playable scene
- Source switch in debug GUI: local Python backend or browser-side MediaPipe
- Backend WebSocket endpoint at `ws://localhost:8000/ws`
- Backend health endpoint at `http://localhost:8000/health`
- Browser-side MediaPipe through `@mediapipe/tasks-vision`
- Lazy activation so camera/tracking is not always active
- Production activation during repair steps that need hand input
- Debug activation in physics mode while near, holding, or hand-holding interactions
- Hand snapshot context for R3F and UI consumers
- Fist detection
- Two-fists hold gesture for repair fragmentation
- Hand grab support for `GrabbableObject`
- Hand-tracking debug panel with status, source/server state, hand count, fist state, and glove model status
- SVG hand visualizer fallback
- `gant_l` and `gant_r` R3F glove overlays when tracking is active

## Debug Tooling

- `?debug` query param enables debug systems
- `lil-gui` root debug folder
- Camera mode switch between player and debug camera
- Scene mode switch between production game and physics test scene
- R3F perf toggle
- Debug overlay toggle
- Hand-tracking source switch
- Interaction sphere debug toggle
- Grabbable tuning controls for stiffness, throw boost, and hold distance
- Debug helpers: grid and axes
- Debug camera controls
- Debug game-state panel
- Debug hand-tracking panel
- Physics test scene with floor, grabbable object, trigger object, repair zones, and animated model preview
- Animated `electricienne_animated` model preview restored in the debug physics scene

## Map And Content Editor

- `/editor` route
- Automatic loading of `public/map.json`
- Folder upload fallback when map data is not available
- Shared `MapNode` format with runtime map loading
- Render available map models
- Fallback cubes for missing models
- Object selection by click
- Transform modes: translate, rotate, scale
- Transform keyboard shortcuts: `T`, `R`, `S`
- Selection lock
- Explicit selection clear
- Undo and redo
- Player-style editor navigation with `WASD`, `ZQSD`, arrows, `Space`, and `Shift`
- JSON inspector
- JSON export
- Dev-server save endpoint for `public/map.json`
- Dialogue manifest editor
- SRT subtitle editor
- Audio preview and cue timing helpers
- French SRT cue creation helper
- Dialogue asset validation endpoint
- Cinematic manifest editor
- Cinematic camera keyframe editor
- Cinematic dialogue cue editor
- Cinematic preview in the editor canvas
- Dev-server endpoints for dialogue, SRT, and cinematic saves

## In-App Documentation

- `/docs` documentation layout
- Markdown rendered through `react-markdown` and `remark-gfm`
- Technical docs for architecture, scene runtime, repair game, interaction, editor, audio, hand tracking, Zustand, Three debugging, animation, and target architecture
- User docs for implemented features, main feature, editor usage, and code-review preparation

## Not Implemented Or Incomplete

- Complete production mission manager/orchestrator
- Full mission HUD or minimap
- Full zone system
- Dialogue branching
- Production persistence for editor saves
- Production backend for repair-game runtime selection
- Production save/load of player progression
- Full migration of player movement to Rapier
- Advanced hand smoothing and calibrated glove finger animation
- Snap-to-grid, object creation, object deletion, material editing, or model editing in the map editor
