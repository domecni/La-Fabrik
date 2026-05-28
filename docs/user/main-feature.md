# Main Feature

This document explains the current repair-game flow in La-Fabrik.

## What It Does

The main feature is a reusable repair flow mounted in the production game scene. It lets the player approach the active mission object, inspect it, fragment it, scan the broken part, install the correct replacement, validate completion, and move to the next mission state.

The current user flow is:

1. Enter a mission state such as `ebike`, `pylon`, or `farm`.
2. Move close to the active repair object in the game scene.
3. Aim at the object and press the interaction key when prompted.
4. The mission step moves from `waiting` to `inspected`.
5. The repair case appears near the mission object and can float when the player approaches it. A repair movement-lock rule exists in code, but it is currently disabled by the hook on `develop`.
6. Aim at the repair case and press `E`, or hold both fists closed for one second, to move from `inspected` to `fragmented`.
7. The mission object uses an exploded-model transition, then moves to `scanning`.
8. The scan visual moves across the fragmented model one part at a time and keeps a red marker plus the `cassé.webm` prompt centered on any configured broken part once it has been found.
9. In `repairing`, the case opens in a larger focused view and several grabbable replacement parts appear on the case placeholders.
10. Move the correct replacement part close to a placeholder. When released near a placeholder, it snaps into place with a short animation.
11. Move each scanned broken part into a compatible placeholder so the damaged parts are stored in the case.
12. Press `E` on the green install target to move to `reassembling`. Wrong parts turn the target red and cannot finish the repair.
13. The exploded object animates back into its assembled form with completion particles, then moves to `done`.
14. Press `E` on the completion target. The repair case closes, returns to the ground, disappears, then `completeMission` moves to the next mission or to `outro` after `farm`.

## Why It Matters

This feature validates the repair loop before a full mission system exists. It tests whether repair objects, physical proximity, model selection, audio feedback, and exploded model visualization can work together in the 3D scene.

For implementation details, see `docs/technical/repair-game.md`.

## Current Behavior

In `waiting`, the active mission renders its repair object and the `interagir.webm` prompt in the game scene. The interaction uses the shared focus/raycast interaction system, so the player still gets the normal `E` prompt.

When the player inspects the object, `RepairGame` writes `inspected` through the generic mission store action. The repair case then appears from the mission config with a small pop animation. When the player is close enough, the case model floats upward and rotates gently to signal interactivity. The shared repair movement-lock hook and HTML indicator keep movement disabled during active repair steps.

In `inspected`, `RepairGame` can also move to `fragmented`. Keyboard input goes through the shared focus/raycast interaction system on the repair case, so the player must be close enough and aim at the case before pressing `E`. The hand-tracking path still uses a two-fists hold gesture and is state-based, so it does not depend on being inside a local object interaction radius.

In `fragmented`, the repair object is rendered with `ExplodableModel`, then automatically advances to `scanning`. In `scanning`, the exploded model remains visible, a blue scan visual moves from part to part, and a red halo/wire marker plus the configured broken UI video stay attached to configured broken parts after the scanner reaches them. The scan matches configured broken parts by `nodeName` and reports diagnostics when a configured node is missing. In `repairing`, the case opens in a larger focused transform, `RepairCaseModel` traverses the case GLTF for empty nodes named `placeholder_*`, several grabbable replacement parts appear on those slot positions, and releasing a part near a slot snaps it into place with a short GSAP animation. Scanned broken parts are also rendered as grabbable objects and must be deposited into a compatible slot before the final install target validates. If `brokenParts[].caseSlotName` is configured, that broken part snaps only to the matching slot; otherwise it can use any available slot. If the current case asset has no slot nodes, the flow keeps using fallback focus positions and logs the fallback. Replacement parts show green or red placement feedback after snapping, broken parts show stored feedback after deposit, and the install target gives a short blocked feedback if the player tries to validate too early. The install target only validates when the configured correct replacement part is placed and all scanned broken parts have been deposited. In `reassembling`, the exploded model animates back into its assembled position with green completion particles before the flow moves to `done`. In `done`, the repaired object remains visible with a completion target; validating closes the repair case first, then plays the case exit animation before advancing the global mission progression.

The mission config now carries the mission-specific variations. `ebike` repairs one cooling core, `pylon` scans and stores both the lamp relay and a damaged panel with slower scan/reassembly timing, and `farm` scans and stores an irrigation pump plus humidity sensor with faster scan/reassembly timing.

## Key Files

