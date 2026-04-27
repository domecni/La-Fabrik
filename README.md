# La-Fabrik

An interactive 3D web experience for La Fabrik Durable — a low-tech repair and transformation service in Altera, a post-capitalist city rebuilt in 2039. Players step into the role of a newly onboarded technician and experience a day at the service: repairing an e-bike, fixing a power grid, and upgrading a vertical farm's irrigation system.

Built with React, Three.js, and Vite. Runs in the browser, no installation required.

## 📦 Tech Stack

### Build & Language

| Package                                            |
| -------------------------------------------------- |
| [TypeScript](https://www.typescriptlang.org/docs/) |
| [React](https://react.dev/learn)                   |
| [Vite](https://vite.dev/guide/)                    |
| [ESLint](https://eslint.org/docs/latest/)          |
| [Prettier](https://prettier.io/docs/)              |

### 3D Engine

| Package                                                                                   |
| ----------------------------------------------------------------------------------------- |
| [Three.js](https://threejs.org/docs/)                                                     |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) |
| [@react-three/drei](https://pmndrs.github.io/drei)                                        |
| [@react-three/rapier](https://rapier.rs/docs/)                                            |
| [@react-three/postprocessing](https://github.com/pmndrs/postprocessing)                   |
| [GSAP](https://gsap.com/docs/v3/Installation/)                                            |

### Performance & Effects

| Package                                                                     |
| --------------------------------------------------------------------------- |
| [r3f-perf](https://github.com/utsuboco/r3f-perf)                            |
| [AnimationMixer](https://threejs.org/docs/#api/en/animation/AnimationMixer) |

## 🗂 Project Structure

```
la-fabrik/
├── public/
│   ├── models/
│   │   ├── map/                            # Base map — loaded once at start
│   │   ├── workshop/
│   │   ├── powerGrid/
│   │   └── farm/
│   ├── textures/
│   └── sounds/
│
└── src/
    ├── world/                              # Single persistent 3D world
    │   ├── World.tsx                       # Main scene composition
    │   ├── Map.tsx                         # Base map, always mounted
    │   ├── Lighting.tsx                    # Ambient, directional, point lights
    │   ├── Environment.tsx                 # HDRI, fog, sky
    │   ├── PostFX.tsx                      # Bloom, SSAO, chromatic aberration
    │   ├── zones/                          # Spatial zones — LOD per zone
    │   │   ├── WorkshopZone.tsx
    │   │   ├── PowerGridZone.tsx
    │   │   ├── FarmZone.tsx
    │   │   ├── SchoolZone.tsx
    │   │   └── ResidentialZone.tsx
    │   └── player/
    │       ├── FPSController.tsx           # PointerLockControls + Rapier movement
    │       └── Crosshair.tsx
    │
    ├── components/
    │   ├── 3d/                             # Shared reusable 3D elements
    │   │   └── InteractiveObject.tsx       # Raycasting + outline wrapper
    │   └── ui/                             # HTML overlays — outside Canvas
    │       ├── NarrativeOverlay.tsx        # Floating dialogues
    │       ├── MissionHUD.tsx              # Current objective
    │       ├── MapHUD.tsx                  # Minimap
    │       ├── CinematicBars.tsx           # GSAP black bars
    │       └── LoadingScreen.tsx           # Asset progress
    │
    ├── stateManager/                       # All logic, state, orchestration
    │   ├── GameManager.ts                  # Single source of truth: phase, zone, mission
    │   ├── CinematicManager.ts             # GSAP timelines, camera lock/unlock
    │   ├── AudioManager.ts                 # Music, SFX, spatial audio
    │   └── ZoneManager.ts                  # Zone detection, LOD triggers
    │
    ├── hooks/                              # React hooks — thin wrappers on managers
    │   ├── useGameState.ts                 # Subscribes to GameManager
    │   ├── useZoneDetection.ts
    │   ├── useInteraction.ts
    │   ├── useCinematic.ts
    │   ├── useAudio.ts
    │   └── useLOD.ts
    │
    ├── data/
    │   ├── zones.ts                        # { id, position, radius, missionId }
    │   ├── dialogues.ts                    # Narrative scripts, PNJ states
    │   └── missions.ts                     # Mission definitions, steps
    │
    ├── shaders/
    │   └── hologram/
    │       ├── vertex.glsl
    │       └── fragment.glsl
    │
    ├── utils/
    │   ├── EventEmitter.ts                 # Simple typed pub/sub utility
    │   ├── Sizes.ts                        # Viewport size tracking
    │   ├── Time.ts                         # Animation frame timing utility
    │   └── debug/                          # Dev-only tools and scene inspection
    │       ├── Debug.ts                    # Global lil-gui manager
    │       ├── DebugPerf.tsx               # r3f-perf overlay mounted in Canvas
    │       ├── isDebugEnabled.ts           # Debug query-string helper
    │       └── scene/
    │           ├── DebugHelpers.tsx        # Grid + axes helpers shown in debug mode
    │           └── DebugCameraControls.tsx # Free debug camera for map inspection
    ├── hooks/
    │   └── debug/
    │       ├── useCameraMode.ts
    │       ├── useDebugFolder.ts
    │       ├── useDebugStore.ts
    │       └── useSceneMode.ts
    │
    ├── App.tsx                             # Canvas bootstrap
    └── main.tsx
```

## 🚀 Getting Started

```bash
git clone https://github.com/La-Fabrik-Durable/La-Fabrik.git
cd La-Fabrik
npm install
npm run dev
```

- app: `http://localhost:5173`
- debug mode: `http://localhost:5173?debug`

## 📜 License

See [LICENSE](./LICENSE) file.
