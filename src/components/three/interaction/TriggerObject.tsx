import { useRef, useState } from "react";
import { RigidBody } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import {
  TRIGGER_DEFAULT_COLLIDERS,
  TRIGGER_DEFAULT_LABEL,
  TRIGGER_DEFAULT_SOUND_VOLUME,
  TRIGGER_DEFAULT_SPAWN_OFFSET,
} from "@/data/interaction/triggerConfig";
import { AudioManager } from "@/managers/AudioManager";
import type { ColliderShape, Vector3Tuple } from "@/types/three/three";

interface SpawnedModel {
  id: number;
  position: Vector3Tuple;
}

interface TriggerObjectProps {
  position: Vector3Tuple;
  children: React.ReactNode;
  colliders?: ColliderShape;
  label?: string;
  soundPath?: string;
  soundVolume?: number;
  spawnModel?: string;
  spawnOffset?: Vector3Tuple;
  onTrigger?: () => void;
}

let spawnCounter = 0;

function SpawnedModelInstance({
  path,
  position,
}: {
  path: string;
  position: Vector3Tuple;
}): React.JSX.Element {
  const { scene } = useLoggedGLTF(path, {
    scope: "TriggerObject.SpawnedModel",
    position,
  });
  const model = useClonedObject(scene);

  return <primitive object={model} position={position} />;
}

export function TriggerObject({
  position,
  children,
  colliders = TRIGGER_DEFAULT_COLLIDERS,
  label = TRIGGER_DEFAULT_LABEL,
  soundPath,
  soundVolume = TRIGGER_DEFAULT_SOUND_VOLUME,
  spawnModel,
  spawnOffset = TRIGGER_DEFAULT_SPAWN_OFFSET,
  onTrigger,
}: TriggerObjectProps): React.JSX.Element {
  const [spawned, setSpawned] = useState<SpawnedModel[]>([]);
  const rbRef = useRef<RapierRigidBody>(null);

  return (
    <>
      <RigidBody
        ref={rbRef}
        type="fixed"
        colliders={colliders}
        position={position}
      >
        <InteractableObject
          kind="trigger"
          label={label}
          position={position}
          bodyRef={rbRef}
          onPress={() => {
            if (soundPath) {
              AudioManager.getInstance().playSound(soundPath, soundVolume);
            }

            onTrigger?.();

            if (spawnModel) {
              const spawnPos: Vector3Tuple = [
                position[0] + spawnOffset[0],
                position[1] + spawnOffset[1],
                position[2] + spawnOffset[2],
              ];
              setSpawned((prev) => [
                ...prev,
                { id: ++spawnCounter, position: spawnPos },
              ]);
            }
          }}
        >
          {children}
        </InteractableObject>
      </RigidBody>

      {spawnModel &&
        spawned.map((s) => (
          <SpawnedModelInstance
            key={s.id}
            path={spawnModel}
            position={s.position}
          />
        ))}
    </>
  );
}
