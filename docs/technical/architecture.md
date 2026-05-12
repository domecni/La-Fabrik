# Current Architecture

This document describes the code that exists today in the repository.

## Runtime Structure

- `src/main.tsx` mounts React in `StrictMode`.
- `src/App.tsx` mounts TanStack `RouterProvider`.
- `src/router.tsx` declares `/`, `/editor`, and `/docs`.
- `src/pages/page.tsx` composes the playable route with `HandTrackingProvider`, React Three Fiber `Canvas`, `World`, `DebugPerf`, `GameUI`, and `SceneLoadingOverlay`.
- `src/pages/editor/page.tsx` composes the local editor route.
- `src/components/docs/DocsLayout.tsx` composes the in-app documentation route.

Detailed runtime-loading notes live in `docs/technical/scene-runtime.md`.

## World Composition

`src/world/World.tsx` is the main 3D scene composer.

Always-mounted scene systems:

- `Environment`
- `Lighting`
- debug helpers when `?debug` is active
- optional hand-tracking glove overlays
- optional debug camera controls

Game scene systems:

- `GameMap`
- Rapier `Physics` wrapping `GameStageContent`
- `GameMusic`
- `GameDialogues`
- `GameCinematics` only while `mainState === "outro"`
- `Player` after gameplay is ready

Debug physics scene systems:

- `TestMap`
- `Player` after the debug octree is ready

Debug scene and camera mode are controlled by `src/utils/debug/Debug.ts` and enabled with `?debug`.

## Scene Loading

The production game scene is considered ready only after:

- map data and visible map nodes have settled
- collision source models have settled
- the player octree exists
- the Rapier gameplay stage has mounted

The player is not spawned until that readiness gate is satisfied. This avoids starting player movement, music, dialogue timing, and interactions while the map/stage is still loading.

## Physics Boundaries

The project currently uses two collision systems with separate responsibilities:

- Player movement uses a Three.js `Capsule` and an `Octree`.
- Gameplay objects use Rapier rigid bodies and colliders.

`GameMapCollision` builds the player octree from explicit collision nodes. It currently uses only the `terrain` node.

`GameStageContent` is wrapped in Rapier `Physics` so repair cases, triggers, and grabbable parts can use physics without migrating the player controller to Rapier.

This split is deliberate. It keeps the player controller simple while still enabling physical manipulation for gameplay objects.

## Gameplay Layer

The current core gameplay feature is the reusable repair game.

Production placements live in:

```txt
src/world/GameStageContent.tsx
```

The reusable flow lives in:

```txt
src/components/three/gameplay/RepairGame.tsx
```

Mission-specific data lives in:

```txt
src/data/gameplay/repairMissions.ts
```

The repair game supports:

```txt
locked -> waiting -> inspected -> fragmented -> scanning -> repairing -> reassembling -> done
```

Detailed repair-game implementation notes live in `docs/technical/repair-game.md`.

## State Management

Durable progression state lives in:

```txt
src/managers/stores/useGameStore.ts
```

It owns:

- `mainState`
- intro state
- `bike`, `pylone`, and `ferme` mission state
- outro state
- `isCinematicPlaying`
- progression actions
- generic mission actions

Settings state lives in:

```txt
src/managers/stores/useSettingsStore.ts
```

Subtitle display state lives in:

```txt
src/managers/stores/useSubtitleStore.ts
```

Detailed Zustand notes live in `docs/technical/zustand.md`.

## Managers

Managers are used for imperative runtime systems that own browser or frame-adjacent objects.

Current managers:

- `src/managers/AudioManager.ts`
- `src/managers/InteractionManager.ts`

`AudioManager` owns `HTMLAudioElement` instances, music playback, one-shot pools, category volumes, and optional stereo panning.

`InteractionManager` owns focused/nearby/holding state for trigger and grab interactions and exposes a snapshot through `useSyncExternalStore`.

## Interaction Model

Core interaction files:

- `src/components/three/interaction/InteractableObject.tsx`
- `src/components/three/interaction/TriggerObject.tsx`
- `src/components/three/interaction/GrabbableObject.tsx`
- `src/hooks/interaction/useInteraction.ts`
- `src/components/ui/InteractPrompt.tsx`

