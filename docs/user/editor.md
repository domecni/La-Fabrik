# Editor User Guide

The map editor is available at `/editor`. It is a browser-based tool for inspecting and adjusting the objects listed in `public/map.json`.

## Purpose

Use the editor when you need to move, rotate, or scale existing map objects without editing JSON by hand.

The editor reads the same map data as the runtime scene:

- `public/map.json` contains the object list.
- `public/models/{name}/model.gltf` contains the matching 3D model for each object name.
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

The button is hidden in production builds because production persistence is not implemented yet.

## Current Limitations

- The editor only modifies existing nodes.
- It does not create or delete objects yet.
- It does not edit model files or textures.
- It does not provide production persistence.
- Fallback cubes indicate missing models; they are editor placeholders, not exported assets.
