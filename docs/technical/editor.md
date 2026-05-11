# Editor Technical Notes

This document describes the map editor that exists in the current codebase.

## Purpose

The editor is a React route used to inspect and adjust the `public/map.json` scene data from inside the La-Fabrik app. It shares the same `MapNode` data format as the game scene and uses React Three Fiber for rendering.

## Routing

- `/` renders the playable La-Fabrik scene.
- `/editor` renders the map editor.
- `src/App.tsx` mounts TanStack Router through `RouterProvider`.
- `src/router.tsx` defines the `/editor` route and imports `EditorPage` from `src/pages/editor/page.tsx`.

## File Structure

```txt
src/
├── pages/
│   └── editor/
│       └── page.tsx
├── components/
│   └── editor/
│       ├── EditorControls.tsx
│       ├── EditorCinematicManifestPanel.tsx
│       ├── EditorDialogueManifestPanel.tsx
│       ├── EditorSrtPanel.tsx
│       └── scene/
│           ├── EditorMap.tsx
│           └── EditorScene.tsx
├── controls/
│   └── editor/
│       └── FlyController.tsx
├── hooks/
│   └── editor/
│       ├── useEditorHistory.ts
│       └── useEditorSceneData.ts
├── types/
│   └── editor/
│       └── editor.ts
└── utils/
    ├── dialogues/
    │   └── loadDialogueManifest.ts
    ├── editor/
    │   └── loadEditorScene.ts
    ├── map/
    │   └── loadMapSceneData.ts
    └── subtitles/
        └── parseSrt.ts
```

## Responsibilities

`src/pages/editor/page.tsx` is the route-level composition component. It owns route-specific state such as selected object, hovered object, transform mode, and player-mode toggle.

`src/hooks/editor/useEditorSceneData.ts` loads the default map data and handles folder uploads.

`src/hooks/editor/useEditorHistory.ts` owns editor undo and redo history.

`src/components/editor/scene/EditorScene.tsx` composes the editor canvas scene, camera controls, lights, keyboard shortcuts, and `EditorMap`.

`src/components/editor/scene/EditorMap.tsx` renders map nodes, fallback cubes, selection highlighting, and transform controls.

`src/components/editor/EditorControls.tsx` renders the HTML control panel outside the canvas.

`src/components/editor/EditorDialogueManifestPanel.tsx` renders the dialogue manifest editor. It loads `dialogues.json`, edits dialogue entries, previews selected dialogue playback, creates missing French SRT cues, and saves the manifest through a dev-server endpoint.

`src/components/editor/EditorCinematicManifestPanel.tsx` renders the cinematic manifest editor. It loads `cinematics.json`, edits camera keyframes and dialogue cues, previews selected cinematics in the editor canvas, and saves the manifest through a dev-server endpoint.

`src/components/editor/EditorSrtPanel.tsx` renders the dialogue subtitle editor inside the control panel. It loads the dialogue manifest, loads one SRT file per voice/language, validates cue structure, previews dialogue audio, and can save SRT files through a dev-server endpoint.

`src/controls/editor/FlyController.tsx` provides editor movement controls for player-style navigation.

`src/utils/map/loadMapSceneData.ts` is shared by the game map and editor. It loads `/map.json` and resolves available `public/models/{name}/model.glb` files first, then falls back to `public/models/{name}/model.gltf`.

`src/utils/editor/loadEditorScene.ts` contains editor-only upload handling for user-selected folders.

## Data Format

The shared editor type lives in `src/types/editor/editor.ts`.

```ts
interface MapNode {
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}
```

`public/map.json` is expected to be a `MapNode[]`.

```json
[
  {
    "name": "pylone",
    "type": "Mesh",
    "position": [0, 5, 0],
    "rotation": [0, 1.57, 0],
    "scale": [1, 1, 1]
  }
]
```

Each node `name` maps to a model folder:

```txt
public/
├── map.json
└── models/
    └── pylone/
        └── model.glb
```

If `model.glb` and `model.gltf` are both missing, the editor renders a fallback cube so the node can still be selected and transformed.

## Editor Flow

1. `EditorPage` mounts on `/editor`.
2. `useEditorSceneData` calls `loadMapSceneData()`.
3. `loadMapSceneData()` loads `/map.json` and available model URLs.
4. If `/map.json` is missing, the page displays a folder-upload flow.
5. `EditorScene` renders the grid, lights, camera controls, and map nodes.
6. `EditorControls` exposes transform mode, history actions, export, save, and selection info.

