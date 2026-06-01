import { Crosshair } from "@/components/ui/Crosshair";
import { DebugOverlayLayout } from "@/components/ui/debug/DebugOverlayLayout";
import { GameSettingsMenu } from "@/components/ui/GameSettingsMenu";
import { HandTrackingVisualizer } from "@/components/ui/HandTrackingVisualizer";
import { InteractPrompt } from "@/components/ui/InteractPrompt";
import { RepairMovementLockIndicator } from "@/components/ui/RepairMovementLockIndicator";
import { Subtitles } from "@/components/ui/Subtitles";
import { TalkieDialogueOverlay } from "@/components/ui/TalkieDialogueOverlay";

export function GameUI(): React.JSX.Element {
  return (
    <>
      <DebugOverlayLayout />
      <Crosshair />
      <RepairMovementLockIndicator />
      <InteractPrompt />
      <HandTrackingVisualizer />
      <Subtitles />
      <TalkieDialogueOverlay />
      <GameSettingsMenu />
    </>
  );
}
