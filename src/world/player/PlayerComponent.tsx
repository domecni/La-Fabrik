import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PlayerCamera, PLAYER_EYE_HEIGHT } from "@/world/player/PlayerCamera";
import { PlayerController } from "@/world/player/PlayerController";

export function PlayerComponent(): React.JSX.Element {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(0, PLAYER_EYE_HEIGHT, 0);
  }, [camera]);

  return (
    <>
      <PlayerCamera />
      <PlayerController />
    </>
  );
}
