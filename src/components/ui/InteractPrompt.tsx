import { INTERACT_KEY } from "@/data/keybindings";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useInteraction } from "@/hooks/useInteraction";

export function InteractPrompt(): React.JSX.Element | null {
  const cameraMode = useCameraMode();
  const { focused, holding } = useInteraction();

  if (cameraMode !== "player") return null;
  if (!focused || holding || focused.kind !== "trigger") return null;

  return (
    <div className="interact-prompt" aria-live="polite">
      <kbd className="interact-prompt__key">{INTERACT_KEY.toUpperCase()}</kbd>
      <span className="interact-prompt__label">{focused.label}</span>
    </div>
  );
}
