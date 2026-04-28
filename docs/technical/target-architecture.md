# Target Architecture

This document describes the intended medium-term architecture for the project.

## Relationship To The Current Code

- `docs/technical/architecture.md` is the source of truth for what exists now.
- This document describes intended direction, not implemented behavior.
- If this document conflicts with the current implementation, the current implementation wins.

## Goals

- Keep `App.tsx` small and orchestration-oriented.
- Separate production world code from debug-only runtime paths.
- Keep one clear source of truth per concern.
- Grow gameplay systems incrementally instead of prebuilding empty architecture.

## Intended Layers

### App Layer

- `App.tsx` mounts the canvas scene and top-level HTML overlays.
- It should stay thin and avoid gameplay logic.

### World Layer

- `src/world/` should contain production scene composition and production scene objects.
- Expected responsibilities:
  - world composition
  - map, environment, lighting
  - player controller
  - production interaction anchors
  - production post-processing, if needed

### Debug Layer

- Debug-only scenes and tooling should be isolated from the production world path.
- Expected responsibilities:
  - `lil-gui`
  - performance overlay
  - scene helpers
  - free camera and calibration controls
  - debug test scenes used during development

### UI Layer

- `src/components/ui/` should contain player-facing HTML overlays.
- Candidate examples:
  - crosshair
  - loading flow
  - mission HUD
  - narrative overlays

### Gameplay Layer

- As the project grows, gameplay state can move toward a clearer orchestration layer.
- Likely concerns:
  - missions
  - zones
  - cinematics
  - dialogue
  - audio
  - interactions

## Rules

- Prefer direct, working code over speculative scaffolding.
- Shared types should stay close to their domain until they have multiple real consumers.
- Avoid creating new managers or service layers without an active runtime need.
- Debug-only runtime paths should be clearly marked and easy to remove when obsolete.
