import { useEffect, useState } from "react";
import { useGameStore } from "@/managers/stores/useGameStore";
import { usePrefersReducedMotion } from "@/hooks/ui/usePrefersReducedMotion";

const REVEAL_DURATION_MS = 2000;

/**
 * Fade-out overlay revealing the game world.
 * Moves to the ebike onboarding step when the fade is done. The intro only
 * completes after the player rides the ebike and triggers the breakdown.
 */
export function IntroRevealOverlay(): React.JSX.Element {
  const setIntroStep = useGameStore((state) => state.setIntroStep);
  const setCanMove = useGameStore((state) => state.setCanMove);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const fadeTimeout = window.setTimeout(() => {
      setOpacity(0);
    }, 100);

    const completeTimeout = window.setTimeout(() => {
      setCanMove(true);
      setIntroStep("await-ebike-mount");
    }, REVEAL_DURATION_MS);

    return () => {
      window.clearTimeout(fadeTimeout);
      window.clearTimeout(completeTimeout);
    };
  }, [setCanMove, setIntroStep]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        opacity,
        transition: prefersReducedMotion
          ? "none"
          : `opacity ${REVEAL_DURATION_MS}ms ease-out`,
        zIndex: 998,
        pointerEvents: "none",
      }}
    />
  );
}
