# Main Feature

This document explains the current repair-game flow in La-Fabrik.

## What It Does

The main feature is a reusable repair flow mounted in the production game scene. It lets the player approach the active mission object, inspect it, fragment it, scan the broken part, install the correct replacement, validate completion, and move to the next mission state.

The current user flow is:

1. Enter a mission state such as `bike`, `pylone`, or `ferme`.
2. Move close to the active repair object in the game scene.
3. Aim at the object and press the interaction key when prompted.
4. The mission step moves from `waiting` to `inspected`.
5. The repair case appears near the mission object and can float when the player approaches it.
6. Press `E` or hold both fists closed for one second to move from `inspected` to `fragmented`.
7. The mission object uses an exploded-model transition, then moves to `scanning`.
8. The scan visual highlights the broken area and shows the `cassé.webm` prompt.
9. In `repairing`, the case opens and several grabbable replacement parts appear near the case.
10. Move the correct replacement part close to the install target.
11. Press `E` on the green install target to move to `done` and show the reassembled object. Wrong parts turn the target red and cannot finish the repair.
12. Press `E` on the completion target to call `completeMission` and move to the next mission, or to `outro` after `ferme`.

## Why It Matters

This feature validates the repair loop before a full mission system exists. It tests whether repair objects, physical proximity, model selection, audio feedback, and exploded model visualization can work together in the 3D scene.

## Current Behavior

In `waiting`, the active mission renders its repair object and the `interagir.webm` prompt in the game scene. The interaction uses the shared focus/raycast interaction system, so the player still gets the normal `E` prompt.

When the player inspects the object, `RepairGame` writes `inspected` through the generic mission store action. The repair case then appears from the mission config with a small pop animation. When the player is close enough, the existing case model floats upward and rotates gently to signal interactivity.

In `inspected`, `RepairGame` can also move to `fragmented`. The player can use the interaction key or hold both fists closed for one second. The hand-tracking path is state-based, so it does not depend on being inside a local object interaction radius.

In `fragmented`, the repair object is rendered with `ExplodableModel`, then automatically advances to `scanning`. In `scanning`, a blue scan visual and the `cassé.webm` prompt are shown before the flow advances to `repairing`. In `repairing`, the case opens, several grabbable replacement parts appear, and the install target only validates the configured correct part for the active mission. In `done`, the repaired object remains visible with a completion target that advances the global mission progression.

## Key Files

- `src/world/GameStageContent.tsx` mounts production `RepairGame` instances for `bike`, `pylone`, and `ferme`.
- `src/components/three/gameplay/RepairCompletionStep.tsx` renders the final repaired object, completion target, and mission UI prompt.
- `src/components/three/gameplay/RepairGame.tsx` composes the reusable production repair flow.
- `src/components/three/gameplay/RepairInspectionObject.tsx` handles the `waiting` inspection interaction.
- `src/components/three/gameplay/RepairMissionCase.tsx` renders the mission repair case after inspection.
- `src/components/three/gameplay/RepairRepairingStep.tsx` renders grabbable replacement choices, correct-part placement validation, and the install trigger in `repairing`.
- `src/components/three/gameplay/RepairPromptVideo.tsx` renders `.webm` prompts inside the 3D scene.
- `src/components/three/gameplay/RepairScanVisual.tsx` renders the scan halo, scan line, and broken prompt.
- `src/hooks/gameplay/useRepairFragmentationInput.ts` handles the `inspected -> fragmented` keyboard and hand-tracking input.
- `src/hooks/gameplay/useRepairMissionStep.ts` reads the active mission step from the game store.
- `src/hooks/handTracking/useBothFistsHold.ts` detects the reusable two-fists hold gesture.
- `src/components/three/gameplay/RepairCaseModel.tsx` renders and animates the case model.
- `src/components/three/models/ExplodableModel.tsx` renders selectable models with split/exploded visualization.
- `src/data/gameplay/repairCaseConfig.ts` stores repair case model, sound, and animation constants.
- `src/data/gameplay/repairGameConfig.ts` stores repair flow timing constants.
- `src/data/gameplay/repairMissions.ts` stores reusable repair mission config for `bike`, `pylone`, and `ferme`.
- `src/managers/stores/useGameStore.ts` stores mission progression state and generic mission step helpers.

## Runtime Requirements

The production repair flow currently requires:

- the active `mainState` to be one of `bike`, `pylone`, or `ferme`
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

## Related Hand Tracking

Hand tracking can move grabbable physics objects with webcam input in debug scenes. In the production repair flow, it is also used for the `inspected -> fragmented` transition through the two-fists hold gesture.

For hand tracking, run the Python backend separately:

```bash
source backend/.venv/bin/activate
python -m backend.main
```

## Current Limitations

- The reusable production `RepairGame` currently covers `waiting -> inspected -> fragmented -> scanning -> repairing -> done -> next mission`.
- Mission progression is wired through Zustand using `completeMission` at the end of each repair.
- There is no central `GameManager` in this branch.
- Hand tracking is available for the two-fists input and grabbable replacement parts; final installation still uses the shared `E` trigger path.
- The repair-game content is configured statically in `src/data/gameplay/`.
