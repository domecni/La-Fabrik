# Implemented Features

This document lists features that are implemented in the current codebase.

## Scene

- Fullscreen React Three Fiber scene
- Main map scene loaded from `public/map.json` and matching `public/models/{name}/model.glb` or `model.gltf` assets
- Debug physics test scene selectable from the debug panel
- Rapier physics context available for production stage gameplay objects
- Ambient and directional lighting
- Environment background setup

## Player

- Player camera mode
- Pointer lock mouse look
- Movement with `ZQSD`
- Jumping
- Octree-based collision against the loaded map

## Interactions

- Focus detection by distance and raycast
- Trigger interactions activated with `E`
- Grab interactions activated with the primary mouse button
- Physics-backed gameplay objects can be mounted inside stage content without replacing player octree collision
- Interaction prompt shown for trigger interactions

## Repair Gameplay

- Reusable production `RepairGame` mounted for `bike`, `pylone`, and `ferme` mission states
- Repair mission config shared through `src/data/gameplay/repairMissions.ts`
- Repair-game flow supports `waiting -> inspected -> fragmented -> scanning -> repairing -> reassembling -> done -> next mission` with `.webm` prompts, repair case spawn/opening/exit, focused repair-case view, case placeholder traversal, snap-to-placeholder placement, broken-part deposit, `E`, two-fists hold input, exploded and inverse reassembly transitions, completion particles, per-part scan visuals, persistent red broken-part markers, centered broken-part UI videos, multiple grabbable replacement choices, correct-part install validation, and mission completion

## Audio

- One-shot sound playback for trigger interactions
- Simple per-sound pooling through `AudioManager`

## Debug Tooling

- `?debug` query param enables the debug panel
- `lil-gui` controls for camera mode, scene mode, `R3F Perf`, `Debug Overlay`, and interaction tuning
- Compact debug overlay for game state controls and hand tracking status
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

## Not Implemented Yet

- complete mission system
- zone system
- cinematic system
- dialogue system
- loading flow
- minimap and mission HUD
- full production separation between gameplay and debug scenes
- production backend persistence for editor saves
