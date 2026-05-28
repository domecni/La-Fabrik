# La-Fabrik

La-Fabrik is an interactive 3D web experience built with React, Vite, Three.js, React Three Fiber, Rapier, GSAP, MediaPipe, and Zustand.

The current prototype puts the player in a repair-oriented world where they progress through a short mission chain: intro, e-bike repair, power pylon repair, vertical farm repair, then outro. The project also includes a local editor for map, dialogue, subtitle, and cinematic data.

## Current Scope

- Playable fullscreen 3D scene at `/`
- Production map loaded from `public/map.json`
- Progressive map/model/collision/stage loading overlay
- Player controller with pointer lock, `ZQSD` movement, jump, octree collision, trigger input, and grab input
- Reusable repair-game flow for `ebike`, `pylon`, and `farm`
- Repair case animation, exploded model scan, broken-part markers, grabbable replacements, snap-to-placeholder placement, install validation, reassembly, and completion
- Shared interaction system for trigger and grab objects
- Rapier physics for gameplay objects while the player keeps a Three.js octree collision controller
- Hand tracking through either a local Python WebSocket backend or browser-side MediaPipe
- Category-based audio manager for music, SFX, and dialogue
- Dialogue manifest, SRT subtitles, subtitle overlay, and dialogue queueing
- Cinematic manifest with GSAP camera keyframes and optional dialogue cues
- In-game settings menu for volumes, subtitles, subtitle language, and the currently staged repair-runtime toggle
- Debug mode with `?debug`, lil-gui controls, game-state panel, hand-tracking panel, debug camera, physics playground, and R3F perf
- `/editor` route for map transforms, SRT editing, dialogue manifest editing, cinematic manifest editing, preview, validation, export, and dev-server saves
- `/docs` route that renders the repository documentation inside the app

## Routes

| Route     | Purpose                                             |
| --------- | --------------------------------------------------- |
| `/`       | Playable 3D experience                              |
| `/?debug` | Playable scene with debug GUI and overlays          |
| `/editor` | Local map, dialogue, subtitle, and cinematic editor |
| `/docs`   | In-app documentation index                          |

## Tech Stack

| Area                  | Packages                                                                       |
| --------------------- | ------------------------------------------------------------------------------ |
| App                   | React 19, TypeScript, Vite, TanStack Router                                    |
| 3D                    | Three.js, React Three Fiber, drei                                              |
| Physics and animation | `@react-three/rapier`, GSAP, Three.js `AnimationMixer`                         |
| State                 | Zustand, custom singleton managers where imperative runtime objects are needed |
| Hand tracking         | `@mediapipe/tasks-vision`, optional FastAPI backend                            |
| Docs                  | `react-markdown`, `remark-gfm`                                                 |
| Quality               | ESLint, Prettier, TypeScript project build                                     |

## Project Structure

```txt
.
|-- backend/                         # Optional Python hand-tracking backend
|-- docs/
|   +-- technical/                   # Architecture and implementation notes
|   +-- user/                        # Feature and user-facing guides
|-- public/
|   +-- assets/                      # UI videos, PDFs, logos, world videos
|   +-- cinematics.json              # Runtime cinematic manifest
|   +-- map.json                     # Runtime/editor map data
|   +-- models/                      # GLTF/GLB assets resolved by model folder name
|   +-- sounds/                      # Music, SFX, dialogue audio, SRT subtitles
|-- src/
|   +-- components/
|   |   +-- docs/                    # In-app docs layout and renderer
|   |   +-- editor/                  # Editor panels and editor scene
|   |   +-- three/                   # R3F components by domain
|   |   +-- ui/                      # HTML game/debug overlays
|   +-- controls/                    # Editor fly/player-style controls
|   +-- data/                        # Static tuning/config per domain
|   +-- hooks/                       # React hooks by domain
|   +-- lib/                         # Browser hand-tracking helpers
|   +-- managers/                    # Audio, interaction, and Zustand stores
|   +-- pages/                       # Route-level pages
|   +-- providers/                   # Docs and hand-tracking providers
|   +-- routes/                      # Lazy route wrappers
|   +-- types/                       # Shared domain types
|   +-- utils/                       # Core, map, editor, dialogue, subtitle, Three helpers
|   +-- world/                       # Production/debug world composition and player
`-- vite.config.ts                   # Vite config plus local editor save endpoints
```

## Getting Started

Install and run the frontend:

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:5173
```

Useful local URLs:

```txt
http://localhost:5173/?debug
http://localhost:5173/editor
http://localhost:5173/docs
```

Run checks:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
```

## Optional Hand-Tracking Backend

The app can use the local Python backend, but the default debug source is browser-side MediaPipe.

```bash
python3.11 -m venv backend/.venv
source backend/.venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
python backend/download_model.py
python -m backend.main
```

Backend endpoints:

```txt
GET http://localhost:8000/health
WS  ws://localhost:8000/ws
```

## Documentation Index

| File                                    | Purpose                                                    |
| --------------------------------------- | ---------------------------------------------------------- |
| `docs/technical/architecture.md`        | Current runtime architecture                               |
| `docs/technical/scene-runtime.md`       | Scene loading, world composition, and player spawn gates   |
| `docs/technical/repair-game.md`         | Repair-game implementation and state flow                  |
| `docs/technical/interaction.md`         | Trigger, grab, focus, and hand-grab system                 |
| `docs/technical/target-architecture.md` | Intended medium-term architecture direction                |
| `docs/technical/audio.md`               | Music, SFX, dialogue, subtitles, and editor validation     |
| `docs/technical/hand-tracking.md`       | Webcam, backend/browser MediaPipe, glove, and gesture flow |
| `docs/technical/zustand.md`             | Game, settings, and subtitle stores                        |
| `docs/technical/three-debugging.md`     | DevTools workflow for stepping into Three.js internals     |
| `docs/technical/map-performance.md`     | Map draw-call bottlenecks and optimization notes           |
| `docs/technical/editor.md`              | Editor implementation details                              |
| `docs/technical/animation.md`           | Animated, explodable, and reusable 3D model components     |
| `docs/user/features.md`                 | Implemented feature inventory                              |
| `docs/user/main-feature.md`             | User-facing repair-game walkthrough                        |
| `docs/user/editor.md`                   | Editor user guide                                          |
| `docs/code-review-preparation.md`       | French code-review preparation support                     |

## Current Caveats

- This is still a prototype, not a complete game runtime.
- The repair-runtime toggle is stored in settings and displayed in the UI, but the repair game currently still runs locally in React/Three.
- `useRepairMovementLocked()` currently returns `false`, so the movement-lock rule and indicator are present but disabled on `develop`.
- Production editor persistence does not exist. Save endpoints in `vite.config.ts` are local Vite dev-server helpers.
- The player uses octree collision while gameplay objects use Rapier. Keep that boundary deliberate unless the whole player controller is migrated.

## License

See `LICENSE`.
