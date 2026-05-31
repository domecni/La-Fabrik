import { AudioManager } from "@/managers/AudioManager";
import { useSettingsStore } from "@/managers/stores/useSettingsStore";
import { useSubtitleStore } from "@/managers/stores/useSubtitleStore";
import type { DialogueManifest } from "@/types/dialogues/dialogues";
import { logger } from "@/utils/core/Logger";
import { loadDialogueSubtitleCues } from "@/utils/dialogues/loadDialogueManifest";
import type { SubtitleCue } from "@/utils/subtitles/parseSrt";

interface QueuedDialogueRequest {
  manifest: DialogueManifest;
  dialogueId: string;
  resolve: (audio: HTMLAudioElement | null) => void;
}

const DIALOGUE_PLAY_START_TIMEOUT_MS = 800;
const dialogueQueue: QueuedDialogueRequest[] = [];
let isDialogueQueuePlaying = false;

let currentDialogueAudio: HTMLAudioElement | null = null;

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

export function stopCurrentDialogue(): void {
  if (currentDialogueAudio && !currentDialogueAudio.paused) {
    currentDialogueAudio.pause();
    currentDialogueAudio.currentTime = 0;
  }
  currentDialogueAudio = null;
  useSubtitleStore.getState().clearActiveSubtitle();
}

export async function playDialogueById(
  manifest: DialogueManifest,
  dialogueId: string,
): Promise<HTMLAudioElement | null> {
  stopCurrentDialogue();

  const dialogue = manifest.dialogues.find((item) => item.id === dialogueId);
  if (!dialogue) return null;

  const subtitleLanguage = useSettingsStore.getState().subtitleLanguage;
  const subtitleData = await loadDialogueSubtitleCues(
    manifest,
    dialogue,
    subtitleLanguage,
  );
  const audio = AudioManager.getInstance().playSound(dialogue.audio, 1, {
    category: "dialogue",
  });

  currentDialogueAudio = audio;

  if (!subtitleData || subtitleData.cues.length === 0) return audio;

  const { voice, cues } = subtitleData;

  const clearSubtitle = (): void => {
    useSubtitleStore.getState().clearActiveSubtitle();
  };

  const cleanup = (): void => {
    audio.removeEventListener("play", syncSubtitle);
    audio.removeEventListener("timeupdate", syncSubtitle);
    audio.removeEventListener("ended", cleanup);
    audio.removeEventListener("pause", cleanup);
    clearSubtitle();
    if (currentDialogueAudio === audio) {
      currentDialogueAudio = null;
    }
  };

  const findActiveCue = (currentTime: number): SubtitleCue | null => {
    for (const cue of cues) {
      if (currentTime >= cue.startTime && currentTime <= cue.endTime) {
        return cue;
      }
    }
    return null;
  };

  const syncSubtitle = (): void => {
    const currentTime = audio.currentTime;
    const activeCue = findActiveCue(currentTime);

    if (activeCue) {
      useSubtitleStore.getState().setActiveSubtitle({
        speaker: voice.speaker,
        text: activeCue.text,
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
