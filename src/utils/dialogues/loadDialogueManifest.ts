import type {
  DialogueDefinition,
  DialogueManifest,
  DialogueVoice,
} from "@/types/dialogues/dialogues";
import { getDialogueCueIndices } from "@/types/dialogues/dialogues";
import type { SubtitleLanguage } from "@/types/settings/settings";
import { parseDialogueManifest } from "@/utils/dialogues/dialogueManifestValidation";
import { parseSrt } from "@/utils/subtitles/parseSrt";
import type { SubtitleCue } from "@/utils/subtitles/parseSrt";

const DIALOGUE_MANIFEST_PATH = "/sounds/dialogue/dialogues.json";
const DEFAULT_SUBTITLE_LANGUAGE: SubtitleLanguage = "fr";

let manifestCache: DialogueManifest | null = null;
let manifestPromise: Promise<DialogueManifest | null> | null = null;

export interface DialogueSubtitleCue {
  voice: DialogueVoice;
  cue: SubtitleCue;
  subtitlePath: string;
}

/**
 * Multiple subtitle cues for a single dialogue
 */
export interface DialogueSubtitleCues {
  voice: DialogueVoice;
  cues: SubtitleCue[];
  subtitlePath: string;
}

export async function loadDialogueManifest(): Promise<DialogueManifest | null> {
  if (manifestCache) return manifestCache;
  if (manifestPromise) return manifestPromise;

  manifestPromise = (async () => {
    const response = await fetch(DIALOGUE_MANIFEST_PATH);
    if (!response.ok) {
      manifestPromise = null;
      return null;
    }
    const manifest = parseDialogueManifest(await response.json());
    manifestCache = manifest;
    return manifest;
  })();

  return manifestPromise;
}

function getDialogueVoice(
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
  const result = await loadDialogueSubtitleCues(manifest, dialogue, language);
  const firstCue = result?.cues[0];
  if (!result || !firstCue) return null;

  return {
    voice: result.voice,
    cue: firstCue,
    subtitlePath: result.subtitlePath,
  };
}

export async function loadDialogueSubtitleCues(
  manifest: DialogueManifest,
  dialogue: DialogueDefinition,
  language: SubtitleLanguage,
): Promise<DialogueSubtitleCues | null> {
  const voice = getDialogueVoice(manifest, dialogue.voice);
  if (!voice) return null;

  const subtitles = await loadVoiceSubtitleCues(voice, language);
  if (!subtitles) return null;

  const cueIndices = getDialogueCueIndices(dialogue);
  if (cueIndices.length === 0) return null;

  const cues = cueIndices
    .map((index) => subtitles.cues.find((item) => item.index === index))
    .filter((cue): cue is SubtitleCue => cue !== undefined);

  if (cues.length === 0) return null;

  return {
    voice,
    cues,
    subtitlePath: subtitles.path,
  };
}

async function loadVoiceSubtitleCues(
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
