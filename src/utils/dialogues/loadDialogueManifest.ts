import type {
  DialogueDefinition,
  DialogueManifest,
  DialogueVoice,
} from "@/types/dialogues/dialogues";
import type { SubtitleLanguage } from "@/managers/stores/useSettingsStore";
import { parseDialogueManifest } from "@/utils/dialogues/dialogueManifestValidation";
import { parseSrt } from "@/utils/subtitles/parseSrt";
import type { SubtitleCue } from "@/utils/subtitles/parseSrt";

const DIALOGUE_MANIFEST_PATH = "/sounds/dialogue/dialogues.json";
const DEFAULT_SUBTITLE_LANGUAGE: SubtitleLanguage = "fr";

export interface DialogueSubtitleCue {
  voice: DialogueVoice;
  cue: SubtitleCue;
  subtitlePath: string;
}

export async function loadDialogueManifest(): Promise<DialogueManifest | null> {
  const response = await fetch(DIALOGUE_MANIFEST_PATH);

  if (!response.ok) {
    return null;
  }

  return parseDialogueManifest(await response.json());
}

export function resolveDialogueSubtitlePath(
  manifest: DialogueManifest,
  dialogue: DialogueDefinition,
  language: SubtitleLanguage,
): string | null {
  const voice = getDialogueVoice(manifest, dialogue.voice);
  if (!voice) return null;

  return getVoiceSubtitlePath(voice, language);
}

export function getDialogueVoice(
  manifest: DialogueManifest,
  voiceId: DialogueDefinition["voice"],
): DialogueVoice | null {
  return manifest.voices.find((voice) => voice.id === voiceId) ?? null;
}

export async function loadDialogueSubtitleCue(
  manifest: DialogueManifest,
  dialogue: DialogueDefinition,
  language: SubtitleLanguage,
): Promise<DialogueSubtitleCue | null> {
  const voice = getDialogueVoice(manifest, dialogue.voice);
  if (!voice) return null;

  const subtitles = await loadVoiceSubtitleCues(voice, language);
  if (!subtitles) return null;

  const cue = subtitles.cues.find(
    (item) => item.index === dialogue.subtitleCueIndex,
  );

  if (!cue) return null;

  return {
    voice,
    cue,
    subtitlePath: subtitles.path,
  };
}

export async function loadVoiceSubtitleCues(
  voice: DialogueVoice,
  language: SubtitleLanguage,
): Promise<{ path: string; cues: SubtitleCue[] } | null> {
  const paths = getVoiceSubtitlePaths(voice, language);

  for (const path of paths) {
    const srtContent = await loadSrtContent(path);
    if (srtContent !== null) {
      return { path, cues: parseSrt(srtContent) };
    }
  }

  return null;
}

async function loadSrtContent(path: string): Promise<string | null> {
  const response = await fetch(path);

  if (!response.ok) {
    return null;
  }

  return response.text();
}

function getVoiceSubtitlePaths(
  voice: DialogueVoice,
  language: SubtitleLanguage,
): string[] {
  return [voice.subtitles[language], voice.subtitles[DEFAULT_SUBTITLE_LANGUAGE]]
    .filter((path): path is string => Boolean(path))
    .filter((path, index, paths) => paths.indexOf(path) === index);
}

function getVoiceSubtitlePath(
  voice: DialogueVoice,
  language: SubtitleLanguage,
): string | null {
  return (
    voice.subtitles[language] ??
    voice.subtitles[DEFAULT_SUBTITLE_LANGUAGE] ??
    null
  );
}
