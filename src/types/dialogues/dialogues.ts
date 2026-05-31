import type { SubtitleLanguage } from "@/types/settings/settings";

export type DialogueVoiceId = "narrateur" | "fermier" | "electricienne";
export type DialogueSpeaker = "Narrateur" | "Fermier" | "Electricienne";

export interface DialogueVoice {
  id: DialogueVoiceId;
  speaker: DialogueSpeaker;
  subtitles: Partial<Record<SubtitleLanguage, string>>;
}

export interface DialogueDefinition {
  id: string;
  voice: DialogueVoiceId;
  audio: string;
  subtitleCueIndex?: number;
  subtitleCueIndices?: number[];
  timecode?: number;
}

export interface DialogueManifest {
  version: 1;
  voices: DialogueVoice[];
  dialogues: DialogueDefinition[];
}

export function getDialogueCueIndices(dialogue: DialogueDefinition): number[] {
  if (dialogue.subtitleCueIndices && dialogue.subtitleCueIndices.length > 0) {
    return dialogue.subtitleCueIndices;
  }
  if (dialogue.subtitleCueIndex !== undefined) {
    return [dialogue.subtitleCueIndex];
  }
  return [];
}

export function getDialogueFirstCueIndex(
  dialogue: DialogueDefinition,
): number | undefined {
  const indices = getDialogueCueIndices(dialogue);
  return indices[0];
}
