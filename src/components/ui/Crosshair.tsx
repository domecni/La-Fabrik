import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useInteractionSelector } from "@/hooks/useInteraction";

export function Crosshair(): React.JSX.Element | null {
  const cameraMode = useCameraMode();
  const focused = useInteractionSelector((state) => state.focused);

  if (cameraMode !== "player") return null;

  return (
    <div
      className={focused ? "crosshair crosshair--interact" : "crosshair"}
      aria-hidden="true"
    />
  );
}
