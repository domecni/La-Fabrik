import { INTERACT_KEY } from "@/data/input/keybindings";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useInteraction } from "@/hooks/interaction/useInteraction";

export function InteractPrompt(): React.JSX.Element | null {
  const cameraMode = useCameraMode();
  const { focused, holding } = useInteraction();

  if (cameraMode !== "player") return null;
  if (!focused || holding || focused.kind !== "trigger") return null;

  const label = focused.label?.trim() ?? "";

  return (
    <div className="interact-prompt" aria-live="polite">
      <kbd className="interact-prompt__key">{INTERACT_KEY.toUpperCase()}</kbd>
      {label.length > 0 ? (
        <span className="interact-prompt__label">{label}</span>
      ) : null}
    </div>
  );
}
