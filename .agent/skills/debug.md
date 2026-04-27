# Skill — Debug

## Activation

Append `?debug` to the URL:

```
http://localhost:5173?debug
```

The free debug camera is toggled from the debug panel, not mounted permanently.

## Debug singleton

```ts
// src/utils/debug/Debug.ts
import GUI from "lil-gui";

export class Debug {
  private static _instance: Debug | null = null;

  readonly active: boolean;
  gui: GUI | null = null;

  static getInstance(): Debug {
    if (!Debug._instance) Debug._instance = new Debug();
    return Debug._instance;
  }

  private constructor() {
    this.active = new URLSearchParams(window.location.search).has("debug");
    if (this.active) {
      this.gui = new GUI({ title: "La-Fabrik Debug" });
    }
  }

  destroy(): void {
    this.gui?.destroy();
    Debug._instance = null;
  }
}
```

## Adding debug controls

```ts
const debug = Debug.getInstance();

if (debug.active) {
  const folder = debug.gui!.addFolder("Lighting");
  folder.add(params, "intensity", 0, 5).name("Sun intensity");
  folder.addColor(params, "color").name("Sun color");
}
```

## r3f-perf (lazy loaded)

r3f-perf is loaded only in debug mode to avoid dependency issues in production:

```tsx
// src/utils/debug/DebugPerf.tsx
import { Suspense, lazy } from "react";
import { Debug } from "@/utils/debug/Debug";

const Perf = lazy(() => import("r3f-perf").then((m) => ({ default: m.Perf })));

export function DebugPerf() {
  const debug = Debug.getInstance();
  if (!debug.active) return null;

  return (
    <Suspense fallback={null}>
      <Perf position="top-left" />
    </Suspense>
  );
}
```

Usage in Canvas:

```tsx
<Canvas>
  {/* scene content */}
  <DebugPerf />
</Canvas>
```

## Rules

- All debug UI goes through `Debug.getInstance()` — never inline `if (isDev)` checks
- r3f-perf is always lazy-imported, never a hard dependency in scene components
- Debug folders should be organized by domain (Lighting, PostFX, Player, Zone)
- Debug panel must not affect production builds — it simply doesn't mount when `?debug` is absent
- Clean up debug folders in `destroy()` when relevant
