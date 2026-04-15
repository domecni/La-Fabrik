import { Suspense } from "react";
import { DebugCameraControls } from "@/debug/scene/DebugCameraControls";
import { DebugHelpers } from "@/debug/scene/DebugHelpers";
import { Environment } from "@/world/Environment";
import { Lighting } from "@/world/Lighting";
import { Map } from "@/world/Map";

export function World(): React.JSX.Element {
  return (
    <>
      <Environment />
      <Lighting />
      <DebugHelpers />
      <DebugCameraControls />
      <Suspense fallback={null}>
        <Map />
      </Suspense>
    </>
  );
}
