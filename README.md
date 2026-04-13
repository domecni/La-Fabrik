# La-Fabrik

An interactive 3D web experience for La Fabrik Durable — a low-tech repair and transformation service in Altera, a post-capitalist city rebuilt in 2039. Players step into the role of a newly onboarded technician and experience a day at the service: repairing an e-bike, fixing a power grid, and upgrading a vertical farm's irrigation system.

Built with React, Three.js, and Vite. Runs in the browser, no installation required.

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


## 🗂 Project Structure
 
```
la-fabrik/
├── public/
│   ├── models/
│   │   ├── map/               # Base map — loaded once at start
│   │   ├── workshop/
│   │   ├── powerGrid/
│   │   └── farm/
│   ├── textures/
│   └── sounds/
│
└── src/
    ├── world/                              # Single persistent 3D world
    │   ├── Map.tsx                         # Base map, always mounted
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
    │   ├── GameManager.ts                  # Orchestrator: phase, missions, steps
    │   ├── CinematicManager.ts             # GSAP timelines, camera lock/unlock
    │   ├── AudioManager.ts                 # Music, SFX, spatial audio
    │   ├── NPCManager.ts                   # Dialogues, NPC state
    │   └── ZoneManager.ts                  # Zone detection, LOD triggers
    │
    ├── hooks/                              # React hooks — thin wrappers on managers
    │   ├── useZoneDetection.ts
    │   ├── useInteraction.ts
    │   ├── useCinematic.ts
    │   ├── useAudio.ts
    │   └── useLOD.ts
    │
    ├── data/
    │   ├── zones.ts                        # { id, position, radius, missionId }
    │   └── dialogues.ts                    # Narrative scripts per zone
    │
    ├── shaders/
    │   └── hologram/
    │       ├── vertex.glsl
    │       └── fragment.glsl
    │
    ├── utils/
    │   ├── Debug.ts                        # lil-gui panel
    │   ├── Sizes.ts                        # Viewport dimensions, resize listener
    │   ├── Time.ts                         # Delta, elapsed — outside useFrame
    │   ├── EventEmitter.ts                 # Decoupled event bus between managers
    │   └── Dispose.ts                      # traverse() + dispose() helper
    │
    ├── App.tsx                             # Canvas + UI superimposed
    └── main.tsx
```
 
## 🏗 Architecture Patterns
 
These patterns are **mandatory across the entire codebase**. Every class, every 3D object, every manager follows the same conventions. Consistency over cleverness.

### 1. Singleton Pattern
 
Every Manager and core utility uses the same singleton pattern. One instance, shared everywhere — no prop drilling, no context, no stray `new` calls
 
```ts
// stateManager/GameManager.ts
export class GameManager {
  private static _instance: GameManager | null = null
 
  cinematic!: CinematicManager
  audio!:     AudioManager
  zone!:      ZoneManager
  npc!:       NPCManager
 
  static getInstance(): GameManager {
    if (!GameManager._instance) {
      GameManager._instance = new GameManager()
    }
    return GameManager._instance
  }
 
  private constructor() {
    this.cinematic = CinematicManager.getInstance()
    this.audio     = AudioManager.getInstance()
    this.zone      = ZoneManager.getInstance()
    this.npc       = NPCManager.getInstance()
  }
 
  destroy(): void {
    this.cinematic.destroy()
    this.audio.destroy()
    this.zone.destroy()
    this.npc.destroy()
    GameManager._instance = null
  }
}
 
// Usage — anywhere in the codebase
const game = GameManager.getInstance()
game.startMission('workshop')
```
 
Apply the **exact same pattern** to every Manager and utility class (`CinematicManager`, `AudioManager`, `Debug`, `Sizes`, `EventEmitter`)
 
---
 
### 2. Class Interface — `load` / `update` / `destroy`
 
Every 3D class implements the same three-method lifecycle. No exceptions.
 
```ts
// Enforced interface for all world objects
interface WorldObject {
  load(): Promise<void>         // Load assets, build scene graph
  update(delta: number): void   // Per-frame logic (called from useFrame)
  destroy(): void               // Clean GPU memory — mandatory
}
```
 
```ts
// world/zones/WorkshopZone.tsx
export class WorkshopZone implements WorldObject {
  private group: THREE.Group = new THREE.Group()
  private mixer: THREE.AnimationMixer | null = null
 
  async load(): Promise<void> {
    const gltf = await loadGLTF('/models/workshop/ebike.glb')
    this.group = gltf.scene
    this.mixer = new THREE.AnimationMixer(this.group)
    this.scene.add(this.group)
  }
 
  update(delta: number): void {
    this.mixer?.update(delta)
  }
 
  destroy(): void {
    this.mixer?.stopAllAction()
    Dispose.object(this.group)    // ← always traverse before remove
    this.scene.remove(this.group)
  }
}
```
 
