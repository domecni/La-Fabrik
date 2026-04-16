import { PlayerCamera } from "@/world/player/PlayerCamera";
import { PlayerController } from "@/world/player/PlayerController";

export function PlayerComponent(): React.JSX.Element {
  return (
    <>
      <PlayerCamera />
      <PlayerController />
    </>
  );
}
