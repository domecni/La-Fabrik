import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import { setGlobalCamera } from "@/world/GameCinematics";

export function PlayerCamera(): React.JSX.Element {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    setGlobalCamera(camera);
    return () => {
      setGlobalCamera(null);
      document.exitPointerLock();
    };
  }, [camera]);

  return <PointerLockControls />;
}
