import { useEffect, useState } from "react";
import { useGameStore } from "@/managers/stores/useGameStore";
import type { GameStep } from "@/types/game";
import { TutorialOverlay } from "@/components/ui/tutorial/TutorialOverlay";

const MOVEMENT_KEYS = new Set(["z", "q", "s", "d"]);
// Intro steps where the movement tutorial is allowed to display. From the
// reveal fade through the free-walk window before the ebike mount.
const MOVEMENT_TUTORIAL_STEPS: ReadonlySet<GameStep> = new Set([
  "reveal",
  "await-ebike-mount",
]);

function KeyCap({ label }: { label: string }): React.JSX.Element {
  return <span className="tutorial-overlay__keycap">{label}</span>;
}

/**
 * First-time movement tutorial. Visible during the intro reveal and the
 * walk-around step before the ebike mount, until the player presses any
 * of Z, Q, S, D. Once dismissed it stays dismissed for the session.
 */
export function MovementTutorial(): React.JSX.Element | null {
  const introStep = useGameStore((state) => state.intro.currentStep);
  const [dismissed, setDismissed] = useState(false);

  const isInShowWindow = MOVEMENT_TUTORIAL_STEPS.has(introStep);

  useEffect(() => {
    if (dismissed) return;
    function onKeyDown(event: KeyboardEvent): void {
      if (MOVEMENT_KEYS.has(event.key.toLowerCase())) {
        setDismissed(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismissed]);

  if (!isInShowWindow || dismissed) return null;

  return (
    <TutorialOverlay
      icon={
        <div className="tutorial-overlay__keyboard">
          <span aria-hidden="true" />
          <KeyCap label="Z" />
          <span aria-hidden="true" />
          <KeyCap label="Q" />
          <KeyCap label="S" />
          <KeyCap label="D" />
        </div>
      }
      text="Utilisez le clavier et la souris pour vous déplacer."
    />
  );
}
