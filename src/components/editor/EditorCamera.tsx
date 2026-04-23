import { useCameraMode } from "@/hooks/debug/useCameraMode";
import { OrbitControls } from "@react-three/drei";

export default function EditorCamera() {
  const cameraMode = useCameraMode();

  if (cameraMode === "debug") {
    return (
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={500}
        target={[0, 0, 0]}
        makeDefault
      />
    );
  }

  return null;
}
