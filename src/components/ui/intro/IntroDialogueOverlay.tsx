import { useEffect } from "react";
import { Subtitles } from "@/components/ui/Subtitles";
import { useGameStore } from "@/managers/stores/useGameStore";
import { SITE_DIALOGUE_IDS } from "@/data/site/dialogueIds";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import {
  playDialogueById,
  stopCurrentDialogue,
} from "@/utils/dialogues/playDialogue";

const DIALOGUE_FALLBACK_TIMEOUT_MS = 12000;

/**
 * Black screen overlay that plays the intro dialogue (with synced subtitles)
 * via the dialogue manifest, then transitions to the reveal step.
 */
export function IntroDialogueOverlay(): React.JSX.Element {
  const setIntroStep = useGameStore((state) => state.setIntroStep);

  useEffect(() => {
    let cancelled = false;
    let safetyTimeoutId: number | null = null;

    const advance = (): void => {
      if (cancelled) return;
      if (safetyTimeoutId !== null) window.clearTimeout(safetyTimeoutId);
      setIntroStep("reveal");
    };

    void (async () => {
      const manifest = await loadDialogueManifest();
      if (cancelled) return;

      const audio = manifest
        ? await playDialogueById(manifest, SITE_DIALOGUE_IDS.introOrder)
        : null;
      if (cancelled) return;

      if (!audio) {
        advance();
        return;
      }

      safetyTimeoutId = window.setTimeout(
        advance,
        DIALOGUE_FALLBACK_TIMEOUT_MS,
      );
      audio.addEventListener("ended", advance, { once: true });
    })();

    return () => {
      cancelled = true;
      if (safetyTimeoutId !== null) window.clearTimeout(safetyTimeoutId);
      stopCurrentDialogue();
    };
  }, [setIntroStep]);

  return (
    <div
      role="region"
      aria-label="Dialogue d'introduction"
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 999,
      }}
    >
      <Subtitles />
    </div>
  );
}
