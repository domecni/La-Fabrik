import { useEffect } from "react";
import { PointerLockControls } from "@react-three/drei";

export const PLAYER_EYE_HEIGHT = 1.75;

export function PlayerCamera(): React.JSX.Element {
  useEffect(() => {
    return () => {
      document.exitPointerLock();
    };
  }, []);

  return <PointerLockControls />;
}
