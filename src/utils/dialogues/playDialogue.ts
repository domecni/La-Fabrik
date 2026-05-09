import { AudioManager } from "@/managers/AudioManager";
import { useSettingsStore } from "@/managers/stores/useSettingsStore";
import { useSubtitleStore } from "@/managers/stores/useSubtitleStore";
import type { DialogueManifest } from "@/types/dialogues/dialogues";
import { loadDialogueSubtitleCue } from "@/utils/dialogues/loadDialogueManifest";

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

  audio.addEventListener("timeupdate", syncSubtitle);
  audio.addEventListener("ended", cleanup);
  audio.addEventListener("pause", cleanup);
  syncSubtitle();

  return audio;
}