---
 
### 3. Memory Management — `traverse()` + `dispose()`
 
**Every `destroy()` must call `Dispose.object()` before removing anything from the scene.** Skipping this leaks GPU memory (VRAM) silently — no error thrown, just a crash after a few zone transitions.
 
**Rule: traverse first, remove second. Always.**
 
```ts
// utils/Dispose.ts
import * as THREE from 'three'
 
export class Dispose {
  /**
   * Recursively disposes all geometries, materials, and textures
   * from an Object3D and its entire subtree.
   *
   * Always call this before scene.remove() to prevent VRAM leaks.
   */
  static object(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
 
      // 1. Dispose geometry buffers
      child.geometry.dispose()
 
      // 2. Handle single and multi-material meshes
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material]
 
      for (const mat of materials) {
        // 3. Dispose every texture referenced by the material
        for (const value of Object.values(mat)) {
          if (value instanceof THREE.Texture) {
            value.dispose()
          }
        }
        // 4. Dispose the material itself
        mat.dispose()
      }
    })
  }
 
  /**
   * Dispose a WebGL render target and its textures.
   */
  static renderTarget(rt: THREE.WebGLRenderTarget): void {
    rt.texture.dispose()
    rt.dispose()
  }
}
```
 
Usage pattern — identical in every `destroy()`:
 
```ts
destroy(): void {
  Dispose.object(this.mesh)     // Frees VRAM: geometries, materials, textures
  this.scene.remove(this.mesh)  // Then removes from scene graph
}
```
 
---
 
### 4. Manager Coordination
 
`GameManager` is the **single entry point** for all logic. Components and hooks never import `CinematicManager` or `AudioManager` directly — always through `GameManager`. This keeps the dependency graph flat and every interaction auditable from one place.
 
```
Component / Hook
      ↓
GameManager.getInstance()
      ├── .cinematic.play('intro_workshop')
      ├── .audio.playAmbience('workshop')
      ├── .zone.setActive('workshop')
      └── .npc.startDialogue('mechanic_greeting')
```
 
```ts
// hooks/useCinematic.ts — thin wrapper, no logic
export function useCinematic() {
  const trigger = useCallback((id: string) => {
    GameManager.getInstance().cinematic.play(id)
  }, [])
 
  return { trigger }
}
```
 
Zustand is used **only for UI reactivity** — to push state from managers into React components. The logic lives in the manager class, not in the store.
 
```ts
// stateManager/GameManager.ts — Zustand as a thin reactive bridge
import { create } from 'zustand'
 
type GameState = {
  phase: 'loading' | 'intro' | 'exploring' | 'cinematic' | 'outro'
  activeZone: 'workshop' | 'powerGrid' | 'farm' | null
  setPhase: (phase: GameState['phase']) => void
  setActiveZone: (zone: GameState['activeZone']) => void
}
 
export const useGameStore = create<GameState>((set) => ({
  phase: 'loading',
  activeZone: null,
  setPhase: (phase) => set({ phase }),
  setActiveZone: (zone) => set({ activeZone: zone }),
}))
 
// GameManager writes — React components read
export class GameManager {
  setPhase(phase: GameState['phase']): void {
    useGameStore.getState().setPhase(phase)
  }
}
```
 
---
 
### 5. Debug Utility
 
Activate the debug panel by appending `?debug` to the URL (`http://localhost:5173?debug`). Never scatter `if (isDev)` blocks across files — all debug logic flows through `Debug.ts`.
 
```ts
// utils/Debug.ts
import GUI from 'lil-gui'
 
export class Debug {
  private static _instance: Debug | null = null
 
  readonly active: boolean
  gui: GUI | null = null
 
  static getInstance(): Debug {
    if (!Debug._instance) Debug._instance = new Debug()
    return Debug._instance
  }
 
  private constructor() {
    this.active = new URLSearchParams(window.location.search).has('debug')
    if (this.active) {
      this.gui = new GUI({ title: 'La-Fabrik Debug' })
    }
  }
 
  destroy(): void {
    this.gui?.destroy()
    Debug._instance = null
  }
}
```
 
```ts
// Usage in any class
const debug = Debug.getInstance()
if (debug.active) {
  debug.gui!.add(this.mesh.position, 'y', -5, 5).name('Height')
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