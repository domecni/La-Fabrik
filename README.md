# La-Fabrik

An interactive 3D web experience for La Fabrik Durable — a low-tech repair and transformation service in Altera, a post-capitalist city rebuilt in 2039. Players step into the role of a newly onboarded technician and experience a day at the service: repairing an e-bike, fixing a power grid, and upgrading a vertical farm's irrigation system.

Built with React, Three.js, and Vite. Runs in the browser, no installation required.

## 📦 Tech Stack

### Build & Language

| Package                                            | Doc                                  |
| -------------------------------------------------- | ------------------------------------ |
| [TypeScript](https://www.typescriptlang.org/docs/) | https://www.typescriptlang.org/docs/ |
| [React](https://react.dev/learn)                   | https://react.dev/learn              |
| [Vite](https://vite.dev/guide/)                    | https://vite.dev/guide/              |
| [ESLint](https://eslint.org/docs/latest/)          | https://eslint.org/docs/latest/      |
| [Prettier](https://prettier.io/docs/)              | https://prettier.io/docs/            |

### 3D Engine

| Package                                                                                   | Doc                                            |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [Three.js](https://threejs.org/docs/)                                                     | https://threejs.org/docs/                      |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) | https://docs.pmnd.rs/react-three-fiber         |
| [@react-three/drei](https://pmndrs.github.io/drei)                                        | https://pmndrs.github.io/drei                  |
| [@react-three/rapier](https://rapier.rs/docs/)                                            | https://rapier.rs/docs/user_guides/javascript/ |
| [@react-three/postprocessing](https://github.com/pmndrs/postprocessing)                   | https://github.com/pmndrs/postprocessing       |
| [GSAP](https://gsap.com/docs/v3/Installation/)                                            | https://gsap.com/docs/v3/                      |

### Performance & Effects

| Package                                                                     | Doc                                                       |
| --------------------------------------------------------------------------- | --------------------------------------------------------- |
| [r3f-perf](https://github.com/utsuboco/r3f-perf)                            | https://github.com/utsuboco/r3f-perf                      |
| [AnimationMixer](https://threejs.org/docs/#api/en/animation/AnimationMixer) | https://threejs.org/docs/#api/en/animation/AnimationMixer |

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
    │   ├── Map.tsx                         # Base map, always mounted
    │   ├── Lighting.tsx                   # Ambient, directional, point lights
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
    │   ├── Debug.ts                        # lil-gui panel
    │   ├── EventEmitter.ts               # Simple pub/sub for manager-to-manager events
    │   └── Dispose.ts                    # traverse() + dispose() helper
    │
    ├── App.tsx                             # Canvas + UI superimposed
    └── main.tsx
```

## 🏗 Architecture Patterns

The project uses **two complementary patterns**:

- **Singleton service classes** for orchestration and side effects
- **Declarative React components** for all 3D scene objects

This distinction is intentional. Scene elements such as the map, lights, environment, zones, and player are implemented as **React Three Fiber components** and mounted through `<Canvas>`.  
Global systems such as gameplay flow, cinematics, audio, and debug tooling are implemented as **manager classes**.

Consistency matters, but the codebase does **not** force the same lifecycle pattern on scene components and global services.

---

### 1. Singleton Pattern for Global Managers Only

Only cross-cutting services use the singleton pattern.

Examples:

- `GameManager`
- `CinematicManager`
- `AudioManager`
- `ZoneManager`
- `Debug`
- `EventEmitter`

These services must exist once, be accessible from anywhere, and coordinate the experience globally.

```ts
// stateManager/GameManager.ts
export class GameManager {
  private static _instance: GameManager | null = null;

  cinematic!: CinematicManager;
  audio!: AudioManager;
  zone!: ZoneManager;

  static getInstance(): GameManager {
    if (!GameManager._instance) {
      GameManager._instance = new GameManager();
    }
    return GameManager._instance;
  }

  private constructor() {
    this.cinematic = CinematicManager.getInstance();
    this.audio = AudioManager.getInstance();
    this.zone = ZoneManager.getInstance();
  }

  destroy(): void {
    this.cinematic.destroy();
    this.audio.destroy();
    this.zone.destroy();
    GameManager._instance = null;
  }
}
```

Usage:

```ts
const game = GameManager.getInstance();
game.startMission("workshop");
```

**Important:** scene objects such as `Map`, `WorkshopZone`, `Lighting`, or `Environment` are **not** singletons and must remain standard React components.

---

### 2. Scene Objects Are React Components, Not Manager Classes

All 3D scene objects are implemented as **declarative React components**.

This includes:

- maps
- lights
- environments
- player controllers
- zones
- interactive props
- postprocessing layers

This keeps the code aligned with the R3F runtime instead of rebuilding a parallel imperative engine.

Example:

```tsx
// world/zones/WorkshopZone.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

export function WorkshopZone() {
  const root = useRef<THREE.Group>(null);
  const gltf = useGLTF("/models/workshop/ebike.glb");
  const mixer = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    mixer.current = new THREE.AnimationMixer(gltf.scene);

    return () => {
      mixer.current?.stopAllAction();
      mixer.current = null;
    };
  }, [gltf.scene]);

  useFrame((_, delta) => {
    mixer.current?.update(delta);
  });

  return <primitive ref={root} object={gltf.scene.clone()} />;
}
```

Per-frame values such as movement, interpolation, camera smoothing, and physics must stay in:

- `useRef`
- `useFrame`
- Rapier bodies
- other frame-based systems

They must **never** go through React state.

---

### 3. Single Source of Truth for Durable Gameplay State

The project uses a single authoritative `GameManager` for durable gameplay state.

React components subscribe to that state through thin hooks.  
Other managers communicate through `GameManager`, which acts as the main gameplay orchestrator.

High-frequency values such as movement, camera interpolation, or physics never go through React state and stay in refs or frame-based systems.

```ts
// stateManager/GameManager.ts
type Phase = "loading" | "intro" | "exploring" | "cinematic" | "outro";
type ZoneId = "workshop" | "powerGrid" | "farm" | null;

type GameSnapshot = {
  phase: Phase;
  activeZone: ZoneId;
  missionId: string | null;
  missionStep: number;
  inputLocked: boolean;
  dialogueId: string | null;
};

export class GameManager {
  private static _instance: GameManager | null = null;
  private listeners = new Set<() => void>();

  private state: GameSnapshot = {
    phase: "loading",
    activeZone: null,
    missionId: null,
    missionStep: 0,
    inputLocked: false,
    dialogueId: null,
  };

  static getInstance(): GameManager {
    if (!GameManager._instance) {
      GameManager._instance = new GameManager();
    }
    return GameManager._instance;
  }

  getState(): GameSnapshot {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    this.listeners.forEach((cb) => cb());
  }

  setPhase(phase: Phase): void {
    this.state.phase = phase;
    this.emit();
  }

  setActiveZone(zone: ZoneId): void {
    this.state.activeZone = zone;
    this.emit();
  }

  startMission(id: string): void {
    this.state.missionId = id;
    this.state.missionStep = 0;
    this.emit();
  }
}
```

```ts
// hooks/useGameState.ts
import { useEffect, useState } from "react";
import { GameManager } from "@/stateManager/GameManager";

export function useGameState() {
  const game = GameManager.getInstance();
  const [state, setState] = useState(game.getState());

  useEffect(() => {
    return game.subscribe(() => {
      setState({ ...game.getState() });
    });
  }, [game]);

  return state;
}
```

This keeps the architecture simple:

- **GameManager** owns durable gameplay state
- **other managers** handle side effects
- **React components** render that state
- **R3F frame systems** handle fast-changing values

---

### 4. Side Effects Stay in Specialized Managers

Managers other than `GameManager` should not become secondary state stores.

Their role is to manage side effects and specialized runtime logic, such as:

- GSAP timelines
- audio playback
- zone entry detection
- interaction triggers
- camera lock/unlock
- temporary event coordination

They can read from `GameManager`, react to its state, or notify it of important transitions.

Example flow:

```text
Component / Hook
      ↓
GameManager.getInstance()
      ├── startMission('workshop')
      ├── cinematic.play('intro_workshop')
      ├── audio.playAmbience('workshop')
      └── zone.setActive('workshop')
```

This keeps the dependency graph understandable while avoiding duplicated durable state.

---

### 5. Memory Management — Dispose Only What You Own

GPU memory must be cleaned carefully.

However, the project does **not** blindly deep-dispose every object on unmount.  
Only resources explicitly created and owned by the current component or manager should be disposed.

This includes things like:

- custom materials
- render targets
- postprocessing passes
- manually created geometries
- manually created textures
- temporary clones with owned resources

Shared or cached assets must **not** be blindly disposed.

```ts
// utils/Dispose.ts
import * as THREE from "three";

export class Dispose {
  static material(material: THREE.Material): void {
    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture) {
        value.dispose();
      }
    }
    material.dispose();
  }

  static mesh(mesh: THREE.Mesh): void {
    mesh.geometry?.dispose();

    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];

    for (const material of materials) {
      if (material) this.material(material);
    }
  }

  static renderTarget(rt: THREE.WebGLRenderTarget): void {
    rt.texture.dispose();
    rt.dispose();
  }
}
```

Example usage:

```ts
useEffect(() => {
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
  });

  meshRef.current.material = material;

  return () => {
    Dispose.material(material);
  };
}, []);
```

**Rule:** disposal is ownership-based, not automatic and not blind.

---

### 6. Debug Utility

The debug panel can be activated by appending `?debug` to the URL:

`http://localhost:5173?debug`

All debug logic is centralized in `Debug.ts`.  
Do not scatter debug checks across the codebase.

```ts
// utils/Debug.ts
import GUI from "lil-gui";

export class Debug {
  private static _instance: Debug | null = null;

  readonly active: boolean;
  gui: GUI | null = null;

  static getInstance(): Debug {
    if (!Debug._instance) Debug._instance = new Debug();
    return Debug._instance;
  }

  private constructor() {
    this.active = new URLSearchParams(window.location.search).has("debug");
    if (this.active) {
      this.gui = new GUI({ title: "La-Fabrik Debug" });
    }
  }

  destroy(): void {
    this.gui?.destroy();
    Debug._instance = null;
  }
}
```

Usage:

```ts
const debug = Debug.getInstance();

if (debug.active) {
  debug.gui!.add(params, "bloomIntensity", 0, 3).name("Bloom");
}
```

## 🚀 Getting Started

```bash
git clone https://github.com/La-Fabrik-Durable/La-Fabrik.git
cd La-Fabrik
npm install
npm run dev
```

Open `http://localhost:5173` — standard experience.
Open `http://localhost:5173?debug` — debug panel + r3f-perf overlay.

## 📜 License

See [LICENSE](./LICENSE) file.
