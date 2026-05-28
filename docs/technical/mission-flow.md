# Mission Flow

This document describes the mission intro and mission 2 prototype flow after it was merged into the current architecture.

## Source Of Truth

Mission flow state lives in the global game store:

```txt
src/managers/stores/useGameStore.ts
```

The store owns the `missionFlow` slice:

```ts
missionFlow: {
  activityCity: boolean;
  playerName: string;
  canMove: boolean;
  dialogMessage: string | null;
}
```

This keeps global gameplay state in Zustand instead of splitting it across a separate mission store or a gameplay manager.

## Managers Boundary

Managers stay responsible for local runtime services:

- `AudioManager` owns audio elements, audio pools, music playback, category volume, and stereo pan.
- `InteractionManager` owns transient focused/nearby/held interaction handles.

Mission progression is not owned by a manager. Components update the store through explicit actions such as `setIntroStep`, `setCanMove`, `showDialog`, and `hideDialog`.

## Runtime Components

- `src/components/game/GameFlow.tsx` reacts to intro state and triggers one-off side effects such as intro audio and movement unlocks.
- `src/components/zone/ZoneDetection.tsx` reads the camera position and moves the flow to a target step when the player enters a configured zone.
- `src/world/GameStageContent.tsx` mounts repair games and their mission-start triggers.
- `src/pages/page.tsx` mounts mission HTML overlays: `IntroUI`, `DialogMessage`, and subtitles.
- `src/world/player/PlayerController.tsx` reads `missionFlow.canMove` as an additional movement lock.

## Step Sequence

The prototype currently uses these steps:

```ts
"intro" |
  "start-intro" |
  "naming" |
  "bienvenue" |
  "star-move" |
  "mission2" |
  "searching" |
  "helped" |
  "manipulation" |
  "outOfFabrik";
```

These steps are mission-flow prototype states. They do not replace `mainState` or the repair mission step machine used by `RepairGame`.

## Zone Configuration

Zone triggers live in:

```txt
src/data/zones.ts
```

Each zone has an id, position, radius, height, and `targetStep`. `ZoneDetection` marks a zone as triggered after the first activation so the same zone does not replay its transition every frame.

## Rules

- Keep mission flow state in `useGameStore.missionFlow`.
- Do not reintroduce `GameStepManager` for global state transitions.
- Do not create a second Zustand store for mission flow unless the state becomes independent from game progression.
- Keep side effects such as audio playback in components or service managers, but keep the state transition itself in the store.
- Keep per-frame values such as camera position and zone distance checks out of Zustand.
