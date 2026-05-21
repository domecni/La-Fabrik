# Map Performance Notes

This document tracks the current map-rendering performance pass.

## Current Runtime Path

- `public/map.json` is the source of map transforms.
- `src/world/GameMap.tsx` renders regular visual map nodes.
- `src/world/vegetation/VegetationSystem.tsx` already instances dense vegetation.
- `src/world/map-instancing/MapInstancingSystem.tsx` instances selected repeated static map assets.
- `src/world/GameMapCollision.tsx` keeps terrain collision separate for the player octree.

## Main Bottlenecks Found

The most important signal is draw calls, not only triangle count.

| Model            | Instances | Meshes / primitives | Notes                                                            |
| ---------------- | --------: | ------------------: | ---------------------------------------------------------------- |
| `generateur`     |         3 |                3152 | Worst draw-call offender. Needs asset-side mesh merging.         |
| `lafabrik`       |         4 |                  56 | Moderate draw calls, heavy 2048 texture set.                     |
| `ecole`          |         1 |                 107 | One material but many primitives; should be merged.              |
| `fermeverticale` |         3 |                   1 | Geometry is fine; textures are large for the visible complexity. |

`generateur` is especially expensive because three visible instances can multiply thousands of primitives into thousands of draw calls. Instancing reduces repeated instance cost, but the source asset still needs a cleaner export.

## Current Code-Side Optimization

Repeated static assets are configured in:

```txt
src/world/map-instancing/mapInstancingConfig.ts
```

Those names are excluded from the regular `GameMap` clone path, then rendered by `MapInstancingSystem` with `THREE.InstancedMesh`.

This keeps the existing map authoring format while reducing repeated draw calls for selected assets.

## Asset-Side Follow-Up

Design/export should prioritize:

1. Merge `generateur` meshes from 3152 primitives to a small number of material groups.
2. Reduce `lafabrik` texture count and downscale flat/low-detail maps.
3. Merge `ecole` primitives because it uses a single material.
4. Prefer runtime `.glb` or compressed runtime textures when the pipeline supports it.

## Safety Rules

- Do not instance `terrain` for player collision without validating `Octree.fromGraphNode` support.
- Do not replace repair-game models with optimized map models unless repair node names are preserved.
- Dispose only GPU resources created locally. Do not dispose textures or geometries owned by `useGLTF`'s cache.
