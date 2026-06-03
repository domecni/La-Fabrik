import { Crosshair } from "@/components/ui/Crosshair";
import { DebugOverlayLayout } from "@/components/ui/debug/DebugOverlayLayout";
import { GameSettingsMenu } from "@/components/ui/GameSettingsMenu";
import { HandTrackingFallback } from "@/components/ui/HandTrackingFallback";
import { HandTrackingVisualizer } from "@/components/ui/HandTrackingVisualizer";
import { InteractPrompt } from "@/components/ui/InteractPrompt";
import { OutroVideoOverlay } from "@/components/ui/OutroVideoOverlay";
import { Subtitles } from "@/components/ui/Subtitles";
import { TalkieDialogueOverlay } from "@/components/ui/TalkieDialogueOverlay";
import { HandTrackingTutorial } from "@/components/ui/tutorial/HandTrackingTutorial";
import { MovementTutorial } from "@/components/ui/tutorial/MovementTutorial";

export function GameUI(): React.JSX.Element {
  return (
    <>
      <DebugOverlayLayout />
      <Crosshair />
      <InteractPrompt />
      <HandTrackingVisualizer />
      <HandTrackingFallback />
      <MovementTutorial />
      <HandTrackingTutorial />
      <Subtitles />
      <TalkieDialogueOverlay />
      <GameSettingsMenu />
      <OutroVideoOverlay />
    </>
  );
}
