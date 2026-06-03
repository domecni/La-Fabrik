import { useEffect, useState } from "react";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useSiteStore } from "@/managers/stores/useSiteStore";
import { useSettingsStore } from "@/managers/stores/useSettingsStore";
import { SiteButton } from "@/components/site/SiteButton";
import { SITE_CONFIG } from "@/data/site/siteConfig";
import { SITE_DIALOGUE_IDS } from "@/data/site/dialogueIds";
import {
  loadDialogueManifest,
  loadDialogueSubtitleCues,
} from "@/utils/dialogues/loadDialogueManifest";
import {
  playDialogueById,
  stopCurrentDialogue,
} from "@/utils/dialogues/playDialogue";

const TYPEWRITER_CHAR_DELAY_MS = 150;
// Fallback in case nothing else triggers the typewriter (audio failed to
// load, no subtitles, "ended" never fires). Long enough not to fire
// before the narration on a slow load.
const AUDIO_END_FALLBACK_MS = 8000;

/**
 * Screen 3: Name reveal
 * The player's preset name is revealed letter-by-letter inside the input
 * once the naming dialogue finishes playing. The confirm button stays
 * locked until the reveal completes. No user typing — the input is
 * read-only and just acts as a typewriter target.
 */
export function SiteNamingScreen(): React.JSX.Element {
  const setStep = useSiteStore((state) => state.setStep);
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  const [revealedChars, setRevealedChars] = useState(0);
  const [typewriterStarted, setTypewriterStarted] = useState(false);

  const presetPlayerName = SITE_CONFIG.presetPlayerName;
  const displayValue = presetPlayerName.slice(0, revealedChars);
  const isComplete = revealedChars >= presetPlayerName.length;

  // Play the dialogue, then trigger the typewriter so it FINISHES at the
  // same moment the narration ends. We compute that moment from the SRT
  // cues: the last cue's endTime is where the narrator stops speaking,
  // so we start typing `typewriterDuration` before that.
  useEffect(() => {
    let cancelled = false;
    let audioElement: HTMLAudioElement | null = null;
    let onTimeUpdate: (() => void) | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const start = (): void => {
      if (cancelled) return;
      setTypewriterStarted(true);
    };

    const typewriterDurationSec =
      (TYPEWRITER_CHAR_DELAY_MS * presetPlayerName.length) / 1000;

    void (async () => {
      const manifest = await loadDialogueManifest();
      if (cancelled) return;
      if (!manifest) {
        start();
        return;
      }

      // Resolve the dialogue + its SRT cues for the active subtitle language.
      const dialogue = manifest.dialogues.find(
        (item) => item.id === SITE_DIALOGUE_IDS.naming,
      );
      const language = useSettingsStore.getState().subtitleLanguage;
      const subtitleData = dialogue
        ? await loadDialogueSubtitleCues(manifest, dialogue, language)
        : null;
      if (cancelled) return;

      audioElement = await playDialogueById(manifest, SITE_DIALOGUE_IDS.naming);
      if (cancelled) return;
      if (!audioElement) {
        start();
        return;
      }

      const lastCue = subtitleData?.cues[subtitleData.cues.length - 1];
      if (lastCue) {
        // Trigger so the typewriter ends at the narration's end.
        const audio = audioElement;
        const triggerAt = Math.max(0, lastCue.endTime - typewriterDurationSec);
        onTimeUpdate = (): void => {
          if (audio.currentTime >= triggerAt) {
            audio.removeEventListener("timeupdate", onTimeUpdate!);
            start();
          }
        };
        audio.addEventListener("timeupdate", onTimeUpdate);
      } else {
        // No SRT data — fall back to the audio "ended" event.
        audioElement.addEventListener("ended", start, { once: true });
      }

      fallbackTimer = setTimeout(start, AUDIO_END_FALLBACK_MS);
    })();

    return () => {
      cancelled = true;
      if (fallbackTimer !== null) clearTimeout(fallbackTimer);
      if (audioElement) {
        if (onTimeUpdate) {
          audioElement.removeEventListener("timeupdate", onTimeUpdate);
        }
        audioElement.removeEventListener("ended", start);
      }
      stopCurrentDialogue();
    };
  }, [presetPlayerName.length]);

  // Reveal the preset name one character at a time once the typewriter
  // has been triggered.
  useEffect(() => {
    if (!typewriterStarted) return;
    const interval = setInterval(() => {
      setRevealedChars((current) => {
        if (current >= presetPlayerName.length) {
          clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, TYPEWRITER_CHAR_DELAY_MS);
    return () => clearInterval(interval);
  }, [typewriterStarted, presetPlayerName.length]);

  const handleConfirm = (): void => {
    if (isComplete) {
      setPlayerName(presetPlayerName);
      setStep("transition");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 80,
        padding: 24,
        width: "100%",
        maxWidth: 950,
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          gap: 48,
        }}
      >
        <h2
          id="player-name-label"
          style={{
            color: "#F2F2F2",
            textAlign: "center",
            textShadow: "0 7px 14.4px rgba(0, 0, 0, 0.25)",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "clamp(18px, 3vw, 26px)",
            fontStyle: "normal",
            fontWeight: 700,
            lineHeight: "normal",
            letterSpacing: "-1.3px",
            margin: 0,
          }}
        >
          Je suis…
        </h2>

        <input
          type="text"
          value={displayValue}
          readOnly
          tabIndex={-1}
          aria-labelledby="player-name-label"
          aria-live="polite"
          autoComplete="off"
          style={{
            display: "flex",
            padding: "clamp(8px, 1.5vw, 10px)",
            alignItems: "center",
            width: "100%",
            maxWidth: 800,
            minWidth: 280,
            gap: 10,
            border: "4px solid #FFF",
            background: "#D9D9D9",
            outline: "none",
            color: "#333",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "clamp(16px, 2.5vw, 20px)",
            textAlign: "left",
            boxSizing: "border-box",
          }}
        />
      </div>

      <SiteButton
        label="CONFIRMER"
        disabled={!isComplete}
        onClick={handleConfirm}
      />
    </div>
  );
}
