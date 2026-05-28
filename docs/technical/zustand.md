# Zustand Stores

This document explains how Zustand is used in the current project.

## Why Zustand Exists Here

The project needs shared state that is durable enough to be read by multiple React and React Three Fiber systems.

Zustand is used for:

- game progression
- settings
- subtitle display

It is not used for high-frequency frame values. Values such as player velocity, temporary vectors, object positions during a grab, raycasts, and animation-loop data stay in refs or manager-local state.

## Store Locations

Current Zustand stores:

```txt
src/managers/stores/useGameStore.ts
src/managers/stores/useSettingsStore.ts
src/managers/stores/useSubtitleStore.ts
```

They are under `src/managers/stores/` because they are shared runtime state, not state owned by one visual component.

## Store Responsibilities

| Store              | Responsibility                                                    |
| ------------------ | ----------------------------------------------------------------- |
| `useGameStore`     | Durable game progression, mission steps, cinematic input lock     |
| `useSettingsStore` | Menu visibility, volumes, subtitle options, repair-runtime toggle |
| `useSubtitleStore` | Currently displayed subtitle cue                                  |

## Managers vs Stores

Managers own imperative runtime objects and side effects.

Examples:

- `AudioManager` owns audio elements, music playback, sound pools, category volumes, and optional panner nodes.
- `InteractionManager` owns transient interaction handles and input-oriented focus/holding state.

Stores own durable shared state:

- current game phase
- mission sub-step
- progression flags
- settings values
- currently displayed subtitle cue

Rule of thumb:

- manager = runtime objects, side effects, frame-adjacent imperative logic
- store = shared state that UI, world, or gameplay components need to subscribe to

## Game Store Shape

`useGameStore` exposes the main game progression.

Main states:

| Main state | Role                            |
| ---------- | ------------------------------- |
| `intro`    | Onboarding and opening sequence |
| `bike`     | E-bike repair sequence          |
| `pylone`   | Power pylon repair sequence     |
| `ferme`    | Vertical farm repair sequence   |
| `outro`    | Ending sequence                 |

Other important state:

- `isCinematicPlaying`
- `intro`
- `bike`
- `pylone`
- `ferme`
- `outro`

Mission steps:

```ts
"locked" |
  "waiting" |
  "inspected" |
  "fragmented" |
  "scanning" |
  "repairing" |
  "reassembling" |
  "done";
```

`isCinematicPlaying` is read by `PlayerController` to ignore player input while camera timelines are active.

## Reading State In Components

Use selectors to read only what the component needs.

```tsx
import { useGameStore } from "@/managers/stores/useGameStore";

export function Example(): React.JSX.Element {
  const mainState = useGameStore((state) => state.mainState);

  return <p>Current state: {mainState}</p>;
}
```

This is better than reading the whole store, because the component re-renders only when `mainState` changes.

## Updating Game State

Prefer explicit actions from the store.

```ts
const advanceGameState = useGameStore((state) => state.advanceGameState);

advanceGameState();
```

For development and debug tooling, direct setters also exist:

```ts
const setMainState = useGameStore((state) => state.setMainState);

setMainState("bike");
```

Direct setters are useful for debug panels, but production gameplay should prefer business actions such as:

- `advanceGameState`
- `completeBike`
- `completePylone`
- `completeFerme`
- `completeMission`

Mission gameplay that can target `bike`, `pylone`, or `ferme` should prefer generic mission actions:

```ts
const setMissionStep = useGameStore((state) => state.setMissionStep);
const completeMission = useGameStore((state) => state.completeMission);

setMissionStep("bike", "inspected");
completeMission("bike");
```

This keeps reusable gameplay components such as `RepairGame` from duplicating mission-specific branches like `setBikeState`, `setPyloneState`, and `setFermeState`.

## Settings Store

`useSettingsStore` owns player-facing settings and forwards audio volume changes to `AudioManager`.

State:

- `isSettingsMenuOpen`
- `musicVolume`
- `sfxVolume`
- `dialogueVolume`
- `subtitlesEnabled`
- `subtitleLanguage`

Audio setters clamp values between `0` and `1`, then call:

```ts
AudioManager.getInstance().setCategoryVolume(category, nextVolume);
```

This keeps UI state and browser audio state synchronized.

## Subtitle Store

`useSubtitleStore` is intentionally tiny.

State/actions:

- `activeSubtitle`
- `setActiveSubtitle`
- `clearActiveSubtitle`

`playDialogueById()` writes to this store while dialogue audio plays. `Subtitles` reads from it and respects `useSettingsStore().subtitlesEnabled`.

## World Integration

`src/world/GameStageContent.tsx` subscribes to `mainState` and mounts the repair-game content.

Current production repair placement:

```tsx
<RepairGame mission="bike" position={[8, 0, -6]} />
<RepairGame mission="pylone" position={[64, 0, -66]} />
<RepairGame mission="ferme" position={[-24, 0, 42]} />
```

`RepairGame` reads the active mission step from the store and writes transitions through generic actions such as `setMissionStep` and `completeMission`.

Shared repair ids, mission steps, and runtime guards live in:

```txt
src/types/gameplay/repairMission.ts
```

Mission-specific behavior stays in:

```txt
src/data/gameplay/repairMissions.ts
```

That lets the repair flow stay reusable while each mission defines its own model, broken parts, replacement parts, prompts, and timing.

## UI Integration

`src/components/ui/GameUI.tsx` groups the HTML overlays used by the playable route.

Current overlays:

- `DebugOverlayLayout`: debug-only overlay shown with `?debug`
- `GameStateDebugPanel`: compact debug UI for viewing and switching main/sub states
- `Crosshair`: player aiming helper
- `InteractPrompt`: interaction prompt
- `RepairMovementLockIndicator`: indicator shown while repair steps lock movement
- `HandTrackingVisualizer`: hand tracking SVG fallback/debug visualization
- `Subtitles`: active dialogue subtitle overlay
- `GameSettingsMenu`: options menu and settings controls

## Regression Rules

- Do not store per-frame values in Zustand.
- Use `useRef` for high-frequency mutable values such as player velocity, temporary vectors, or animation-loop data.
- Use selectors instead of reading the whole store in components.
- Keep gameplay transitions inside store actions when possible.
- Keep debug-only controls behind `?debug`.
- Add new state only when a real runtime feature needs it.
- Keep settings side effects, such as audio category updates, inside settings actions rather than spreading them across UI components.

## Next Steps

- Move broader mission orchestration into a clearer layer if intro, mission, dialogue, and cinematic branching grows.