The player controller bridges raw input to semantic interaction actions:

- `E` triggers focused trigger objects
- primary mouse button grabs focused grabbable objects
- hand tracking can grab hand-controlled grabbable objects

Detailed interaction notes live in `docs/technical/interaction.md`.

## Audio, Dialogue, And Subtitles

Audio is split into:

- `music`
- `sfx`
- `dialogue`

Runtime dialogue data lives under:

```txt
public/sounds/dialogue/
```

The current subtitle model is one SRT file per voice and language. A dialogue entry references one cue by `subtitleCueIndex`.

`src/utils/dialogues/playDialogue.ts` queues dialogue playback and synchronizes the active subtitle cue against the playing audio element.

Detailed audio notes live in `docs/technical/audio.md`.

## Cinematics

Runtime cinematic data lives in:

```txt
public/cinematics.json
```

Cinematics support camera keyframes, GSAP timelines, optional dialogue cues, and `isCinematicPlaying` input locking. Current world integration mounts `GameCinematics` only during the outro state.

## Hand Tracking

Hand tracking can use:

- local Python backend over WebSocket
- browser-side MediaPipe through `@mediapipe/tasks-vision`

Important files:

- `src/providers/gameplay/HandTrackingProvider.tsx`
- `src/hooks/handTracking/useRemoteHandTracking.ts`
- `src/hooks/handTracking/useBrowserHandTracking.ts`
- `src/hooks/handTracking/useBothFistsHold.ts`
- `src/components/three/handTracking/HandTrackingGlove.tsx`
- `backend/main.py`

Hand tracking is activated lazily. In production it is enabled during repair steps that need hand input. In debug physics mode it is enabled when interaction context makes hand input useful.

Detailed hand-tracking notes live in `docs/technical/hand-tracking.md`.

## Editor System

The editor route is:

```txt
/editor
```

Important editor files:

- `src/pages/editor/page.tsx`
- `src/components/editor/EditorControls.tsx`
- `src/components/editor/scene/EditorScene.tsx`
- `src/components/editor/scene/EditorMap.tsx`
- `src/components/editor/EditorDialogueManifestPanel.tsx`
- `src/components/editor/EditorCinematicManifestPanel.tsx`
- `src/components/editor/EditorSrtPanel.tsx`
- `src/hooks/editor/useEditorSceneData.ts`
- `src/hooks/editor/useEditorHistory.ts`
- `src/controls/editor/FlyController.tsx`

The editor shares `MapNode` data with the runtime map loader.

Local save endpoints live in `vite.config.ts`:

- `POST /api/save-map`
- `POST /api/save-srt`
- `GET /api/validate-dialogues`
- `POST /api/save-dialogues`
- `POST /api/save-cinematics`

These are Vite dev-server helpers, not production backend APIs.

Detailed editor notes live in `docs/technical/editor.md`.

## Documentation System

The docs route uses:

- `src/components/docs/DocsLayout.tsx`
- `src/components/docs/DocsDocument.tsx`
- `src/data/docs/docsSections.ts`
- `src/routes/DocsRoute.tsx`
- `src/pages/docs/**/page.tsx`

Docs pages import Markdown files with `?raw` and render them through `react-markdown` plus `remark-gfm`.

## 3D Component Domains

`src/components/three/` is organized by domain:

- `gameplay`: repair-game flow and repair components
- `handTracking`: glove overlays
- `interaction`: trigger/grab/focus wrappers
- `models`: animated, simple, and explodable model helpers
- `world`: world/environment objects

## Map Data

Runtime map data:

```txt
public/map.json
```

Expected shape:

```ts
interface MapNode {
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}
```

Each `name` maps to:

```txt
public/models/{name}/model.glb
public/models/{name}/model.gltf
```

## Current Limitations

- The repository is still a prototype.
- There is no central production `GameManager`.
- The repair game is implemented, but broader mission orchestration is still light.
- `useRepairMovementLocked()` currently returns `false`, so repair movement lock is disabled even though the rule and UI component exist.
- The repair-runtime setting is stored in settings but not consumed by the repair-game implementation.
- Player collision and Rapier gameplay physics are separate systems.
- Editor persistence is local development tooling only.
- Debug systems are still part of active scene composition and should remain easy to identify.
