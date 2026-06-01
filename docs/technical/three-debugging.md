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
mid-session even though the `Lighting` configuration ran to completion.

Root cause: the sun follows the camera (its world matrix is dirty every frame
via `updateMatrixWorld()` inside `Lighting.useFrame`). With `shadow.autoUpdate`
alone, three.js can skip the shadow map re-render on a frame where the matrix
update has happened but the renderer's internal dirty tracking does not pick
it up, leaving the shadow map stale or unrendered.

Fix in `src/world/Lighting.tsx`: explicit `sun.shadow.needsUpdate = true` in
two places, restoring the belt-and-suspenders pattern from `develop`:

- After `configureSunShadow(...)` in the mount `useEffect`.
- At the end of the `useFrame` block, right after `sun.updateMatrixWorld()`.

Mitigations also in place:

- Shadow config centralized in `src/data/world/lightingConfig.ts`
  (`bias=0`, `normalBias=0`, `cameraSize=95`).
- Late-suspension Suspense boundaries in `World.tsx` to prevent global scene
  remounts that would re-run shadow setup mid-load.
- `gl.shadowMap.needsUpdate = true` on `onCreated` and on
  `webglcontextrestored` in `src/pages/page.tsx`.

If the issue reproduces, capture `[diag]`-style logs from `useOctreeGraphNode`,
`Lighting`, and `GameMapCollision` to confirm there is no extra configuration
pass (which would indicate a remaining suspending hook outside the existing
Suspense boundaries).
