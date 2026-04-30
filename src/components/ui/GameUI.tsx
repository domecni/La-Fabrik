import { Crosshair } from "@/components/ui/Crosshair";
import { GameStateHUD } from "@/components/ui/GameStateHUD";
import { InteractPrompt } from "@/components/ui/InteractPrompt";

export function GameUI(): React.JSX.Element {
  return (
    <>
      <GameStateHUD />
      <Crosshair />
      <InteractPrompt />
    </>
  );
}
