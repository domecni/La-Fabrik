import { useEffect } from "react";
import { PointerLockControls } from "@react-three/drei";

export function PlayerCamera(): React.JSX.Element {
  useEffect(() => {
    return () => {
      document.exitPointerLock();
    };
  }, []);

  return <PointerLockControls />;
}
