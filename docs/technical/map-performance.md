# Map Performance Notes

This document tracks the current map-rendering performance pass.

## Current Runtime Path

- `public/map.json` is the source of map transforms.
- `src/world/GameMap.tsx` renders regular visual map nodes.
- `src/world/vegetation/VegetationSystem.tsx` already instances dense vegetation.
- `src/world/map-instancing/MapInstancingSystem.tsx` instances selected repeated static map assets.
- `src/world/GameMapCollision.tsx` keeps terrain collision separate for the player octree.

## Draw-Call Bottlenecks Found

The first performance bottleneck was draw calls. Some assets were exported as many small GLTF primitives even when they used only a few materials.

| Model            | Instances | Meshes / primitives | Notes                                                                                |
| ---------------- | --------: | ------------------: | ------------------------------------------------------------------------------------ |
| `generateur`     |         3 |                3152 | Worst draw-call offender. Needs asset-side mesh merging.                             |
| `lafabrik`       |         4 |                 474 | High primitive count; current HD GLB has embedded geometry and no external textures. |
| `ecole`          |         1 |                 107 | One material but many primitives; should be merged.                                  |
| `fermeverticale` |         3 |                   1 | Geometry is fine; textures are large for the visible complexity.                     |

`generateur` was especially expensive because three visible instances could multiply thousands of primitives into thousands of draw calls. Instancing reduces repeated instance cost, but the source asset still needs a cleaner export.

## Runtime Merge Pass

`InstancedMapAsset` now groups source meshes by material and compatible geometry attributes before creating `THREE.InstancedMesh` objects. This reduces the runtime draw groups even when the source GLTF is exported as many small meshes.

Estimated source primitive count versus runtime merged groups:

| Model        | Source primitives | Runtime merged groups |
| ------------ | ----------------: | --------------------: |
| `generateur` |              3152 |                     8 |
| `ecole`      |               107 |                     2 |
| `eolienne`   |               118 |                     8 |
| `lafabrik`   |               474 |                   ~77 |

This is a code-side safety net, not a replacement for clean asset exports. Clean GLB exports with merged meshes and fewer textures remain the preferred long-term path.

## Current Triangle Bottleneck

After the runtime merge pass, draw calls can drop dramatically, but FPS can still stay low because the scene now remains triangle-bound. A debug capture after the merge showed roughly:

```txt
138 draw calls
~69.6M triangles
~10 FPS
```

That means the renderer is no longer mostly blocked by draw-call submission. It is mostly drawing too many visible triangles.

Estimated triangle contribution from `map.json` instance counts:

| Model               | Instances | Triangles each | Estimated total triangles |
| ------------------- | --------: | -------------: | ------------------------: |
| `buisson`           |       646 |         37 500 |                    ~24.2M |
| `champdesoja`       |      1181 |         16 268 |                    ~19.2M |
| `arbre`             |       291 |         38 906 |                    ~11.3M |
| `champdeble`        |      1307 |          6 260 |                     ~8.2M |
| `champsdetournesol` |      1163 |          3 264 |                     ~3.8M |
| `sapin`             |        93 |         23 972 |                     ~2.2M |

These vegetation and crop assets account for almost all of the current `~69M` triangle count. By comparison, the previously suspicious static buildings are much smaller in triangle cost:

| Model            | Estimated total triangles |
| ---------------- | ------------------------: |
| `generateur`     |                     ~123k |
| `lafabrik`       |                     ~124k |
| `ecole`          |                       ~5k |
| `fermeverticale` |                       ~1k |

`InstancedMesh` reduces draw calls, but it does not reduce triangle count. If 646 bushes each contain 37 500 triangles, the GPU still has to draw about 24 million bush triangles when those instances are visible.

## Debug Performance Controls

The debug-only performance folder can isolate model families when `?debug` is enabled.

Proposed controls:

```txt
Performance / Map
- vegetation
- crops
- trees
- buildings
- landmarks
- props
- terrain
- sky
```

Useful per-model toggles:

```txt
buisson
arbre
sapin
champdeble
champdesoja
champsdetournesol
fermeverticale
lafabrik
immeuble1
eolienne
pylone
```

The purpose is diagnostic, not final gameplay behavior. The expected workflow is:

1. Open `/?debug` with R3F perf enabled.
2. Disable one family or model type.
3. Watch `triangles`, `calls`, and FPS.
4. Identify which model groups need LOD, density reduction, or asset re-export.

Recommended implementation files:

```txt
src/managers/stores/useMapPerformanceStore.ts
src/hooks/debug/useMapPerformanceDebug.ts
src/world/vegetation/VegetationSystem.tsx
src/world/map-instancing/MapInstancingSystem.tsx
src/world/GameMap.tsx
```

The store should stay runtime/debug-only. It should not change persisted production map data.

## Triangle-Reduction Follow-Up

Once the expensive model families are isolated, the real triangle fixes are:

1. Lower-poly vegetation and crop exports.
2. LOD variants for trees, bushes, and crop fields.
3. Distance-based culling for vegetation/crop instances.
4. Chunked instancing so Three.js can frustum-cull groups instead of one huge global `InstancedMesh`.
5. Billboard/impostor versions for far vegetation.

