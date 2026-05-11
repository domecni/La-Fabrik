import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useRepairMovementLocked } from "@/hooks/gameplay/useRepairMovementLocked";

export function RepairMovementLockIndicator(): React.JSX.Element | null {
  const cameraMode = useCameraMode();
  const movementLocked = useRepairMovementLocked();

  if (cameraMode !== "player") return null;
  if (!movementLocked) return null;

  return (
    <div className="repair-movement-lock-indicator" aria-live="polite">
      <span
        className="repair-movement-lock-indicator__dot"
        aria-hidden="true"
      />
      <span>Déplacement verrouillé pendant la réparation</span>
    </div>
  );
}
