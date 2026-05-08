# Main Feature

This document explains the current repair-game flow in La-Fabrik.

## What It Does

The main feature is becoming a reusable repair flow mounted in the production game scene. It lets the player approach the active mission object, inspect it, and bring in the repair case before later repair steps take over.

The current user flow is:

1. Enter a mission state such as `bike`, `pylone`, or `ferme`.
2. Move close to the active repair object in the game scene.
3. Aim at the object and press the interaction key when prompted.
4. The mission step moves from `waiting` to `inspected`.
5. The repair case appears near the mission object and can float when the player approaches it.
6. Press `E` or hold both fists closed for one second to move from `inspected` to `fragmented`.

The older debug repair sandbox still exists in the physics test scene, but the production path now starts from the reusable `RepairGame` component.

## Why It Matters

This feature validates the core repair fantasy before a full mission system exists. It tests whether repair objects, physical proximity, model selection, audio feedback, and exploded model visualization can work together in the 3D scene.

## Current Behavior

In `waiting`, the active mission renders its repair object and the `interagir.webm` prompt in the game scene. The interaction uses the shared focus/raycast interaction system, so the player still gets the normal `E` prompt.

When the player inspects the object, `RepairGame` writes `inspected` through the generic mission store action. The repair case then appears from the mission config. When the player is close enough, the existing case model floats upward and rotates gently to signal interactivity.

In `inspected`, `RepairGame` can also move to `fragmented`. The player can use the interaction key or hold both fists closed for one second. The hand-tracking path is state-based, so it does not depend on being inside a local object interaction radius.

Repair module slots and exploded-model behavior still exist in the debug prototype. They will be migrated into the reusable repair flow in later steps.

## Key Files

- `src/world/debug/TestMap.tsx` mounts the repair-game prototype in the debug physics scene.
- `src/world/GameStageContent.tsx` mounts production `RepairGame` instances for `bike`, `pylone`, and `ferme`.
- `src/components/three/gameplay/RepairGame.tsx` composes the reusable production repair flow.
- `src/components/three/gameplay/RepairInspectionObject.tsx` handles the `waiting` inspection interaction.
- `src/components/three/gameplay/RepairMissionCase.tsx` renders the mission repair case after inspection.
- `src/components/three/gameplay/RepairPromptVideo.tsx` renders `.webm` prompts inside the 3D scene.
- `src/hooks/gameplay/useRepairFragmentationInput.ts` handles the `inspected -> fragmented` keyboard and hand-tracking input.
- `src/hooks/gameplay/useRepairMissionStep.ts` reads the active mission step from the game store.
- `src/hooks/handTracking/useBothFistsHold.ts` detects the reusable two-fists hold gesture.
- `src/components/three/gameplay/RepairGameZone.tsx` composes the repair-game zone.
- `src/components/three/gameplay/RepairCaseObject.tsx` connects the repair case to trigger interaction and audio.
- `src/components/three/gameplay/RepairCaseModel.tsx` renders and animates the case model.
- `src/components/three/gameplay/RepairModuleSlot.tsx` renders repair slots and model selection behavior.
- `src/components/three/models/ExplodableModel.tsx` renders selectable models with split/exploded visualization.
- `src/data/gameplay/repairCaseConfig.ts` stores repair case model, sound, and animation constants.
- `src/data/gameplay/repairGameConfig.ts` stores repair zone and slot positions.
- `src/data/gameplay/repairGameModelCatalog.ts` stores selectable repair models.
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

- The reusable production `RepairGame` currently covers `waiting -> inspected -> fragmented -> scanning -> repairing`; repair interactions and completion still need to be implemented.
- Mission progression exists in Zustand, but the full repair mission flow is still being integrated.
- There is no central `GameManager` in this branch.
- Hand tracking is available for repair-step input, but the later repair interactions are still being integrated.
- The repair-game content is configured statically in `src/data/gameplay/`.
