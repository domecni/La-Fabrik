# Animation & 3D Model System

This document describes how to use the 3D model components and animation system in La-Fabrik.

## Table of Contents

1. [Model Types Overview](#model-types-overview)
2. [SimpleModel - Static Models](#simplemodel---static-models)
3. [AnimatedModel - Animated Models](#animatedmodel---animated-models)
4. [Animation Control](#animation-control)
5. [Other 3D Components](#other-3d-components)
6. [Technical Notes](#technical-notes)

---

## Model Types Overview

The project provides three main types of model instantiation:

| Type        | Component                                                | Use Case                                     |
| ----------- | -------------------------------------------------------- | -------------------------------------------- |
| Static      | `SimpleModel`                                            | Props, decoration, objects without animation |
| Animated    | `AnimatedModel`                                          | Characters, animated objects with skeleton   |
| Interactive | `GrabbableObject`, `TriggerObject`, `InteractableObject` | Objects player can interact with             |

---

## SimpleModel - Static Models

Use for GLTF models **without** skeleton/armature and no animations.

```tsx
import { SimpleModel } from "@/components/3d";

<SimpleModel
  modelPath="/models/elecsimple/model.gltf"
  position={[0, 0, -5]}
  rotation={[0, 45, 0]}
  scale={1}
  castShadow={true}
  receiveShadow={true}
/>;
```

### Props

| Prop            | Type                     | Default     | Description                       |
| --------------- | ------------------------ | ----------- | --------------------------------- |
| `modelPath`     | `string`                 | required    | Path to GLTF file in `/public`    |
| `position`      | `Vector3Tuple`           | `[0, 0, 0]` | World position [x, y, z]          |
| `rotation`      | `Vector3Tuple`           | `[0, 0, 0]` | Rotation in degrees [x, y, z]     |
| `scale`         | `number \| Vector3Tuple` | `1`         | Scale factor or [x, y, z]         |
| `castShadow`    | `boolean`                | `true`      | Enable shadow casting             |
| `receiveShadow` | `boolean`                | `true`      | Enable shadow receiving           |
| `children`      | `ReactNode`              | -           | Child components to render inside |

---

## AnimatedModel - Animated Models

Use for GLTF models **with** skeleton/armature and animations (like Mixamo characters).

```tsx
import { AnimatedModel, useAnimatedModel } from "@/components/3d";

// Basic usage
<AnimatedModel
  modelPath="/models/elec/model.gltf"
  defaultAnimation="Idle"
  position={[0, 0, -5]}
  rotation={[0, 0, 0]}
  scale={0.01}
  autoPlay={true}
  speed={1}
  fadeDuration={0.3}
/>;
```

### Props

| Prop               | Type                     | Default     | Description                                   |
| ------------------ | ------------------------ | ----------- | --------------------------------------------- |
| `modelPath`        | `string`                 | required    | Path to GLTF file in `/public`                |
| `defaultAnimation` | `string`                 | `"Idle"`    | Animation name to play by default             |
| `animations`       | `string[]`               | `[]`        | List of animation names (optional)            |
| `position`         | `Vector3Tuple`           | `[0, 0, 0]` | World position [x, y, z]                      |
| `rotation`         | `Vector3Tuple`           | `[0, 0, 0]` | Rotation in degrees [x, y, z]                 |
| `scale`            | `number \| Vector3Tuple` | `1`         | Scale factor                                  |
| `autoPlay`         | `boolean`                | `true`      | Auto-play default animation                   |
| `speed`            | `number`                 | `1`         | Animation playback speed                      |
| `fadeDuration`     | `number`                 | `0.3`       | Transition duration in seconds                |
| `onLoaded`         | `() => void`             | -           | Callback when model loads                     |
| `onAnimationEnd`   | `(name: string) => void` | -           | Callback when animation ends                  |
| `children`         | `ReactNode`              | -           | Child components (can use `useAnimatedModel`) |

### Important: Scale

Animated models (like Mixamo exports) often need a small scale (e.g., `0.01`) because they are exported in meters while Three.js uses different units. Adjust until the model appears at the right size.

---

## Animation Control

To control animations from inside or outside the `AnimatedModel`, use the `useAnimatedModel` hook.

### Basic Control

```tsx
import { AnimatedModel, useAnimatedModel } from "@/components/3d";

// Create a controller component to use inside AnimatedModel
function AnimationController() {
  const { play, stop, fadeTo, currentAnimation, names, setSpeed, isReady } =
    useAnimatedModel();

  // names contains all available animation names
  // currentAnimation is the name of the currently playing animation
  // isReady is true when model and animations are loaded

  return (
    <mesh onClick={() => play("Run", 0.5)}>
      <boxGeometry />
    </mesh>
  );
}

// Usage
<AnimatedModel
  modelPath="/models/elec/model.gltf"
  defaultAnimation="Idle"
  position={[0, 0, -5]}
  scale={0.01}
>
  <AnimationController />
</AnimatedModel>;
```

### Available Methods

| Method             | Signature                               | Description                          |
| ------------------ | --------------------------------------- | ------------------------------------ |
| `play`             | `(name: string, fade?: number) => void` | Play animation with optional fade    |
| `fadeTo`           | `(name: string, fade?: number) => void` | Fade to another animation            |
| `stop`             | `(fade?: number) => void`               | Stop and return to default animation |
| `setSpeed`         | `(speed: number) => void`               | Set animation speed                  |
| `currentAnimation` | `string`                                | Current animation name (getter)      |
| `names`            | `string[]`                              | Available animation names            |
| `isReady`          | `boolean`                               | Whether model is loaded              |

### Transition Example

```tsx
function Character() {
  const { play, fadeTo, currentAnimation } = useAnimatedModel();

  const handleWalk = () => fadeTo("Walk", 0.5); // 0.5s fade
  const handleRun = () => play("Run", 0.3); // 0.3s fade
  const handleIdle = () => play("Idle", 0.5); // return to idle

  return (
    <group>
      <mesh onClick={handleWalk} position={[-1, 0, 0]}>
        <boxGeometry />
      </mesh>
      <mesh onClick={handleRun} position={[0, 0, 0]}>
        <boxGeometry />
      </mesh>
      <mesh onClick={handleIdle} position={[1, 0, 0]}>
        <boxGeometry />
      </mesh>
    </group>
  );
}
```

### Combined: GrabbableObject with Animation

You can combine `AnimatedModel` inside `GrabbableObject` to create animated objects that can be picked up:

```tsx
import { AnimatedModel, GrabbableObject } from "@/components/3d";

// Animated weapon/tool that player can pick up
<GrabbableObject position={[0, 1, 0]} colliders="cuboid">
  <AnimatedModel
    modelPath="/models/sword/model.gltf"
    defaultAnimation="Idle"
    position={[0, 0, 0]}
    scale={0.02}
    autoPlay={true}
  />
</GrabbableObject>;
```

Or create an animated character that can be grabbed:

```tsx
import {
  AnimatedModel,
  GrabbableObject,
  useAnimatedModel,
} from "@/components/3d";

// Controller that triggers animations when grabbed
function AnimatedGrabber() {
  const { play, fadeTo } = useAnimatedModel();

  return (
    <AnimatedModel
      modelPath="/models/elec/model.gltf"
      defaultAnimation="Idle"
      position={[0, 0, 0]}
      scale={0.01}
      autoPlay={true}
    />
  );
}

// When grabbed, play "Grab" animation
<GrabbableObject
  position={[0, 1, 0]}
  colliders="cuboid"
  onGrab={() => {
    // This would require a context or store to trigger
    console.log("Object grabbed!");
  }}
>
  <AnimatedGrabber />
</GrabbableObject>;
```

**Note:** For complex interactions (like playing specific animations when grabbing), you'll need to connect the grab events to animation controls via a state manager or context.

---

## Other 3D Components

### GrabbableObject

Objects that can be picked up by the player.

```tsx
import { GrabbableObject } from "@/components/3d";

<GrabbableObject position={[0, 1, 0]} colliders="cuboid">
  <mesh>
    <boxGeometry args={[0.5, 0.5, 0.5]} />
    <meshStandardMaterial color="red" />
  </mesh>
</GrabbableObject>;
```

### TriggerObject

Objects that trigger events when interacted with.

```tsx
import { TriggerObject } from "@/components/3d";

<TriggerObject
  position={[0, 1, 0]}
  soundPath="/sounds/click.mp3"
  onTrigger={() => console.log("Triggered!")}
>
  <mesh>
    <sphereGeometry />
    <meshStandardMaterial color="blue" />
  </mesh>
</TriggerObject>;
```

### InteractableObject

Base object for interactions.

```tsx
import { InteractableObject } from "@/components/3d";

<InteractableObject
  position={[0, 1, 0]}
  onInteract={() => console.log("Interacted!")}
>
  <mesh>
    <cylinderGeometry />
    <meshStandardMaterial color="green" />
  </mesh>
</InteractableObject>;
```

---

## Technical Notes

### GLTF Models

- Models should be placed in `/public/models/`
- Supported formats: `.gltf`, `.glb`
- Animated models must have an Armature/skeleton for animations to work

### Model Scale Issue

If animated models don't appear, they may be too small or too large. Try:

- Scale `0.01` for Mixamo-exported models
- Scale `1` for models in correct units

### Cloning

- `SimpleModel` uses `scene.clone()` for proper React lifecycle
- `AnimatedModel` uses the original scene directly to preserve SkinnedMesh + Armature structure

### Animation System

The animation system uses:

- `@react-three/drei`: `useGLTF` for loading, `useAnimations` for animation control
- Three.js: `AnimationMixer` for playback

### No State Machine

This system intentionally avoids complex state machines (like Unity's Animator). For simple animation transitions, use the `play`, `fadeTo`, and `stop` methods directly.

---

## File Structure

```
src/
├── components/3d/
│   ├── AnimatedModel.tsx    # Animated model component + context
│   ├── SimpleModel.tsx      # Static model component
│   ├── GrabbableObject.tsx  # Pickable object
│   ├── TriggerObject.tsx    # Trigger event object
│   ├── InteractableObject.tsx
│   └── index.ts             # Central exports
└── hooks/
    └── useCharacterAnimation.ts  # Animation hook (legacy)
```
