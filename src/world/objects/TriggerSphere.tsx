import { AudioManager } from "@/stateManager/AudioManager";
import { InteractableObject } from "@/components/3d/InteractableObject";

const SPHERE_RADIUS = 0.4;
const SPAWN_POSITION: [number, number, number] = [3, 2, -3];
const SOUND_PATH = "/sounds/fa.mp3";

interface TriggerSphereProps {
  soundPath?: string;
}

export function TriggerSphere({
  soundPath = SOUND_PATH,
}: TriggerSphereProps): React.JSX.Element {
  return (
    <InteractableObject
      kind="trigger"
      label="Interagir"
      position={SPAWN_POSITION}
      rigidBodyType="fixed"
      colliders="ball"
      onPress={() => {
        AudioManager.getInstance().playSound(soundPath);
      }}
    >
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[SPHERE_RADIUS, 32, 32]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.5} />
      </mesh>
    </InteractableObject>
  );
}
