import { useEffect, useState } from "react";
import { Hand } from "lucide-react";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";
import type { MissionStep } from "@/types/gameplay/repairMission";
import { TutorialOverlay } from "@/components/ui/tutorial/TutorialOverlay";

// Repair steps where the hand-tracking tutorial is allowed to display. Covers
// the no-hand-tracking phase (fragmented, scanning) and the first hand-driven
// step (inspected) — beyond that the player has presumably learned.
const HAND_TUTORIAL_STEPS: ReadonlySet<MissionStep> = new Set([
  "fragmented",
  "scanning",
  "inspected",
]);

/**
 * First-time hand-tracking tutorial. Visible during the early ebike repair
 * steps until MediaPipe actually detects a hand on screen. Once dismissed it
 * stays dismissed for the session.
 */
export function HandTrackingTutorial(): React.JSX.Element | null {
  const mainState = useGameStore((state) => state.mainState);
  const ebikeStep = useGameStore((state) => state.ebike.currentStep);
  const { hands, status } = useHandTrackingSnapshot();
  const [dismissed, setDismissed] = useState(false);

  const isInShowWindow =
    mainState === "ebike" && HAND_TUTORIAL_STEPS.has(ebikeStep);
  const handsDetected = status !== "idle" && hands.length > 0;

  useEffect(() => {
    if (handsDetected && !dismissed) {
      // Sync the persistent dismissal flag with an external signal (the
      // hand-tracking snapshot). Same shape as the resync pattern used
      // elsewhere in the repo (e.g. PylonDownedPylon).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(true);
    }
  }, [handsDetected, dismissed]);

  if (!isInShowWindow || dismissed) return null;

  return (
    <TutorialOverlay
      icon={
        <div className="tutorial-overlay__hands">
          <Hand size={96} strokeWidth={1.5} />
          <Hand
            size={96}
            strokeWidth={1.5}
            style={{ transform: "scaleX(-1)" }}
          />
        </div>
      }
      text="Placez vos mains devant la caméra pour attraper les pièces. Sinon, utilisez la souris."
    />
  );
}
