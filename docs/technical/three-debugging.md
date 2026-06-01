# Three Debugging

Use the dedicated debug mode when you need Chrome DevTools to step into Three.js internals.

```bash
npm run dev:three-debug
```

This mode aliases `three` to `node_modules/three/src/Three.js` and disables Vite dependency pre-bundling for Three. In DevTools, open `node_modules/three/src/renderers/WebGLRenderer.js` and place a breakpoint inside:

```js
this.render = function (scene, camera) {
```

Reload the page or trigger a frame. When the breakpoint hits, inspect `scene`, `camera`, renderer state, visible objects, matrices, materials, and `this.info.render`.

If DevTools still opens a bundled file, stop the dev server, clear Vite's cached deps, and restart:

```bash
rm -rf node_modules/.vite
npm run dev:three-debug
```

## Visual debug toggles

The `Debug` folder of the runtime debug GUI exposes inspection toggles backed by
`src/managers/stores/useDebugVisualsStore.ts`:

- **Show Player Model** — renders the main character GLTF in front of the
  current camera (`src/components/debug/DebugPlayerModel.tsx`). The model is
  positioned in camera-local space so it stays visible regardless of pitch.
- **Show Octree** — overlays the collision octree as colored line segments,
  one wireframe per spatial cell (`src/components/debug/DebugOctreeVisualization.tsx`).
  Cells are colored by depth. Use it to inspect collision precision around
  doorways or passages.
- **Octree Max Depth** — caps how deep the octree visualization recurses
  (default 6). Increase to see leaf-level subdivisions; decrease to keep the
  scene readable when the tree is large.

The octree visualization reads the live `Octree` instance from `World`. The
mesh uses `depthTest: false` and a high `renderOrder`, so cells stay visible
through opaque geometry.

## Shadow rendering intermittence

Shadows occasionally failed to render on initial load and could disappear
mid-session even though the `Lighting` configuration ran to completion. The
fix has two layers:

### Per-frame refresh (steady state)

The sun follows the camera, so its world matrix is dirty every frame. With
`shadow.autoUpdate` alone, three.js can skip the shadow map re-render on a
frame where the matrix update has happened but the renderer's internal dirty
tracking does not pick it up. To prevent that, `Lighting.useFrame` sets
`sun.shadow.needsUpdate = true` after the per-frame matrix updates. Shadow
config is centralized in `src/data/world/lightingConfig.ts` (`bias=0`,
`normalBias=0`, `cameraSize=95`).

### Mount-time shadow map reallocation (`useShadowMapWarmup`)

The merged static map and other GLTFs mount imperatively after `Lighting`,
so the shadow render target ends up linked to a renderer state that pre-dates
the final scene. Materials compiled at that point bake a "no shadow map"
permutation into their shader program and silently fail to render shadows
until a WebGL context-restore cycle (the kind triggered by Chrome DevTools
in `?debug` runs) reallocates everything.

`src/hooks/three/useShadowMapWarmup.ts` replays that cycle programmatically
without the cost of a full context loss. It runs a `useFrame` watchdog that
samples the scene mesh count every 6 frames; once the count has been stable
for ~1 s (or after a 5 s safety cap), it:

1. Disposes the directional light shadow map and nulls it. three.js
   reallocates the render target on the next render at the configured
   `mapSize`.
2. Marks every material's `needsUpdate = true`, forcing a shader recompile
   that rebinds every program to the freshly created shadow sampler.
3. Forces a single shadow pass and invalidates the renderer.

The watchdog runs once per mount and adds a single traversal every 6 frames
during the warmup window, after which it self-terminates.
