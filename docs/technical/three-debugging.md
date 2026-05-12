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
