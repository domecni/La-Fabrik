# Agent - La Fabrik

You are working on **La Fabrik**, an interactive 3D web experience built with React Three Fiber.

## Read This First

- `docs/technical/architecture.md` describes the code that exists today.
- `docs/technical/target-architecture.md` describes the intended target-state.
- Do not assume target-state systems already exist.

## Current Implementation

- Stack: React 19, Three.js, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`, TypeScript, Vite
- Zustand is used for shared game progression state.
- Current singleton-style services are limited to:
  - `InteractionManager`
  - `AudioManager`
  - `Debug`
- Current gameplay scope is still prototype-level:
  - player movement
  - trigger/grab interactions
  - debug camera and scene switching
  - simple audio playback

## Current Architecture Rules

- Scene objects live in `src/world/` and `src/components/three/`.
- Shared 3D components are grouped by domain under `src/components/three/models/`, `src/components/three/interaction/`, `src/components/three/gameplay/`, and `src/components/three/world/`.
- HTML overlays live in `src/components/ui/`.
- Shared static config lives in `src/data/`.
- Debug tooling lives in `src/utils/debug/` and `src/hooks/debug/`.
- Use the `@/` alias for imports from `src/`.
- Prefer small, direct changes over adding new abstraction layers.
- Shared types should live close to their domain and only move outward when they gain multiple real consumers.

## Target-State Guidance

The project may later grow toward a manager-driven gameplay architecture with clearer separation between:

- production world code
- gameplay orchestration
- UI overlays
- debug tooling

That target-state is aspirational until the matching code exists. If a target-state rule conflicts with the current implementation, treat the current code as the source of truth and improve it incrementally.

## Do Not Assume

- There is no `GameManager` in the current codebase.
- There are no implemented mission, zone, cinematic, or dialogue systems yet.
- Dependency versions are not pinned today; do not rewrite dependency strategy unless explicitly asked.
- The old `# route path ...` file header convention is not in use.

## Skills

Files in `.agent/skills/` are supplemental patterns and examples. Some describe target-state or generic practices rather than the exact current implementation, so verify against the code before applying them.
