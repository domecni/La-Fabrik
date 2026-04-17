import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { DebugCameraControls } from "@/utils/debug/scene/DebugCameraControls";
import { DebugHelpers } from "@/utils/debug/scene/DebugHelpers";
import { Environment } from "@/world/Environment";
import { Lighting } from "@/world/Lighting";
import { GrabCube } from "@/world/objects/GrabCube";
import { TriggerSphere } from "@/world/objects/TriggerSphere";
import { PlayerComponent } from "@/world/player/PlayerComponent";

export function World(): React.JSX.Element {
  const cameraMode = useCameraMode();

  return (
    <>
      <Environment />
      <Lighting />
      <DebugHelpers />
      {cameraMode === "debug" ? <DebugCameraControls /> : null}
      <Physics>
        <RigidBody type="fixed">
          <CuboidCollider args={[50, 0.1, 50]} position={[0, -0.1, 0]} />
        </RigidBody>
        <GrabCube />
        <TriggerSphere />
        {cameraMode === "debug" ? null : <PlayerComponent />}
      </Physics>
    </>
  );
}
