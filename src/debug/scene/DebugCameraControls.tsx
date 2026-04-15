import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Debug } from "@/debug/Debug";

export function DebugCameraControls(): React.JSX.Element {
  const controls = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    const debug = Debug.getInstance();

    if (!debug.active || !controls.current) {
      return undefined;
    }

    const folder = debug.createFolder("Camera");

    if (!folder) {
      return undefined;
    }

    const target = controls.current.target;
    const cameraState = {
      targetX: target.x,
      targetY: target.y,
      targetZ: target.z,
    };

    const syncTarget = (): void => {
      if (!controls.current) {
        return;
      }

      controls.current.target.set(
        cameraState.targetX,
        cameraState.targetY,
        cameraState.targetZ,
      );
      controls.current.update();
    };

    folder
      .add(cameraState, "targetX", -100, 100, 0.1)
      .name("Target X")
      .onChange(syncTarget);
    folder
      .add(cameraState, "targetY", -20, 50, 0.1)
      .name("Target Y")
      .onChange(syncTarget);
    folder
      .add(cameraState, "targetZ", -100, 100, 0.1)
      .name("Target Z")
      .onChange(syncTarget);

    return undefined;
  }, []);

  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.08}
      minDistance={20}
      maxDistance={220}
      target={[0, 12, 0]}
    />
  );
}
