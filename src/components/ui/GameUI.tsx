import { Crosshair } from "@/components/ui/Crosshair";
import { DebugOverlayLayout } from "@/components/ui/debug/DebugOverlayLayout";
import { GameSettingsMenu } from "@/components/ui/GameSettingsMenu";
import { HandTrackingVisualizer } from "@/components/ui/HandTrackingVisualizer";
import { InteractPrompt } from "@/components/ui/InteractPrompt";

export function GameUI(): React.JSX.Element {
  return (
    <>
      <DebugOverlayLayout />
      <Crosshair />
      <InteractPrompt />
      <HandTrackingVisualizer />
      <GameSettingsMenu />
    </>
  );
}
