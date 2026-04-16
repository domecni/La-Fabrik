import { Suspense } from "react";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { DebugCameraControls } from "@/utils/debug/scene/DebugCameraControls";
import { DebugHelpers } from "@/utils/debug/scene/DebugHelpers";
import { Environment } from "@/world/Environment";
import { Lighting } from "@/world/Lighting";
import { Map } from "@/world/Map";
import { PlayerComponent } from "@/world/player/PlayerComponent";

export function World(): React.JSX.Element {
  const cameraMode = useCameraMode();

  return (
    <>
      <Environment />
      <Lighting />
      <DebugHelpers />
      {cameraMode === "debug" ? <DebugCameraControls /> : <PlayerComponent />}
      <Suspense fallback={null}>
        <Map />
      </Suspense>
    </>
  );
}
