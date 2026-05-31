import { useCallback, useEffect, useRef, useState } from "react";
import { useSiteStore } from "@/managers/stores/useSiteStore";
import { usePrefersReducedMotion } from "@/hooks/ui/usePrefersReducedMotion";

const DISCLAIMER_TEXT =
  "Ce site a été conçu pour être utilisé sur ordinateur.\nPour une meilleure expérience, assurez-vous d'avoir une bonne connexion internet et une machine performante.";

const TEXT_DISPLAY_DURATION = 5000;
const FADE_OUT_DURATION = 1000;
const TRANSITION_DELAY = 250;
const SKIP_KEYS = new Set(["Enter", " ", "Escape"]);

/**
 * Screen 0: Disclaimer
 */
export function SiteDisclaimerScreen(): React.JSX.Element {
  const setStep = useSiteStore((state) => state.setStep);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [textOpacity, setTextOpacity] = useState(prefersReducedMotion ? 1 : 0);
  const hasSkipped = useRef(false);

  const handleSkip = useCallback(() => {
    if (hasSkipped.current) return;
    hasSkipped.current = true;
    setStep("welcome");
  }, [setStep]);

  useEffect(() => {
    const fadeInTimeout = window.setTimeout(() => {
      setTextOpacity(1);
    }, 100);

    const fadeOutTimeout = window.setTimeout(() => {
      setTextOpacity(0);
    }, TEXT_DISPLAY_DURATION);

    const transitionTimeout = window.setTimeout(
      handleSkip,
      TEXT_DISPLAY_DURATION + FADE_OUT_DURATION + TRANSITION_DELAY,
    );

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (SKIP_KEYS.has(event.key)) {
        event.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(fadeInTimeout);
      window.clearTimeout(fadeOutTimeout);
      window.clearTimeout(transitionTimeout);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSkip]);

  return (
    <div
      role="region"
      aria-label="Avertissement"
      onClick={handleSkip}
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
        cursor: "pointer",
      }}
    >
      <p
        aria-live="polite"
        style={{
          color: "#F2F2F2",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 20,
          fontWeight: 400,
          lineHeight: 1.6,
          maxWidth: 800,
          opacity: textOpacity,
          transition: prefersReducedMotion
            ? "none"
            : `opacity ${FADE_OUT_DURATION}ms ease-in-out`,
          whiteSpace: "pre-wrap",
        }}
      >
        {DISCLAIMER_TEXT}
      </p>
    </div>
  );
}
