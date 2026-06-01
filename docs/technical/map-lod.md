# Map LOD System

This document describes the runtime LOD system used by the production map.

## Goal

The map now supports two visual versions for selected models:

- the regular model in `public/models/<name>/`
- the lighter model in `public/models/<name>-LOD/`

The runtime chooses between those paths from the active graphics preset. This keeps nearby objects visually richer while reducing the cost of distant objects.

## Graphics Presets

Presets are configured in:

```txt
src/data/world/graphicsConfig.ts
```

Current behavior:

| Preset   | Chunk load distance | Fog | LOD behavior                          |
| -------- | ------------------: | --- | ------------------------------------- |
| `low`    |                 10m | On  | Always use `*-LOD` models             |
| `medium` |                 20m | On  | Always use `*-LOD` models             |
| `high`   |                 35m | Off | Regular model up to 10m, then `*-LOD` |
| `ultra`  |                 50m | Off | Regular model up to 20m, then `*-LOD` |

The unload distance stays slightly larger than the load distance to avoid rapid mount/unmount flickering when the player stands near a boundary.

## Runtime Selection

LOD path mapping lives in:

```txt
src/data/world/mapLodConfig.ts
```

The main selector is `selectMapModelPathByDistance()`. It receives:

- the current camera distance
- the map model name
- the regular model path
- the active graphics preset

It returns either the regular path or the `*-LOD` path.

## Chunked Instanced Models

Repeated static assets are rendered through:

```txt
src/world/map-instancing/MapInstancingSystem.tsx
```

For each visible chunk, the system checks the nearest instance in that chunk. If the nearest instance is inside the high-detail threshold, the whole chunk uses the regular model. Otherwise, it uses the `*-LOD` model.

This is intentionally chunk-level LOD instead of per-instance LOD. It matches the existing chunk streaming architecture and avoids splitting every object into many tiny batches.

## Single And Generated Models

Single map nodes use:

```txt
src/hooks/world/useMapLodModelPath.ts
src/world/GameMap.tsx
```

Some named map objects are rendered through dedicated generated components instead of the generic `GameMap` path. Those components must call `useMapLodModelPath()` directly.

Current dedicated generated components with LOD support:

```txt
src/components/three/world/EcoleModel.tsx
src/components/three/world/LaFabrikMapModel.tsx
```

This matters for `lafabrik`: adding `public/models/lafabrik-LOD/` is not enough by itself. The component must also be connected to `useMapLodModelPath()`.

## Adding A New LOD Model

To add LOD support for a model:

1. Add the light model in `public/models/<name>-LOD/model.gltf`.
2. Keep the regular model in `public/models/<name>/model.glb` or `public/models/<name>/model.gltf`.
3. Add the mapping in `src/data/world/mapLodConfig.ts`.
4. If the model uses a dedicated component, call `useMapLodModelPath()` in that component.
5. Preload both paths when the component is dedicated and uses `useGLTF.preload()`.
6. Verify the GLTF/GLB references: buffers, textures, opacity maps, and relative paths.

## Current LOD Models

The current explicit LOD mappings are:

```txt
ebike
eolienne
pylone
boiteimmeuble
ecole
immeuble1
lafabrik
maison1
panneauaffichage
talkie
```

## Regression Risks

The most common failure modes are:

- the `*-LOD` folder exists but is missing from `mapLodConfig.ts`
- a dedicated generated component keeps a hardcoded model path
- GLTF references point to textures that were renamed during export
- a model is added to LOD config but does not spawn through `GameMap` or `MapInstancingSystem`

Before committing model changes, validate both the regular and LOD folders for missing GLTF refs.
