# Scene Runtime And Loading

This document explains how the playable route boots the 3D world, loads the map, gates gameplay readiness, and spawns the player.

## Purpose

The playable scene has heavy asynchronous work: map JSON, GLTF models, collision meshes, octree construction, Rapier stage content, audio, dialogues, and the player controller.

The current runtime avoids spawning the player too early. That matters because the player controller needs a ready octree, and the repair game needs the production stage to be mounted before the user starts interacting with objects.

## Entry Flow

```txt
src/main.tsx
  -> src/App.tsx
    -> src/router.tsx
      -> src/pages/page.tsx
        -> HandTrackingProvider
        -> Canvas
          -> World
          -> DebugPerf
        -> GameUI
        -> SceneLoadingOverlay
```

`HomePage` owns the visible loading state and passes `onLoadingStateChange` down to `World`.

The loading progress in `HomePage` is monotonic:

- if the scene is already ready, a late loading event is ignored
- progress can only increase while the scene is booting

This prevents the overlay from jumping backward when nested loaders finish in a slightly different order.

## World Composition

`src/world/World.tsx` is the main scene composer.

Always-mounted systems:

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
- `GameCinematics`, currently only in `mainState === "outro"`
- `Player`

Debug physics scene systems:

- `TestMap`
- `Player`

## Loading State Owner

The world loading gate lives in:

```txt
src/hooks/world/useWorldSceneLoading.ts
```

It tracks:

- `octree`: collision octree built from collision source meshes
- `gameMapLoaded`: map data and visible map nodes settled
- `gameStageLoaded`: Rapier gameplay stage mounted
- `showGameStage`: true when the map is ready enough to mount gameplay content
- `gameplayReady`: true when map, stage, and octree are all ready

The final game-scene readiness condition is:

```ts
showGameStage && gameStageLoaded && octree !== null;
```

The debug physics scene is ready when:

```ts
octree !== null;
```

## Map Loading

Map loading starts in:

```txt
src/world/GameMap.tsx
```

`GameMap` calls:

```txt
src/utils/map/loadMapSceneData.ts
```

That utility:

1. fetches `/map.json`
2. validates it as a `MapNode[]`
3. deduplicates model names
4. checks `public/models/{name}/model.glb`
5. falls back to `public/models/{name}/model.gltf`
6. returns `{ mapNodes, models }`

If a model is missing, the map still renders a fallback cube. This keeps the scene inspectable while assets are incomplete.

## Model Settling

`GameMap` counts settled map nodes.

A node settles when:

- it has no model and renders a fallback cube
- its GLTF model instance has mounted
- a model error boundary catches a load/render error and renders fallback

This prevents `GameMapCollision` from building collision before the visible map has reached a stable state.

## Collision Loading

Collision loading lives in:

```txt
src/world/GameMapCollision.tsx
```

The current production collision source is intentionally small:

```ts
const MAP_COLLISION_NODE_NAMES = new Set(["terrain"]);
```

Only matching map nodes are loaded into the invisible collision group. Then:

```txt
src/hooks/three/useOctreeGraphNode.ts
```

builds the Three.js octree from that group and sends it back through `onOctreeReady`.

This is a performance choice. Building a player collision octree from every visible prop can overload the browser and make the scene fragile.

## Stage Loading

Production gameplay content is mounted by:

```txt
src/world/GameStageContent.tsx
```

`World` wraps it in Rapier `Physics`, but only after `GameMap` reports loaded:

```tsx
{
  showGameStage ? (
    <Physics>
      <GameStageLoaded onLoaded={handleGameStageLoaded} />
      <GameStageContent />
    </Physics>
  ) : null;
}
```

`GameStageLoaded` is a tiny component that calls `handleGameStageLoaded()` after mount. It gives the loading hook a clear signal that the Rapier stage has entered the scene graph.

## Player Spawn Gate

The player is spawned only when the active camera mode is not debug and the active scene is ready.

```ts
const spawnPlayer =
  cameraMode !== "debug" &&
  (sceneMode === "game" ? gameplayReady : octree !== null);
```

This avoids two common bugs:

- the player starts falling or clipping before collision is ready
- gameplay starts while the map/stage is still mounting

The production player spawn uses:

```txt
PLAYER_SPAWN_POSITION_GAME
```

The debug physics scene uses:

```txt
PLAYER_SPAWN_POSITION_PHYSICS
```

## Audio And Narrative Mounting

`GameMusic`, `GameDialogues`, and `Player` mount together after `spawnPlayer` is true.

This means background music and global dialogue timecode processing do not start while the loading overlay is still preparing the scene.

`GameCinematics` is currently gated further:

```tsx
{
  mainState === "outro" ? <GameCinematics /> : null;
}
```

So cinematic playback is part of the outro path today, not a global always-on system.

## Debug Modes

Debug is enabled with:

```txt
http://localhost:5173/?debug
```

`src/utils/debug/Debug.ts` provides:

- camera mode: `player` or `debug`
- scene mode: `game` or `physics`
- R3F perf toggle
- debug overlay toggle
- hand-tracking source
- hand SVG visibility
- interaction sphere visibility

Important current detail: the older boot flags such as `noMusic`, `noCinematics`, `noMap`, `noDialogues`, `noOctree`, and `noPlayer` are not part of the current `develop` runtime path.

## Why This Architecture Works

The runtime uses React composition as the scene orchestration layer:

- if JSX is mounted, the Three/Rapier object exists
- if JSX is unmounted, the object leaves the scene
- loading gates are explicit booleans instead of hidden timing assumptions

This keeps the prototype understandable while still preventing expensive systems from starting too early.

## Risks And Watch Points

- Loading progress is manually estimated, not measured from every asset byte.
- The production collision source is currently only `terrain`; extra collision needs explicit lightweight nodes.
- Rapier gameplay physics and player octree collision are separate systems and can diverge if future features assume they are the same world.
- `GameCinematics` is not globally mounted anymore; docs or tests that expect intro cinematics to auto-run should be updated before relying on that path.
- Scene readiness is stored in React state, so remounting the route restarts the loading flow.