## Controls

- Click: select a node.
- `Esc`: clear selection.
- `T`: translate mode.
- `R`: rotate mode.
- `S`: scale mode.
- `Ctrl+Z` or `Cmd+Z`: undo.
- `Ctrl+Y` or `Cmd+Y`: redo.
- `WASD`, `ZQSD`, or arrow keys: move in player-controller mode.
- `Space`: move upward in player-controller mode.
- `Shift`: move downward in player-controller mode.

## Saving And Exporting

The editor supports two output paths:

- Export JSON downloads the current `MapNode[]` as `map.json`.
- Save to Server posts the current `MapNode[]` to `/api/save-map`.

The dev-only `/api/save-map` endpoint is implemented by the Vite plugin in `vite.config.ts`. It writes to `public/map.json` and enforces a maximum payload size.

## Dialogue SRT Editing

Dialogue subtitle editing is part of the `/editor` side panel.

Runtime dialogue files are grouped under `public/sounds/dialogue/`:

```txt
public/
└── sounds/
    └── dialogue/
        ├── dialogues.json
        └── subtitles/
            ├── fr/
            │   ├── narrateur.srt
            │   ├── fermier.srt
            │   └── electricienne.srt
            └── en/
                └── ...
```

The current model is one SRT file per voice and language. A dialogue entry references the cue it needs through `subtitleCueIndex`; it does not own a dedicated SRT file.

`EditorSrtPanel` uses:

- `loadDialogueManifest()` to read `/sounds/dialogue/dialogues.json`
- `parseSrt()` to validate local textarea content and find active cues during audio preview
- `/api/save-srt` to write edited SRT files during local development
- `/api/validate-dialogues` to validate the manifest, linked audio, French SRT files, and referenced cue indexes

SRT timecodes are relative to the dialogue audio file being previewed, not to the global game timeline.

Missing English SRT files are warnings, not errors, because runtime loading falls back to French subtitles when the selected language is not available. Keep this behavior until the English translation workflow is ready.

## Dialogue Manifest Editing

`EditorDialogueManifestPanel` edits `public/sounds/dialogue/dialogues.json` in memory and persists it through `/api/save-dialogues`.

The panel supports:

- adding a dialogue entry
- deleting a dialogue entry
- editing `id`, `voice`, `audio`, `subtitleCueIndex`, and optional `timecode`
- previewing the selected dialogue through `playDialogueById()`
- creating a missing French SRT cue through `/api/save-srt`

When a dialogue is added, the editor computes the next `subtitleCueIndex` for the selected voice from the manifest. The generated SRT cue is a valid placeholder block and should be edited later in the SRT panel.

`/api/save-dialogues` is implemented in `vite.config.ts`. It validates manifest shape before writing to `public/sounds/dialogue/dialogues.json`.

## Cinematic Manifest Editing

`EditorCinematicManifestPanel` edits `public/cinematics.json` in memory and persists it through `/api/save-cinematics`.

The manifest shape is:

```ts
interface CinematicDefinition {
  id: string;
  timecode?: number;
  cameraKeyframes: CinematicCameraKeyframe[];
  dialogueCues?: CinematicDialogueCue[];
}
```

`cameraKeyframes` are relative to the cinematic start. At least two keyframes are required and keyframe times must increase.

`dialogueCues` are also relative to the cinematic start and reference dialogue IDs from `dialogues.json`. They are used by `GameCinematics` to synchronize dialogue playback with camera timelines. A dialogue synchronized this way should not also define a global `timecode` in `dialogues.json`.

The editor preview sends the selected `CinematicDefinition` to `EditorScene`, where GSAP animates the current editor camera. Orbit and fly controls are disabled during preview.

`/api/save-cinematics` is implemented in `vite.config.ts`. It validates manifest shape before writing to `public/cinematics.json`.

## Styling

Editor styles are in `src/index.css` under the `/* Editor page */` section. Classes are prefixed with `editor-` to avoid collisions with the game UI.

## Known Limitations

- Uploaded model object URLs are not revoked after replacement or unmount.
- Large `map.json` files are not virtualized, culled, or LOD-managed.
- There is no snap-to-grid, duplication, material editing, or object creation workflow.
- Save to Server is a Vite dev-server helper, not a production backend API.
- SRT Save is also a Vite dev-server helper, not a production backend API.
- Dialogue and cinematic manifest saves are Vite dev-server helpers, not production backend APIs.
- Dialogue creation still uses placeholder audio paths until real MP3 files are added.
