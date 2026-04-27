import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { useInteraction } from "@/hooks/useInteraction";

export function Crosshair(): React.JSX.Element | null {
  const cameraMode = useCameraMode();
  const { focused } = useInteraction();

  if (cameraMode !== "player") return null;

  return (
    <div
      className={focused ? "crosshair crosshair--interact" : "crosshair"}
      aria-hidden="true"
    />
  );
}
