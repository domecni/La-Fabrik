# Implemented Features

This document lists features that are implemented in the current codebase.

## Scene

- Fullscreen React Three Fiber scene
- Main map scene loaded from `public/map.json` and matching `public/models/{name}/model.glb` or `model.gltf` assets
- Minimal fullscreen scene loading overlay for 3D scenes, with a global progress bar used by the production map, debug physics scene, and editor scene
- Debug physics test scene selectable from the debug panel, including grab/trigger tests, an animated model preview, and separate repair playground zones for `bike`, `pylone`, and `ferme`
- Rapier physics context available for production stage gameplay objects
- Ambient and directional lighting
- Environment background setup

## Player

- Player camera mode
- Pointer lock mouse look
- Movement with `ZQSD`
- Jumping
- Movement lock during active repair steps, with an on-screen indicator while keeping trigger interactions available
- Octree-based collision against dedicated map collision nodes, currently scoped to `terrain`

## Interactions

- Focus detection by distance and raycast
- Trigger interactions activated with `E`
- Grab interactions activated with the primary mouse button
- Physics-backed gameplay objects can be mounted inside stage content without replacing player octree collision
- Interaction prompt shown for trigger interactions

## Repair Gameplay

- Reusable production `RepairGame` mounted for `bike`, `pylone`, and `ferme` mission states
- Debug physics playground mounts the same reusable `RepairGame` in `Bike`, `Pylone`, and `Farm` zones so each state can be tuned with isolated positioning before moving placement into the production map
- Repair mission config shared through `src/data/gameplay/repairMissions.ts`, including per-mission broken nodes, placeholder targets, scan timing, and reassembly timing
- Repair-game flow supports `waiting -> inspected -> fragmented -> scanning -> repairing -> reassembling -> done -> next mission` with `.webm` prompts, repair case spawn/opening/exit, focused repair-case view, movement lock indicator during active repair, repair-case trigger interaction, case placeholder traversal, snap-to-placeholder placement, broken-part deposit feedback, `E`, two-fists hold input, exploded and inverse reassembly transitions, completion particles, per-part scan visuals, persistent red broken-part markers, centered broken-part UI videos, multiple grabbable replacement choices, correct-part install validation feedback, and mission completion

## Audio

- Category-based volumes for music, SFX, and dialogue
- Looped background music playback through `AudioManager`
- One-shot sound playback for SFX and dialogue, with simple per-sound pooling
- Optional stereo pan for one-shot sounds

## Dialogue And Subtitles

- Dialogue manifest in `public/sounds/dialogue/dialogues.json`
- Dialogue audio loaded from `public/sounds/dialogue/`
- One SRT subtitle file per voice and language
- French subtitle fallback when the selected language file is missing
- Runtime subtitle overlay with speaker-specific colors
- Timecoded dialogue trigger support for dialogue entries that define `timecode`
- Dialogue queueing to avoid overlapping dialogue playback

## Cinematics

- Cinematic manifest in `public/cinematics.json`
- Timecoded cinematic trigger support
- GSAP camera keyframe playback
- Optional dialogue cues synchronized to cinematic timelines
- Player input lock while a cinematic is active

## Game Options Menu

- `Esc` opens and closes the in-game options menu
- Music, SFX, and dialogue volume sliders
- Subtitle visibility toggle
- Subtitle language choice between French and English
- Repair runtime choice between local JavaScript and Python server mode
- Quit action that clears browser-accessible cookies and returns to `/`

## Debug Tooling

- `?debug` query param enables the debug panel
- `lil-gui` controls for camera mode, scene mode, `R3F Perf`, `Debug Overlay`, and interaction tuning
- Compact debug overlay for game state controls and hand tracking status
- Debug game-state mission switching unlocks locked repair missions at `waiting` for faster testing
- Debug scene helpers
- Free debug camera
- `r3f-perf` overlay

## Map Editor

- `/editor` route for inspecting and editing `public/map.json`
- Automatic loading of `public/map.json` when available
- Folder upload fallback when `map.json` is missing
- Rendering of available `public/models/{name}/model.glb` or `model.gltf` assets
- Fallback cubes for nodes whose model is missing
- Object selection by click
- Transform modes for translate, rotate, and scale
- Keyboard shortcuts for `T`, `R`, `S`, `Esc`, undo, and redo
- Player-style navigation mode with `WASD`, `ZQSD`, arrow keys, `Space`, and `Shift`
- JSON export for downloading the edited map
- Dev-server save endpoint for writing changes back to `public/map.json`
- SRT editor for dialogue subtitles
- Audio preview and timing helpers for SRT cues
- Dev-server save endpoint for SRT files
- Dialogue manifest editor with preview and assisted French SRT cue creation
- Cinematic manifest editor with camera keyframes, dialogue cues, and canvas preview
- Dialogue manifest validation from the editor UI

## Not Implemented Yet

- complete mission system
- zone system
- full cinematic system beyond current timecode prototype
- gameplay-triggered dialogue branches beyond current prototype triggers
- loading flow
- minimap and mission HUD
- full production separation between gameplay and debug scenes
- production backend persistence for editor saves
