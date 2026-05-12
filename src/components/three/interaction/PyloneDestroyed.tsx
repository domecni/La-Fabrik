import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useGameStore } from "@/managers/stores/useGameStore";
import { Debug } from "@/utils/debug/Debug";
import type { Vector3Tuple } from "@/types/three/three";

interface PyloneDestroyedProps {
  position: Vector3Tuple;
}

export function PyloneDestroyed({
  position,
}: PyloneDestroyedProps): React.JSX.Element {
  const step = useGameStore((state) => state.intro.currentStep);
  const setStep = useGameStore((state) => state.setIntroStep);
  const setCanMove = useGameStore((state) => state.setCanMove);
  const showDialog = useGameStore((state) => state.showDialog);
  const debug = Debug.getInstance();

  const handlePress = (): void => {
    if (step === "helped") {
      setCanMove(false);
      setStep("manipulation");
    } else if (step === "searching") {
      showDialog(
        "Cet objet est trop lourd pour le porter tout seul, trouve de l'aide",
      );
    }
  };

  const shouldShow =
    step === "helped" || step === "manipulation" || debug.active;

  if (!shouldShow) {
    return <></>;
  }

  return (
    <InteractableObject
      kind="trigger"
      label="central"
      position={position}
      onPress={handlePress}
    >
      <group position={position}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      </group>
    </InteractableObject>
  );
}
