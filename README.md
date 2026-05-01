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
    ├── world/                              # Persistent 3D world composition
    │   ├── World.tsx                       # Active scene composition
    │   ├── GameMap.tsx                     # Map loading and octree collision
    │   ├── Lighting.tsx                    # Ambient, directional, point lights
    │   ├── Environment.tsx                 # Scene background / sky model
    │   ├── GameMusic.tsx                   # Game scene music lifecycle
    │   ├── debug/                          # Debug-only test scene
    │   │   └── TestMap.tsx
    │   └── player/
    │       ├── Player.tsx                  # Player rig composition
    │       ├── PlayerCamera.tsx            # Player camera mount
    │       └── PlayerController.tsx        # Pointer lock movement and inputs
    │
    ├── components/
    │   ├── three/                          # Shared R3F components by domain
    │   │   ├── gameplay/                   # Core repair gameplay prototype
    │   │   ├── interaction/                # Trigger, grab, focus wrappers
    │   │   ├── models/                     # GLTF model components
    │   │   └── world/                      # Environment-specific 3D objects
    │   └── ui/                             # HTML overlays — outside Canvas
    │       ├── Crosshair.tsx
    │       ├── debug/                       # Debug-only HTML overlay panels
    │       │   ├── DebugOverlayLayout.tsx
    │       │   ├── GameStateDebugPanel.tsx
    │       │   └── HandTrackingDebugPanel.tsx
    │       ├── HandTrackingVisualizer.tsx
    │       └── InteractPrompt.tsx
    │
    ├── managers/                           # Current singleton-style services
    │   ├── AudioManager.ts                 # Music and SFX playback
    │   └── InteractionManager.ts           # Focus, nearby, grab state
    │
    ├── hooks/                              # React hooks by domain
    │   ├── debug/                          # Debug state and GUI folders
    │   ├── docs/                           # Docs language context access
    │   ├── editor/                         # Editor loading and history
    │   ├── gameplay/                       # Repair gameplay helpers
    │   ├── handTracking/                   # Webcam/WebSocket hand tracking
    │   ├── interaction/                    # Interaction manager subscriptions
    │   └── three/                          # Three.js/R3F helpers
    │
    ├── data/
    │   ├── interaction/                    # Interaction tuning
    │   ├── player/                         # Player tuning
    │   ├── gameplay/                       # Repair gameplay static config
    │   └── world/                          # Environment and lighting config
    │
    ├── utils/
    │   ├── core/                           # Logger and generic utilities
    │   ├── debug/                          # Dev-only tools and scene inspection
    │   ├── editor/                         # Editor-only parsing utilities
    │   ├── map/                            # Map loading and validation
    │   └── three/                          # Three.js helpers
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
