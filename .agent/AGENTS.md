# Agent — La Fabrik

You are working on **La Fabrik**, an interactive 3D web experience built with React Three Fiber. The player steps into the role of a technician in Altera (2050) and completes missions: repairing an e-bike, fixing a power grid, upgrading a vertical farm.

## Project Identity

- **Stack:** React 19, Three.js, @react-three/fiber 9, @react-three/drei, @react-three/rapier, GSAP, TypeScript, Vite
- **No external state lib.** State is managed by a custom `GameManager` singleton with a subscribe/getState pattern.
- **No Zustand, no Redux, no Context for global state.**
- **Versions are pinned** (no `^` in dependencies). Do not upgrade packages without explicit request.

## Architecture Rules

### Two patterns coexist

1. **Singleton manager classes** — for orchestration, audio, cinematics, zone detection, debug
2. **Declarative React components** — for all 3D scene objects (map, zones, lights, player, postprocessing)

Scene objects are **never** singleton classes. Managers are **never** React components.

### State ownership

- `GameManager` is the single source of truth for durable gameplay state (phase, zone, mission, input lock, dialogue)
- Other managers (`CinematicManager`, `AudioManager`, `ZoneManager`) handle side effects only — they read from GameManager but do not duplicate its state
- React components subscribe to GameManager through `useGameState()` hook
- **High-frequency values** (movement, camera interpolation, physics) stay in `useRef` + `useFrame` — never in React state

### File conventions

- Every file starts with a comment: `# route path <relative_path>` (e.g. `# route path src/world/Map.tsx`)
- Scene components live in `src/world/` and `src/components/3d/`
- UI overlays live in `src/components/ui/`
- Managers live in `src/stateManager/`
- Debug tooling lives in `src/debug/`
- Hooks live in `src/hooks/`
- Static data lives in `src/data/`
- Shaders live in `src/shaders/`
- Utilities live in `src/utils/`

### Import paths

Use `@/` alias for imports from `src/`:

```ts
import { GameManager } from "@/stateManager/GameManager";
import { useGameState } from "@/hooks/useGameState";
```

### Memory management

- Dispose only what you own (custom materials, render targets, manual clones)
- Never blindly deep-dispose shared/cached assets (drei loaders cache models)
- Use `Dispose.material()`, `Dispose.mesh()`, `Dispose.renderTarget()` from `src/utils/Dispose.ts`

### Debug

- Debug panel activates with `?debug` in URL
- All debug logic goes through `Debug.getInstance()` from `src/debug/Debug.ts`
- Never scatter `if (isDev)` blocks across files
- `r3f-perf` is lazy-loaded only in debug mode via `src/debug/DebugPerf.tsx`

## Managers (4 max)

| Manager            | Responsibility                                                      |
| ------------------ | ------------------------------------------------------------------- |
| `GameManager`      | Phase, zone, mission, input lock, dialogue — single source of truth |
| `CinematicManager` | GSAP timelines, camera lock/unlock                                  |
| `AudioManager`     | Music, SFX, spatial audio                                           |
| `ZoneManager`      | Zone detection, LOD triggers                                        |

## Do NOT

- Create new manager classes without explicit request
- Use Zustand, Redux, or React Context for global state
- Put high-frequency values in React state (`useState`)
- Import `CinematicManager`/`AudioManager`/`ZoneManager` directly from components — always go through `GameManager`
- Upgrade pinned dependency versions
- Create files outside the documented architecture without explicit request

## Skills

See `.agent/skills/` for detailed patterns per technology:

- `best-practices.md` — Code generation conventions (W3C, simple, scalable, modern)
- `r3f.md` — React Three Fiber component patterns
- `three.md` — Three.js conventions and AnimationMixer
- `gsap.md` — GSAP timeline and cinematic patterns
- `managers.md` — Singleton manager implementation
- `memory.md` — GPU memory and disposal rules
- `debug.md` — Debug utility and r3f-perf setup
