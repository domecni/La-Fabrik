# Interaction System Technical Notes

This document explains the shared trigger, grab, focus, and hand-grab system.

## Purpose

The app has several ways for the player to affect the 3D scene:

- press `E` on focused trigger objects
- hold the primary mouse button on grabbable objects
- close a tracked hand into a fist to grab hand-controlled objects
- release objects and optionally snap them into target positions

The implementation keeps those rules in a reusable interaction layer so gameplay features such as the repair game do not each create their own input system.

## Main Files

| File                                                      | Responsibility                                  |
| --------------------------------------------------------- | ----------------------------------------------- |
| `src/managers/InteractionManager.ts`                      | Shared interaction state and imperative actions |
| `src/hooks/interaction/useInteraction.ts`                 | React subscription to the manager               |
| `src/components/three/interaction/InteractableObject.tsx` | Distance/raycast focus detection                |
| `src/components/three/interaction/TriggerObject.tsx`      | Press-to-trigger wrapper                        |
| `src/components/three/interaction/GrabbableObject.tsx`    | Physics-backed grab and hand grab wrapper       |
| `src/components/ui/InteractPrompt.tsx`                    | HTML prompt for focused trigger interactions    |
| `src/world/player/PlayerController.tsx`                   | Keyboard/mouse input bridge                     |

## Architecture

The interaction system has three layers:

1. R3F objects detect focus and register handles.
2. `InteractionManager` stores the current interaction snapshot.
3. UI and player input read the snapshot and trigger the selected action.

This is intentionally not Zustand. Interaction focus and holding state are short-lived, frame-adjacent runtime state. A small singleton plus `useSyncExternalStore` is a better fit than putting high-frequency interaction details into the durable game progression store.

## Interaction Snapshot

The snapshot type lives in:

```txt
src/types/interaction/interaction.ts
```

```ts
interface InteractionSnapshot {
  focused: InteractableHandle | null;
  nearby: boolean;
  holding: boolean;
  handHolding: boolean;
}
```

Meaning:

- `focused`: the interactable currently aimed at by the camera ray
- `nearby`: at least one interactable is within interaction radius
- `holding`: mouse/player-controller grab is active
- `handHolding`: hand-tracking grab is active

`nearby`, `holding`, and `handHolding` are also used by the hand-tracking provider to decide when webcam tracking should stay active in the debug physics scene.

## Focus Detection

Focus detection lives in:

```txt
src/components/three/interaction/InteractableObject.tsx
```

Each frame, it:

1. finds the interactable world position from its Rapier body or group transform
2. checks distance from the camera
3. marks the handle as nearby if it is inside radius
4. raycasts from the camera forward direction
5. sets the focused handle when the ray hits the object
6. clears focus if the object is no longer nearby or no longer aimed at

This gives a simple first-person interaction model: the player must be close enough and looking at the object.

## Trigger Objects

Trigger implementation:

```txt
src/components/three/interaction/TriggerObject.tsx
```

`TriggerObject` wraps children in a fixed Rapier body and exposes a trigger handle.

When triggered, it can:

- play an optional SFX through `AudioManager`
- call `onTrigger`
- spawn an optional model at an offset

Typical users:

- repair-object inspection
- repair-case open/fragment interaction
- install target
- completion target
- debug scene trigger sphere

## Grabbable Objects

Grab implementation:

```txt
src/components/three/interaction/GrabbableObject.tsx
```

`GrabbableObject` wraps children in a dynamic Rapier body and exposes a grab handle.

Mouse/controller grab flow:

1. Player focuses the object.
2. Mouse down calls `InteractionManager.pressInteract()`.
3. The object enters holding mode.
4. Each frame, velocity is pushed toward a hold target in front of the camera.
5. Mouse up calls `releaseInteract()`.
6. The object can snap to the nearest configured target.

Important tuning values live in:

```txt
src/data/interaction/grabConfig.ts
```

The debug GUI exposes hold stiffness, throw boost, and hold distance.

## Snap-To-Target

`GrabbableObject` supports:

- `snapTargets`
- `snapRadius`
- `snapDuration`
- `onSnap`

On release, the object finds the nearest target inside `snapRadius`. If a target is found, GSAP animates the Rapier body translation to that target and calls `onSnap`.

The repair game uses this to place replacement parts and broken parts into case placeholders.

## Hand-Controlled Grab

If `handControlled` is true, `GrabbableObject` also reads:

```txt
useHandTrackingSnapshot()
```

Hand grab flow:

1. Find a detected hand where `hand.isFist` is true.
2. Compute the visual center of the hand from landmark bounds.
3. Convert that screen-space point to a camera ray.
4. Raycast against the object.
5. Use a small set of offset rays around the center to make hit detection more forgiving.
6. If the object is in range and hit, enter `handHolding`.
7. Move the object toward a hold target in front of the camera while the fist remains closed.
8. When the fist opens or disappears, release and snap if possible.

This is an approximation, not a full 3D hand collider. It is a practical prototype compromise because MediaPipe gives normalized camera-space landmarks and relative depth, not stable world-space hand meshes.

## Player Input Bridge

The player controller owns raw keyboard and mouse input:

```txt
src/world/player/PlayerController.tsx
```

It calls:

- `interaction.pressInteract()` when `E` is pressed and the focused handle is a trigger
- `interaction.pressInteract()` on mouse down when the focused handle is a grab
- `interaction.releaseInteract()` on mouse up when a grab is active

Input is ignored while:

- the settings menu is open
- a cinematic is playing

Movement lock is read separately from `useRepairMovementLocked`, but that hook currently returns `false` on this branch.

## UI Prompt

The prompt lives in:

```txt
src/components/ui/InteractPrompt.tsx
```

It appears only when:

- camera mode is `player`
- a focused interaction exists
- the player is not holding an object
- the focused interaction is a trigger

The prompt does not appear for grab objects, because grabs are mouse/hand actions rather than `E` trigger actions.

## Debug Controls

Interaction debugging is split between:

- lil-gui `Interaction` folder for showing interaction spheres
- lil-gui `GrabbableObject` folder for grab tuning
- debug physics scene for live trigger/grab testing
- hand-tracking debug panel for hand grab state

Use:

```txt
http://localhost:5173/?debug
```

Then switch the scene mode to `Physics` from lil-gui.

## Why This Architecture Works

The interaction layer separates concerns:

- R3F objects know their distance/raycast hit state.
- The player controller owns input events.
- UI only subscribes to a snapshot.
- Gameplay objects receive semantic callbacks like `onTrigger`, `onSnap`, or `onPositionChange`.

This keeps the repair game focused on gameplay rules instead of low-level input plumbing.

## Known Limitations

- Only one focused handle is stored at a time.
- The focus rule is camera ray based, so side-facing interactions can feel strict without larger meshes or radii.
- Hand grab uses screen-space raycasts, not physical hand colliders.
- The manager is singleton-based, so tests must call `destroy()` or isolate state when needed.
- `nearby` is boolean, not a list exposed to UI, so the current UI cannot rank multiple nearby objects.