Chunked instancing is especially important. A single `InstancedMesh` containing every bush has one global bounding sphere. If that bounding sphere is visible, Three.js may keep the whole batch visible. Splitting instances into grid chunks allows entire offscreen chunks to be skipped.

## Player-Only Vegetation Streaming

The first distance-streaming pass is intentionally limited to vegetation and crop instances:

- `arbre`
- `sapin`
- `buisson`
- `champdeble`
- `champdesoja`
- `champsdetournesol`

The behavior is configured in:

```txt
src/data/world/fogConfig.ts
```

Current runtime values:

```txt
chunkSize: 35
low load/unload radius: 10m / 18m
medium load/unload radius: 20m / 30m
high load/unload radius: 35m / 45m
ultra load/unload radius: 50m / 65m
updateInterval: 250ms
fog near: 30
fog far: 45
```

The streaming and fog are scoped to the production game scene with the player camera only:

```txt
sceneMode === "game" && cameraMode === "player"
```

This matters for debugging. In debug camera mode there is no fog and no distance streaming, so the developer can inspect the full map freely. In player mode, chunks mount and unmount around the camera to reduce visible triangle count while fog hides vegetation pop-in.

Chunk cleanup is handled through React unmounting. `VegetationSystem` removes chunks from the tree, and `InstancedVegetation` removes its `THREE.InstancedMesh` objects from the group while disposing the locally created merged geometries/material clones in its own cleanup path.

## Runtime Texture Filtering

Loaded GLTF textures are normalized in code through:

```txt
src/utils/three/optimizeGLTFScene.ts
```

The runtime pass applies conservative texture filtering:

1. Cap anisotropy to a small value.
2. Enable mipmap generation for regular PNG/JPG/WebP textures.
3. Use trilinear mipmap filtering for minification.
4. Keep existing opacity/alpha material mapping intact.

This mirrors the intent of the designer upload pipeline without rewriting model files at runtime. The sibling `upload-GLTF` project already has the stronger asset-side path: Blender GLB export with Draco, texture resizing, KTX2 generation with mipmaps, WebP fallback, and GLTF JSON URI/extension rewriting for `KHR_texture_basisu`.

Runtime texture filtering improves distant texture stability and GPU sampling behavior, but it does not reduce mesh triangle count. Triangle reduction still comes from streaming, distance unloading, or optimized source assets.

## Terrain-Snapped Map Placement

Map object heights are corrected at runtime through:

```txt
src/hooks/three/useTerrainHeight.ts
```

The terrain raycast is not done every frame. The terrain mesh list is built from the cached terrain GLTF, then each model or instance computes its snapped `y` when it is mounted or when its instance data changes.

Applied paths:

1. Regular `GameMap` model instances.
2. Generated static map models.
3. Instanced static map assets.
4. Vegetation and crop chunks.

Only the `y` coordinate is replaced. `x`, `z`, and rotation stay from `map.json`. Runtime scale is also normalized when a static map node has a non-uniform scale, which prevents exported values like `[1, 2, 1]` from stretching or shrinking a map model unexpectedly.

## Current Code-Side Optimization

Repeated static assets are configured in:

```txt
src/world/map-instancing/mapInstancingConfig.ts
```

Those names are excluded from the regular `GameMap` clone path, then rendered by `MapInstancingSystem` with merged `THREE.InstancedMesh` batches.

This keeps the existing map authoring format while reducing repeated draw calls for selected assets.

## Generated R3F Model Path

Unique static map assets can use explicit R3F components instead of the generic cloned GLTF path. This follows the same intent as `gltfjsx`: expose the model as a React component, then keep control over mesh/material setup in code.

Current generated map-model entry point:

```txt
src/world/map-generated/GeneratedMapNodeInstance.tsx
```

Current generated model component:

```txt
src/components/three/world/EcoleModel.tsx
src/components/three/world/LafabrikModel.tsx
src/components/three/world/FermeVerticaleModel.tsx
src/components/three/world/GenerateurModel.tsx
```

`ecole`, `lafabrik`, `fermeverticale`, and `generateur` use this path. Their components share the same merged static model renderer, which groups compatible geometry by material before mounting meshes.

This path should be used selectively. It improves control and can remove clone overhead, but it does not reduce source triangle count by itself.

## Asset-Side Follow-Up

Design/export should prioritize:

1. Produce lower-poly `buisson`, `arbre`, `sapin`, and crop assets.
2. Add LOD or billboard variants for far vegetation.
3. Merge `generateur` meshes from 3152 primitives to a small number of material groups.
4. Keep `lafabrik` exports texture-light, and merge repeated material primitives where possible.
5. Merge `ecole` primitives because it uses a single material.
6. Prefer runtime `.glb` or compressed runtime textures when the pipeline supports it.

## Safety Rules

- Do not instance `terrain` for player collision without validating `Octree.fromGraphNode` support.
- Do not replace repair-game models with optimized map models unless repair node names are preserved.
- Dispose only GPU resources created locally. Do not dispose textures or geometries owned by `useGLTF`'s cache.
