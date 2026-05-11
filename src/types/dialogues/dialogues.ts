import type { SubtitleLanguage } from "@/managers/stores/useSettingsStore";

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
  subtitleCueIndex: number;
  timecode?: number;
}

export interface DialogueManifest {
  version: 1;
  voices: DialogueVoice[];
  dialogues: DialogueDefinition[];
}
