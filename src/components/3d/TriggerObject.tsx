import { useState } from "react";
import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { InteractableObject } from "@/components/3d/InteractableObject";
import {
  TRIGGER_DEFAULT_COLLIDERS,
  TRIGGER_DEFAULT_LABEL,
  TRIGGER_DEFAULT_SOUND_VOLUME,
  TRIGGER_DEFAULT_SPAWN_OFFSET,
} from "@/data/triggerConfig";
import { AudioManager } from "@/stateManager/AudioManager";
import type { ColliderShape, Vector3Tuple } from "@/types/3d";

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
}

let _spawnCounter = 0;

function SpawnedModelInstance({
  path,
  position,
}: {
  path: string;
  position: Vector3Tuple;
}): React.JSX.Element {
  const { scene } = useGLTF(path);
  return <primitive object={scene.clone()} position={position} />;
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
}: TriggerObjectProps): React.JSX.Element {
  const [spawned, setSpawned] = useState<SpawnedModel[]>([]);

  return (
    <>
      <RigidBody type="fixed" colliders={colliders} position={position}>
        <InteractableObject
          kind="trigger"
          label={label}
          position={position}
          onPress={() => {
            if (soundPath) {
              AudioManager.getInstance().playSound(soundPath, soundVolume);
            }

            if (spawnModel) {
              const spawnPos: Vector3Tuple = [
                position[0] + spawnOffset[0],
                position[1] + spawnOffset[1],
                position[2] + spawnOffset[2],
              ];
              setSpawned((prev) => [
                ...prev,
                { id: ++_spawnCounter, position: spawnPos },
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
