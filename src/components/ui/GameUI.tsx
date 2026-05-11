import { Crosshair } from "@/components/ui/Crosshair";
import { DebugOverlayLayout } from "@/components/ui/debug/DebugOverlayLayout";
import { HandTrackingVisualizer } from "@/components/ui/HandTrackingVisualizer";
import { InteractPrompt } from "@/components/ui/InteractPrompt";
import { RepairMovementLockIndicator } from "@/components/ui/RepairMovementLockIndicator";

export function GameUI(): React.JSX.Element {
  return (
    <>
      <DebugOverlayLayout />
      <Crosshair />
      <RepairMovementLockIndicator />
      <InteractPrompt />
      <HandTrackingVisualizer />
    </>
  );
}
