import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSiteStore } from "@/managers/stores/useSiteStore";
import { Subtitles } from "@/components/ui/Subtitles";
import { setSiteVisited } from "@/utils/cookies/siteVisitCookie";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import {
  playDialogueById,
  stopCurrentDialogue,
} from "@/utils/dialogues/playDialogue";
import { SITE_DIALOGUE_IDS } from "@/data/site/dialogueIds";
import { usePrefersReducedMotion } from "@/hooks/ui/usePrefersReducedMotion";

const FADE_DURATION_MS = 1000;
const DIALOGUE_FALLBACK_TIMEOUT_MS = 12000;
const NO_DIALOGUE_FALLBACK_MS = 3000;

/**
 * Transition overlay: black screen with transition dialogue and subtitles,
 * then redirect to /. A safety timeout guarantees the redirect happens even if
 * the dialogue audio fails to fire `ended`.
 */
export function SiteTransitionOverlay(): React.JSX.Element {
  const navigate = useNavigate();
  const reset = useSiteStore((state) => state.reset);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [screenOpacity, setScreenOpacity] = useState(0);

  useEffect(() => {
    setSiteVisited();

    let isCancelled = false;
    const timeoutIds: number[] = [];

    // Defer the opacity flip one tick so the CSS transition has an
    // initial frame at opacity 0 before flipping to 1.
    const fadeInId = window.setTimeout(() => {
      setScreenOpacity(1);
    }, 0);
    timeoutIds.push(fadeInId);

    const redirectToGame = (): void => {
      if (isCancelled) return;
      const id = window.setTimeout(() => {
        if (isCancelled) return;
        reset();
        navigate({ to: "/" });
      }, FADE_DURATION_MS);
      timeoutIds.push(id);
    };

    void (async () => {
      const manifest = await loadDialogueManifest();
      if (isCancelled) return;

      const dialogueAudio = manifest
        ? await playDialogueById(manifest, SITE_DIALOGUE_IDS.transition)
        : null;
      if (isCancelled) return;

      if (dialogueAudio) {
        const safetyId = window.setTimeout(
          redirectToGame,
          DIALOGUE_FALLBACK_TIMEOUT_MS,
        );
        timeoutIds.push(safetyId);

        dialogueAudio.addEventListener(
          "ended",
          () => {
            window.clearTimeout(safetyId);
            redirectToGame();
          },
          { once: true },
        );
        return;
      }

      const fallbackId = window.setTimeout(
        redirectToGame,
        NO_DIALOGUE_FALLBACK_MS,
      );
      timeoutIds.push(fallbackId);
    })();

    return () => {
      isCancelled = true;
      timeoutIds.forEach(window.clearTimeout);
      stopCurrentDialogue();
    };
  }, [navigate, reset]);

  const fadeTransition = prefersReducedMotion
    ? "none"
    : `opacity ${FADE_DURATION_MS}ms ease-in-out`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#000",
          zIndex: 0,
          opacity: screenOpacity,
          transition: fadeTransition,
        }}
      />
      {/* Subtitles must live inside this overlay's stacking context
          (z-index 1000) so they render above the black screen. The
          <Subtitles /> in SiteLayout sits behind this overlay. */}
      <Subtitles />
    </div>
  );
}