- `src/world/GameStageContent.tsx` mounts production `RepairGame` instances for `ebike`, `pylon`, and `farm`.
- `src/components/three/gameplay/RepairCompletionStep.tsx` renders the final repaired object, completion target, case exit animation, and mission UI prompt.
- `src/components/three/gameplay/RepairGame.tsx` composes the reusable production repair flow.
- `src/components/three/gameplay/RepairBrokenPartHighlight.tsx` renders the red halo and wire marker around detected broken parts during scanning.
- `src/components/three/gameplay/RepairBrokenPartPrompt.tsx` centers the configured broken UI video on detected broken parts during scanning.
- `src/components/three/gameplay/RepairInspectionObject.tsx` handles the `waiting` inspection interaction.
- `src/components/three/gameplay/RepairMissionCase.tsx` renders the mission repair case after inspection.
- `src/components/three/gameplay/RepairRepairingStep.tsx` renders grabbable replacement choices, grabbable scanned broken parts, placeholder placement markers, snap placement behavior, correct-part and broken-part placement validation, and the install trigger in `repairing`.
- `src/components/three/gameplay/RepairReassemblyStep.tsx` renders the inverse fragmentation animation before the final completion step.
- `src/components/three/gameplay/RepairCompletionParticles.tsx` renders the green completion particles during reassembly.
- `src/components/three/gameplay/RepairPromptVideo.tsx` renders `.webm` prompts inside the 3D scene.
- `src/components/three/gameplay/RepairScanSequence.tsx` keeps the exploded model visible and advances the scan from part to part.
- `src/components/three/gameplay/RepairScanVisual.tsx` renders the scan halo and scan line around the active part.
- `src/components/ui/RepairMovementLockIndicator.tsx` renders the HTML indicator intended for repair movement lock.
- `src/hooks/gameplay/useRepairFragmentationInput.ts` handles the `inspected -> fragmented` two-fists input and can optionally bind keyboard input for non-trigger flows.
- `src/hooks/gameplay/useRepairMissionStep.ts` reads the active mission step from the game store.
- `src/hooks/gameplay/useRepairMovementLocked.ts` exposes the shared repair movement-lock rule used by the player controller and UI indicator, but currently returns `false`.
- `src/hooks/handTracking/useBothFistsHold.ts` detects the reusable two-fists hold gesture.
- `src/components/three/gameplay/RepairCaseModel.tsx` renders and animates the case model, and exposes `placeholder_*` transforms when the GLTF provides them.
- `src/components/three/models/ExplodableModel.tsx` renders selectable models with split/exploded visualization.
- `src/data/gameplay/repairCaseConfig.ts` stores repair case model, sound, and animation constants.
- `src/data/gameplay/repairGameConfig.ts` stores repair flow timing constants.
- `src/data/gameplay/repairMissions.ts` stores reusable repair mission config for `ebike`, `pylon`, and `farm`.
- `src/managers/stores/useGameStore.ts` stores mission progression state and generic mission step helpers.
- `src/types/gameplay/repairMission.ts` contains shared repair mission ids, mission steps, and guards used by the store, data config, debug UI, and gameplay components.

## Runtime Requirements

The production repair flow currently requires:

- the active `mainState` to be one of `ebike`, `pylon`, or `farm`
- `GameStageContent` mounted inside the game scene Rapier `Physics` boundary
- model assets available under `public/models/`
- sound assets available under `public/sounds/`

Frontend command:

```bash
npm run dev
```

Debug URL for state switching and inspection:

```txt
http://localhost:5173/?debug
```

The debug physics scene keeps the existing grab, trigger, and animated model tests, and also exposes separate `Bike`, `Pylone`, and `Farm` repair playground zones. Use the debug game-state panel to switch `mainState`; selecting a locked repair mission in that panel opens it at `waiting`, and the matching repair zone mounts the same reusable `RepairGame` flow with that mission's model, broken parts, replacement parts, prompts, and timings.

## Related Hand Tracking

Hand tracking can move grabbable physics objects with webcam input in debug scenes. In the production repair flow, it is also used for the `inspected -> fragmented` transition through the two-fists hold gesture.

For hand tracking, run the Python backend separately:

```bash
source backend/.venv/bin/activate
python -m backend.main
```

## Current Limitations

- The reusable production `RepairGame` currently covers `waiting -> inspected -> fragmented -> scanning -> repairing -> reassembling -> done -> next mission`.
- Mission progression is wired through Zustand using `completeMission` at the end of each repair.
- There is no central `GameManager` in this branch.
- Repair movement lock is currently disabled by `useRepairMovementLocked()`.
- Hand tracking is available for the two-fists input and grabbable repair parts; case interaction and final installation still use the shared `E` trigger path.
- The repair-game content is configured statically in `src/data/gameplay/`.
