# Animation & 3D Components

This document describes the 3D components that are currently used in the runtime.

## Runtime Components

| Domain      | Component            | Role                                                                  |
| ----------- | -------------------- | --------------------------------------------------------------------- |
| Interaction | `InteractableObject` | Focus detection through distance and raycasting                       |
| Interaction | `TriggerObject`      | Press-to-trigger interactions, optional sound, optional spawned model |
| Interaction | `GrabbableObject`    | Physics grab and hand-tracking grab behavior                          |
| Model       | `ExplodableModel`    | Split/reassemble a GLTF model into separated parts                    |
| Gameplay    | `RepairCaseModel`    | Repair case lid animation, proximity float, and wobble                |

## Continuous Animation

Use `useFrame` for per-frame 3D behavior. Current examples:

- `GrabbableObject` updates held object velocity every frame.
- `ExplodableModel` updates split part positions every frame.
- `RepairCaseModel` updates proximity float and rotation wobble every frame.
- `SkyModel` follows the camera position every frame.

## Timeline Animation

Use GSAP only for discrete timeline-style transitions. Current example:

- `RepairCaseModel` animates the case lid between open and closed rotations.

## GLTF Reuse

Use `useClonedObject` when a GLTF scene is reused by a component instance. It memoizes `scene.clone(true)` and keeps clone creation out of render churn.

## File Structure

```txt
src/components/three/
├── gameplay/
│   ├── RepairCaseModel.tsx
│   ├── RepairGame.tsx
│   └── RepairRepairingStep.tsx
├── interaction/
│   ├── GrabbableObject.tsx
│   ├── InteractableObject.tsx
│   └── TriggerObject.tsx
├── models/
│   └── ExplodableModel.tsx
└── world/
    └── SkyModel.tsx
```
