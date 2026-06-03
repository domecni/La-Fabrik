import { useEffect, useRef } from "react";
import {
  EBIKE_DIAGNOSTIC_DIALOGUE_ID,
  EBIKE_REPAIRED_DIALOGUE_ID,
  EBIKE_SCAN_HINT_DIALOGUE_ID,
} from "@/data/ebike/ebikeConfig";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useSubtitleStore } from "@/managers/stores/useSubtitleStore";
import type { MissionStep } from "@/types/gameplay/repairMission";
import { loadDialogueManifest } from "@/utils/dialogues/loadDialogueManifest";
import { playDialogueById } from "@/utils/dialogues/playDialogue";

/**
 * Plays narrator cues during the ebike repair game:
 * - `fragmented`  -> "Alors? Pas magnifique ça?... ces galets vont scanner..."
 * - `repairing`   -> "Parfait! C'est le refroidisseur qui a lâché..."
 * - `done`        -> "Eeeet voilà! Il fonctionne comme une horloge!..."
 *
 * Each cue is one-shot per mission run; the played-set resets when the
 * mission state rolls back to `waiting` so debug-panel replays still
 * trigger the narration.
 *
 * Audio AND subtitles are strictly scoped to `mainState === "ebike"`. If
 * the player leaves the ebike main state mid-line (debug panel jump,
 * mission transition, etc.), the active audio is paused and the
 * subtitle is force-cleared so nothing bleeds into pylon/farm/outro.
 */
const STEP_TO_DIALOGUE_ID: Partial<Record<MissionStep, string>> = {
  fragmented: EBIKE_SCAN_HINT_DIALOGUE_ID,
  repairing: EBIKE_DIAGNOSTIC_DIALOGUE_ID,
  done: EBIKE_REPAIRED_DIALOGUE_ID,
};

function stopAudio(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  if (!audio.paused) {
    audio.pause();
    audio.currentTime = 0;
  }
}

export function EbikeRepairNarrator(): null {
  const mainState = useGameStore((state) => state.mainState);
  const ebikeStep = useGameStore((state) => state.ebike.currentStep);
  const playedRef = useRef<Set<MissionStep>>(new Set());
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (ebikeStep === "waiting") {
      playedRef.current.clear();
    }
  }, [ebikeStep]);

  // Belt-and-suspenders: any time we are NOT in the ebike main state,
  // make sure no narrator audio or subtitle from this component is
  // lingering. This catches races where the audio started a tick before
  // the main state flipped and the per-step cleanup hadn't propagated
  // yet (subtitle event still queued, etc.).
  useEffect(() => {
    if (mainState === "ebike") return;
    stopAudio(activeAudioRef.current);
    activeAudioRef.current = null;
    useSubtitleStore.getState().clearActiveSubtitle();
  }, [mainState]);

  useEffect(() => {
    if (mainState !== "ebike") return;

    const dialogueId = STEP_TO_DIALOGUE_ID[ebikeStep];
    if (!dialogueId) return;
    if (playedRef.current.has(ebikeStep)) return;

    playedRef.current.add(ebikeStep);

    let cancelled = false;

    void (async () => {
      const manifest = await loadDialogueManifest();
      if (cancelled || !manifest) return;
      const audio = await playDialogueById(manifest, dialogueId);
      if (cancelled) {
        stopAudio(audio);
        useSubtitleStore.getState().clearActiveSubtitle();
        return;
      }
      activeAudioRef.current = audio;
    })();

    return () => {
      cancelled = true;
      stopAudio(activeAudioRef.current);
      activeAudioRef.current = null;
      useSubtitleStore.getState().clearActiveSubtitle();
    };
  }, [mainState, ebikeStep]);

  return null;
}
