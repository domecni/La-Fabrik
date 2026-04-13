# La-Fabrik

An interactive 3D web experience for La Fabrik Durable — a low-tech repair and transformation service in Altera, a post-capitalist city rebuilt in 2039. Players step into the role of a newly onboarded technician and experience a day at the service: repairing an e-bike, fixing a power grid, and upgrading a vertical farm's irrigation system.

## 📦 Tech Stack

### Build & Language
| Package | Doc |
|--------|-----|
| [TypeScript](https://www.typescriptlang.org/docs/) | https://www.typescriptlang.org/docs/ |
| [React](https://react.dev/learn) | https://react.dev/learn |
| [Vite](https://vite.dev/guide/) | https://vite.dev/guide/ |
| [ESLint](https://eslint.org/docs/latest/) | https://eslint.org/docs/latest/ |
| [Prettier](https://prettier.io/docs/) | https://prettier.io/docs/ |

### 3D Engine
| Package | Doc |
|--------|-----|
| [Three.js](https://threejs.org/docs/) | https://threejs.org/docs/ |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) | https://docs.pmnd.rs/react-three-fiber |
| [@react-three/drei](https://pmndrs.github.io/drei) | https://pmndrs.github.io/drei |
| [@react-three/rapier](https://rapier.rs/docs/) | https://rapier.rs/docs/user_guides/javascript/ |
| [@react-three/postprocessing](https://github.com/pmndrs/postprocessing) | https://github.com/pmndrs/postprocessing |
| [GSAP](https://gsap.com/docs/v3/Installation/) | https://gsap.com/docs/v3/ |

### State
| Package | Doc |
|--------|-----|
| [Zustand](https://zustand.docs.pmnd.rs/) | https://zustand.docs.pmnd.rs/ |

### Performance & Effects
| Package | Doc |
|--------|-----|
| [r3f-perf](https://github.com/utsuboco/r3f-perf) | https://github.com/utsuboco/r3f-perf |
| [AnimationMixer](https://threejs.org/docs/#api/en/animation/AnimationMixer) | https://threejs.org/docs/#api/en/animation/AnimationMixer |


## Architecture
la-fabrik/
├── public/
│   ├── models/
│   │   ├── map/
│   ├── textures/
│   └── sounds/
│
└── src/
    ├── world/
    │   ├── Map.tsx
    │   ├── Environment.tsx
    │   ├── PostFX.tsx
    │   ├── zones/
    │   │   ├── WorkshopZone.tsx
    │   │   ├── PowerGridZone.tsx
    │   │   └── FarmZone.tsx
    │   │   └── SchoolZone.tsx
    │   │   └── ResidentialZone.tsx
    │   └── player/
    │       ├── FPSController.tsx
    │       └── Crosshair.tsx
    │
    ├── components/
    │   ├── 3d/
    │   │   └── InteractiveObject.tsx
    │   └── ui/
    │       ├── NarrativeOverlay.tsx
    │       ├── MissionHUD.tsx
    │       ├── MapHUD.tsx
    │       ├── CinematicBars.tsx
    │       └── LoadingScreen.tsx
    │
    ├── stores/
    │   ├── useExperienceStore.ts
    │   ├── usePlayerStore.ts
    │   └── useAudioStore.ts
    │
    ├── hooks/
    │   ├── useZoneDetection.ts
    │   ├── useInteraction.ts
    │   └── useAudio.ts
    │   ├── useCinematic.ts
    │   └── useLOD.ts
    │
    ├── data/
    │   ├── zones.ts
    │   └── dialogues.ts
    │
    ├── shaders/
    │
    ├── utils/
    │   ├── debug.js
    │   ├── sizes.js
    │   ├── time.js
    │   └── loadingscreen.js
    │
    ├── App.tsx
    └── main.tsx 

## 🚀 Getting Started

```bash
git clone https://github.com/La-Fabrik-Durable/La-Fabrik.git
cd La-Fabrik
npm install
npm run dev
```

## 📜 License

See [LICENSE](./LICENSE) file.