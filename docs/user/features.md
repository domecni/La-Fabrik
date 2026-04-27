# Implemented Features

This document lists features that are implemented in the current codebase.

## Scene

- Fullscreen React Three Fiber scene
- Main map scene loaded from `public/models/map/model.gltf`
- Debug physics test scene selectable from the debug panel
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
- Interaction prompt shown for trigger interactions

## Audio

- One-shot sound playback for trigger interactions
- Simple per-sound pooling through `AudioManager`

## Debug Tooling

- `?debug` query param enables the debug panel
- `lil-gui` controls for camera mode, scene mode, and interaction spheres
- Debug scene helpers
- Free debug camera
- `r3f-perf` overlay

## Not Implemented Yet

- mission system
- zone system
- cinematic system
- dialogue system
- loading flow
- minimap and mission HUD
- full production separation between gameplay and debug scenes
