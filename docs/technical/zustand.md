# Zustand Game State

This document explains how Zustand is used in the current project.

## Why Zustand Exists Here

The project needs one shared source of truth for the player's progression through the experience.

The current progression is split into main states:

| Main state | Role                            |
| ---------- | ------------------------------- |
| `intro`    | Onboarding and opening sequence |
| `bike`     | E-bike repair sequence          |
| `pylone`   | Power grid sequence             |
| `ferme`    | Vertical farm sequence          |
| `outro`    | Ending sequence                 |

Each main state can also own smaller sub state, such as the current mission step, dialogue audio, or completion flags.

Zustand is useful because React and React Three Fiber components can subscribe only to the state slice they need. When that slice changes, only the subscribed components re-render.

## Store Location

The game progression store lives here:

```txt
src/managers/stores/useGameStore.ts
```

The store is placed under `src/managers/stores/` because it belongs to the gameplay orchestration layer, not to a specific visual component.

## Current Shape

The store exposes:

- `mainState`: the active game phase
- `intro`: intro-specific state
- `bike`: e-bike mission state
- `pylone`: power grid mission state
- `ferme`: farm mission state
- `outro`: ending state
- actions for direct updates and progression updates

The mission steps currently use this sequence:

```ts
"locked" | "waiting" | "inspect" | "scanning" | "repairing" | "done";
```

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

## Updating State

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

Direct setters are useful for debug panels, but production gameplay should prefer business actions such as `advanceGameState`, `completeBike`, or `completePylone`.

## World Integration

`src/world/GameStageContent.tsx` subscribes to `mainState` and mounts stage-specific content.

That means the scene can progressively move toward this pattern:

```tsx
switch (mainState) {
  case "intro":
    return <IntroContent />;
  case "bike":
    return <BikeContent />;
  case "pylone":
    return <PyloneContent />;
  case "ferme":
    return <FarmContent />;
  case "outro":
    return <OutroContent />;
}
```

In React Three Fiber, mounting and unmounting JSX controls what appears in the Three.js scene. When a state-specific component disappears from JSX, React removes it from the scene.

## UI Integration

`src/components/ui/GameUI.tsx` groups the HTML overlays used by the playable route.

Current overlays:

- `GameStateHUD`: debug-only progression panel shown with `?debug`
- `Crosshair`: player aiming helper
- `InteractPrompt`: interaction prompt

`src/pages/page.tsx` should stay thin and mount only the canvas and `GameUI`.

## Regression Rules

- Do not store per-frame values in Zustand.
- Use `useRef` for high-frequency mutable values such as player velocity, temporary vectors, or animation-loop data.
- Use selectors instead of reading the whole store in components.
- Keep gameplay transitions inside store actions when possible.
- Keep debug-only controls behind `?debug`.
- Add new state only when a real runtime feature needs it.

## Next Steps

The next natural step is to replace the temporary stage anchors in `GameStageContent` with real stage components, for example `IntroContent`, `BikeContent`, `PyloneContent`, `FermeContent`, and `OutroContent`.
