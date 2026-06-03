import { useEffect, useRef } from "react";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useSubtitleStore } from "@/managers/stores/useSubtitleStore";
import { AudioManager } from "@/managers/AudioManager";

const HISTOIRE_AUDIO_PATH =
  "/sounds/dialogue/narrateur_histoireelectricienne.mp3";
const OUTRO_DELAY_MS = 5_000; // delay after audio ends before transitioning to outro

/**
 * Text blocks for the electricienne history narration (max 5 lines each).
 * Displayed sequentially — timings are calculated dynamically from the actual
 * audio duration so they are always correct regardless of the mp3 length.
 */
const HISTOIRE_BLOCKS = [
  "L'électricienne t'a aidé à la Centrale ? Aaaaah c'est ça que j'adore ici, tout le monde s'entraide, personne se juge, une vraie petite famille.",
  "Sache que l'électricienne a une histoire assez particulière. Elle est née au nord du continent, dans la ville de Kalska. Elle a grandit heureuse, avec sa mère Edith, son père Jordan et ses deux petits frères Malo et Justin.",
  "Il y a quelques années de ça, comme tu le sais, c'est les pays du Nord, qui par grande surprise, ont été obligés de migrer en premier. Ils ont alors entamé leur périple, pays par pays, ville par ville, village par village.",
  "Un jour de marche comme les autres depuis plusieurs mois, une tempête climatique les a pris de court. S'étant séparés pour trouver des vivres dans le village, le père et un des deux frères sont malheureusement partis. C'est tragique.",
  "Mais un beau jour, ils sont tombés ici, par hasard dans leur périple. On les a accueillis les bras ouverts et ils ont pu se reconstruire doucement parmi nous et font partie intégrante de la communauté aujourd'hui.",
] as const;

const TOTAL_CHARS = HISTOIRE_BLOCKS.reduce((sum, b) => sum + b.length, 0);

/** Compute start/end times for each block based on actual audio duration. */
function buildBlockTimings(
  duration: number,
): Array<{ start: number; end: number }> {
  let t = 0;
  return HISTOIRE_BLOCKS.map((block) => {
    const blockDuration = (block.length / TOTAL_CHARS) * duration;
    const start = t;
    t += blockDuration;
    return { start, end: t };
  });
}

/**
 * Play the histoire audio and keep `useSubtitleStore` in sync with
 * dynamically-computed block boundaries.
 * Movement is intentionally NOT blocked so the player can explore while
 * listening to the narration.
 * `onAudioEnded` fires once when the audio element emits "ended".
 */
function useHistoireSubtitlePlayback(
  enabled: boolean,
  onAudioEnded?: () => void,
): void {
  // Keep callback in a ref so the effect doesn't need it as a dependency.
  const onAudioEndedRef = useRef(onAudioEnded);
  useEffect(() => {
    onAudioEndedRef.current = onAudioEnded;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    let isCancelled = false;

    const audio = AudioManager.getInstance().playSound(HISTOIRE_AUDIO_PATH, 1, {
      category: "dialogue",
    });

    if (!audio) return undefined;

    const { setActiveSubtitle, clearActiveSubtitle } =
      useSubtitleStore.getState();

    /** Wire up block-level subtitle sync once we know the audio duration. */
    function startSync(): void {
      const duration = audio.duration;
      if (!duration || isNaN(duration) || isCancelled) return;

      const timings = buildBlockTimings(duration);

      function onTimeUpdate(): void {
        const t = audio.currentTime;
        const idx = timings.findIndex(
          ({ start, end }) => t >= start && t < end,
        );
        if (idx >= 0) {
          const text = HISTOIRE_BLOCKS[idx];
          if (text === undefined) return;

          setActiveSubtitle({
            speaker: "Narrateur",
            text,
          });
        }
      }

      function onEnded(): void {
        clearActiveSubtitle();
        onAudioEndedRef.current?.();
      }

      audio.addEventListener("timeupdate", onTimeUpdate);
      audio.addEventListener("ended", onEnded, { once: true });
    }

    // If duration is already known (cached audio), start immediately.
    if (audio.duration && !isNaN(audio.duration)) {
      startSync();
    } else {
      audio.addEventListener("loadedmetadata", startSync, { once: true });
    }

    return () => {
      isCancelled = true;
      audio.pause();
      useSubtitleStore.getState().clearActiveSubtitle();
    };
  }, [enabled]);
}

/**
 * Handles the farm mission narrative intro:
 *   locked → (auto) → electricienne_history → plays audio with block subtitles
 *                   → 5 s after audio ends → completeMission("farm") → outro
 */
export function FarmNarrativeFlow(): null {
  const mainState = useGameStore((state) => state.mainState);
  const step = useGameStore((state) => state.farm.currentStep);
  const setMissionStep = useGameStore((state) => state.setMissionStep);
  const completeMission = useGameStore((state) => state.completeMission);

  // locked is purely a gate — transition immediately to electricienne_history.
  useEffect(() => {
    if (mainState !== "farm" || step !== "locked") return;
    setMissionStep("farm", "electricienne_history");
  }, [mainState, step, setMissionStep]);

  // Ensure movement is always allowed during the electricienne_history narration,
  // regardless of what the previous step may have blocked.
  const setCanMove = useGameStore((state) => state.setCanMove);
  useEffect(() => {
    if (mainState !== "farm" || step !== "electricienne_history") return;
    setCanMove(true);
  }, [mainState, step, setCanMove]);

  // After the audio finishes, wait 5 s then transition to outro.
  // The timeout ID is kept in a ref so we can cancel on unmount.
  const outroTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (outroTimeoutRef.current !== null) {
        window.clearTimeout(outroTimeoutRef.current);
      }
    };
  }, []);

  const handleAudioEnded = (): void => {
    if (outroTimeoutRef.current !== null) {
      window.clearTimeout(outroTimeoutRef.current);
    }
    outroTimeoutRef.current = window.setTimeout(() => {
      outroTimeoutRef.current = null;
      completeMission("farm");
    }, OUTRO_DELAY_MS);
  };

  useHistoireSubtitlePlayback(
    mainState === "farm" && step === "electricienne_history",
    handleAudioEnded,
  );

  return null;
}
