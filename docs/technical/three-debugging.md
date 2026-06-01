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

## Shadow rendering intermittence (open investigation)

Shadows occasionally fail to render on initial load even though the
`Lighting` configuration runs to completion (verified through diagnostic logs).
The issue is not deterministic across runs with identical config. Suspected
contributors:

- WebGL context restoration timing (`webglcontextrestored` rebinds shadow map
  state in `src/pages/page.tsx`).
- First-frame shadow map being rendered before any mesh has its
  `castShadow`/`receiveShadow` flag set; `autoUpdate=true` should fix it on the
  next frame, but a single dropped frame is still visible at very first paint.
- HMR/state interactions in dev mode that do not occur in production builds.

Mitigations already applied:

- Shadow config centralized in `src/data/world/lightingConfig.ts`
  (`bias=0`, `normalBias=0`, `cameraSize=95`, matching the historically working
  values from `develop`).
- Late-suspension Suspense boundaries in `World.tsx` to prevent global scene
  remounts that would re-run shadow setup mid-load.

If the issue reproduces in production, capture a screenshot plus the
`[diag]`-style logs from `useOctreeGraphNode`, `Lighting`, and `GameMapCollision`
to confirm whether the third configuration pass is happening (which would
indicate a remaining suspending hook outside the existing Suspense boundaries).
