import { AudioManager } from "@/managers/AudioManager";
import { useSettingsStore } from "@/managers/stores/useSettingsStore";
import { useSubtitleStore } from "@/managers/stores/useSubtitleStore";
import type { DialogueManifest } from "@/types/dialogues/dialogues";
import { logger } from "@/utils/core/Logger";
import { loadDialogueSubtitleCue } from "@/utils/dialogues/loadDialogueManifest";

interface QueuedDialogueRequest {
  manifest: DialogueManifest;
  dialogueId: string;
  resolve: (audio: HTMLAudioElement | null) => void;
}

const DIALOGUE_PLAY_START_TIMEOUT_MS = 800;
const dialogueQueue: QueuedDialogueRequest[] = [];
let isDialogueQueuePlaying = false;

export function queueDialogueById(
  manifest: DialogueManifest,
  dialogueId: string,
): Promise<HTMLAudioElement | null> {
  return new Promise((resolve) => {
    dialogueQueue.push({ manifest, dialogueId, resolve });
    void playNextQueuedDialogue();
  });
}

export function clearQueuedDialogues(): void {
  while (dialogueQueue.length > 0) {
    dialogueQueue.shift()?.resolve(null);
  }
}

export async function playDialogueById(
  manifest: DialogueManifest,
  dialogueId: string,
): Promise<HTMLAudioElement | null> {
  const dialogue = manifest.dialogues.find((item) => item.id === dialogueId);
  if (!dialogue) return null;

  const subtitleLanguage = useSettingsStore.getState().subtitleLanguage;
  const subtitle = await loadDialogueSubtitleCue(
    manifest,
    dialogue,
    subtitleLanguage,
  );
  const audio = AudioManager.getInstance().playSound(dialogue.audio, 1, {
    category: "dialogue",
  });

  if (!subtitle) return audio;

  const clearSubtitle = (): void => {
    useSubtitleStore.getState().clearActiveSubtitle();
  };

  const cleanup = (): void => {
    audio.removeEventListener("play", syncSubtitle);
    audio.removeEventListener("timeupdate", syncSubtitle);
    audio.removeEventListener("ended", cleanup);
    audio.removeEventListener("pause", cleanup);
    clearSubtitle();
  };

  const syncSubtitle = (): void => {
    const currentTime = audio.currentTime;
    const shouldShowSubtitle =
      currentTime >= subtitle.cue.startTime &&
      currentTime <= subtitle.cue.endTime;

    if (shouldShowSubtitle) {
      useSubtitleStore.getState().setActiveSubtitle({
        speaker: subtitle.voice.speaker,
        text: subtitle.cue.text,
      });
      return;
    }

    clearSubtitle();
  };

  audio.addEventListener("play", syncSubtitle);
  audio.addEventListener("timeupdate", syncSubtitle);
  audio.addEventListener("ended", cleanup);
  audio.addEventListener("pause", cleanup);

  return audio;
}

async function playNextQueuedDialogue(): Promise<void> {
  if (isDialogueQueuePlaying) return;

  isDialogueQueuePlaying = true;

  while (dialogueQueue.length > 0) {
    const request = dialogueQueue.shift();
    if (!request) continue;

    try {
      const audio = await playDialogueById(
        request.manifest,
        request.dialogueId,
      );
      request.resolve(audio);
      if (audio) await waitForDialogueToFinish(audio);
    } catch (error) {
      logger.error("Dialogues", "Failed to play queued dialogue", {
        dialogueId: request.dialogueId,
        error: error instanceof Error ? error : String(error),
      });
      request.resolve(null);
    }
  }

  isDialogueQueuePlaying = false;
}

function waitForDialogueToFinish(audio: HTMLAudioElement): Promise<void> {
  if (audio.ended) return Promise.resolve();

  return new Promise((resolve) => {
    let hasStarted = !audio.paused;
    let startTimeout: ReturnType<typeof setTimeout> | null = null;

    function cleanup(): void {
      if (startTimeout) clearTimeout(startTimeout);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("ended", finish);
      audio.removeEventListener("pause", finish);
      audio.removeEventListener("error", finish);
    }

    function finish(): void {
      cleanup();
      resolve();
    }

    function handlePlay(): void {
      hasStarted = true;
      if (startTimeout) clearTimeout(startTimeout);
    }

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("ended", finish);
    audio.addEventListener("pause", finish);
    audio.addEventListener("error", finish);

    startTimeout = setTimeout(() => {
      if (!hasStarted && audio.paused) finish();
    }, DIALOGUE_PLAY_START_TIMEOUT_MS);
  });
}
