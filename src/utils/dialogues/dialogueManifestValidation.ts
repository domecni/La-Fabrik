import type {
  DialogueDefinition,
  DialogueManifest,
  DialogueSpeaker,
  DialogueVoice,
  DialogueVoiceId,
} from "@/types/dialogues/dialogues";

const VALID_VOICE_IDS = new Set<DialogueVoiceId>([
  "narrateur",
  "fermier",
  "electricienne",
]);
const VALID_SPEAKERS = new Set<DialogueSpeaker>([
  "Narrateur",
  "Fermier",
  "Electricienne",
]);

export function parseDialogueManifest(data: unknown): DialogueManifest {
  if (!isRecord(data)) {
    throw new Error("Dialogue manifest must be an object");
  }

  if (data.version !== 1) {
    throw new Error("Unsupported dialogue manifest version");
  }

  if (!Array.isArray(data.voices) || !Array.isArray(data.dialogues)) {
    throw new Error("Dialogue manifest requires voices and dialogues arrays");
  }

  const voices = data.voices.map(parseDialogueVoice);
  const voiceIds = new Set(voices.map((voice) => voice.id));
  const dialogues = data.dialogues.map((dialogue) =>
    parseDialogueDefinition(dialogue, voiceIds),
  );

  return {
    version: 1,
    voices,
    dialogues,
  };
}

function parseDialogueVoice(data: unknown): DialogueVoice {
  if (!isRecord(data)) {
    throw new Error("Dialogue voice must be an object");
  }

  if (!isDialogueVoiceId(data.id)) {
    throw new Error("Dialogue voice has an invalid id");
  }

  if (!isDialogueSpeaker(data.speaker)) {
    throw new Error(`Dialogue voice ${data.id} has an invalid speaker`);
  }

  if (!isRecord(data.subtitles)) {
    throw new Error(`Dialogue voice ${data.id} must define subtitles`);
  }

  const subtitles: DialogueVoice["subtitles"] = {};
  const frSubtitle = getOptionalPath(data.subtitles.fr);
  const enSubtitle = getOptionalPath(data.subtitles.en);
  if (frSubtitle) subtitles.fr = frSubtitle;
  if (enSubtitle) subtitles.en = enSubtitle;

  return {
    id: data.id,
    speaker: data.speaker,
    subtitles,
  };
}

function parseDialogueDefinition(
  data: unknown,
  voiceIds: Set<DialogueVoiceId>,
): DialogueDefinition {
  if (!isRecord(data)) {
    throw new Error("Dialogue definition must be an object");
  }

  if (typeof data.id !== "string" || data.id.length === 0) {
    throw new Error("Dialogue definition has an invalid id");
  }

  if (!isDialogueVoiceId(data.voice) || !voiceIds.has(data.voice)) {
    throw new Error(`Dialogue ${data.id} references an unknown voice`);
  }

  if (typeof data.audio !== "string" || data.audio.length === 0) {
    throw new Error(`Dialogue ${data.id} has an invalid audio path`);
  }

  const subtitleCueIndex = data.subtitleCueIndex;
  if (
    typeof subtitleCueIndex !== "number" ||
    !Number.isInteger(subtitleCueIndex) ||
    subtitleCueIndex < 1
  ) {
    throw new Error(`Dialogue ${data.id} has an invalid subtitle cue index`);
  }

  const timecode = data.timecode;
  if (timecode !== undefined && typeof timecode !== "number") {
    throw new Error(`Dialogue ${data.id} has an invalid timecode`);
  }

  const dialogue: DialogueDefinition = {
    id: data.id,
    voice: data.voice,
    audio: data.audio,
    subtitleCueIndex,
  };

  if (timecode !== undefined) dialogue.timecode = timecode;

  return dialogue;
}

function getOptionalPath(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isDialogueVoiceId(value: unknown): value is DialogueVoiceId {
  return (
    typeof value === "string" && VALID_VOICE_IDS.has(value as DialogueVoiceId)
  );
}

function isDialogueSpeaker(value: unknown): value is DialogueSpeaker {
  return (
    typeof value === "string" && VALID_SPEAKERS.has(value as DialogueSpeaker)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
