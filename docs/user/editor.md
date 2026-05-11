# Editor User Guide

The map editor is available at `/editor`. It is a browser-based tool for inspecting and adjusting the objects listed in `public/map.json`.

## Purpose

Use the editor when you need to move, rotate, or scale existing map objects without editing JSON by hand.

The editor reads the same map data as the runtime scene:

- `public/map.json` contains the object list.
- `public/models/{name}/model.glb` contains the matching 3D model for each object name. `model.gltf` is still supported as a fallback during migration.
- Missing models are displayed as gray fallback cubes, so incomplete maps remain editable.

## Map Node Format

Each entry in `public/map.json` represents one object:

| Field      | Description                                       |
| ---------- | ------------------------------------------------- |
| `name`     | Model folder name in `public/models/{name}`       |
| `type`     | Object category                                   |
| `position` | Object position as `[x, y, z]`                    |
| `rotation` | Object rotation as `[x, y, z]`, expressed radians |
| `scale`    | Object scale as `[x, y, z]`                       |

## Editing Workflow

1. Open `/editor` in the local app.
2. Click an object in the scene to select it.
3. Choose a transform mode: translate, rotate, or scale.
4. Drag the transform gizmo in the 3D view.
5. Check the JSON inspector if you need exact values.
6. Use undo or redo if the transform is not correct.
7. Export the JSON or save it to the dev server.

## Controls

| Action               | Input                      |
| -------------------- | -------------------------- |
| Select object        | Click object               |
| Deselect             | `Esc` or click empty space |
| Translate mode       | `T`                        |
| Rotate mode          | `R`                        |
| Scale mode           | `S`                        |
| Undo                 | `Ctrl+Z`                   |
| Redo                 | `Ctrl+Y`                   |
| Locked view movement | `WASD`, `ZQSD`, arrows     |
| Move up              | `Space`                    |
| Move down            | `Shift`                    |

## View Mode

The `Lock view` action switches the editor into a movement mode closer to the runtime player camera. Use it to navigate larger scenes while keeping the transform tools available.

## JSON Inspector

The side panel includes a raw JSON inspector:

- When no object is selected, it shows the full map node list.
- When an object is selected, it highlights the JSON lines for that object.

This is useful for checking numeric transform values before saving or exporting.

## Saving Changes

### Export JSON

`Export JSON` downloads the current map node list as `map.json`. Use this when you want to manually replace `public/map.json`.

### Save To Server

`Save to server` is available only during local development. It writes the edited map back to `public/map.json` through the Vite dev-server endpoint.

The button is hidden in production builds because production persistence is not implemented.

## Editing Dialogue Subtitles

The side panel also includes dialogue tools for the dialogue manifest and SRT subtitles.

### Dialogue Manifest

Use the `Dialogues` panel to edit `public/sounds/dialogue/dialogues.json` without opening the JSON file manually.

Available actions:

- `Reload` reloads the manifest from disk.
- `Add` creates a local dialogue entry for the current voice and assigns the next available SRT cue index.
- `Save` writes the manifest through the local Vite dev server.
- `Preview dialogue` plays the selected dialogue and shows subtitles in the editor overlay.
- `Create FR SRT cue` creates the matching French SRT cue if it is missing.
- `Delete dialogue` removes the selected entry locally.

After using `Add`, save the manifest to keep the new dialogue entry. The generated SRT cue is written immediately to the French SRT file, but the dialogue manifest is still only local until `Save` is clicked.

New dialogue audio paths start as placeholders such as `/sounds/dialogue/new_dialogue_24.mp3`. Replace them with real MP3 paths before validating the final asset set.

### SRT Editor

Use the `SRT` panel to edit one subtitle file at a time.

1. Choose a voice: `narrateur`, `fermier`, or `electricienne`.
2. Choose a language: `FR` or `EN`.
3. Edit the SRT text directly in the textarea.
4. Use the audio preview to check the selected dialogue.
5. Use `Set start`, `Set end`, `-100ms`, and `+100ms` to adjust the selected cue timing against the audio.
6. Use `Save SRT` during local development, or `Export SRT` to download the file manually.

Each SRT file belongs to one voice, not one dialogue. Cue indexes must match the `subtitleCueIndex` values referenced by the dialogue manifest.

## Validating Dialogue Assets

Use `Validate` in the SRT panel to check the dialogue manifest and linked assets.

The validation checks:

- `public/sounds/dialogue/dialogues.json`
- referenced dialogue audio files
- French SRT files
- subtitle cue indexes referenced by the manifest

Missing English SRT files are warnings because the runtime falls back to French subtitles.

## Editing Cinematics

Use the `Cinematics` panel to edit `public/cinematics.json`.

Each cinematic contains:

- an `id`
- an optional global `timecode`
- two or more camera keyframes
- optional dialogue cues synchronized to the cinematic timeline

Camera keyframes define:

- `time`: seconds relative to the cinematic start
- `position`: camera position `[x, y, z]`
- `target`: point the camera looks at `[x, y, z]`

Dialogue cues define:

- `time`: seconds relative to the cinematic start
- `dialogueId`: an entry from `public/sounds/dialogue/dialogues.json`

Available actions:

- `Reload` reloads the cinematic manifest from disk.
- `Add` creates a new local cinematic with two camera keyframes.
- `Save` writes `public/cinematics.json` through the local Vite dev server.
- `Preview cinematic` plays the selected camera animation in the editor canvas.
- `Add keyframe` and `Remove` edit the camera path.
- `Add dialogue` and `Remove` edit dialogue cues linked to the cinematic.
- `Delete cinematic` removes the selected cinematic locally.

Cinematic dialogue cues are the preferred way to synchronize a dialogue with a cinematic. Avoid also giving the same dialogue a global `timecode`, or it can be triggered twice.

## Current Limitations

- The editor only modifies existing nodes.
- It does not create or delete objects.
- It does not edit model files or textures.
- It does not provide production persistence.
- Fallback cubes indicate missing models; they are editor placeholders, not exported assets.
- SRT saving is a local Vite dev-server helper, not a production backend feature.
- Dialogue and cinematic saves are local Vite dev-server helpers, not production backend features.
